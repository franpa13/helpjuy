import { HttpException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import type { EmergencyAlertInput, EmergencyAlertResultDto, ReceivedAlertDto } from '@helpjuy/contracts';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import { Mailer, type MailMessage } from '../mail/mailer.js';
import { FamilyService } from './family.service.js';

const DEDUPE_WINDOW_MS = 10 * 60 * 1000;
const TEST_COOLDOWN_MS = 10 * 60 * 1000;
const LOCATION_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const round3 = (n: number) => Math.round(n * 1000) / 1000;

const timeInJujuy = (d: Date) =>
  new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Jujuy', hour: '2-digit', minute: '2-digit' }).format(d);

type Recipient = { id: string; email: string };

@Injectable()
export class EmergencyAlertService {
  private readonly logger = new Logger('EmergencyAlert');

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: Mailer,
    private readonly family: FamilyService,
  ) {}

  /**
   * Dueño de la ficha + miembros no silenciados de todos sus grupos, sin repetir personas.
   * Solo emails verificados: así nadie puede usar los avisos para mandarle emails a una dirección ajena.
   */
  async recipients(ownerId: string): Promise<{ owner: Recipient | null; family: Recipient[] }> {
    const members = await this.prisma.familyMember.findMany({
      where: {
        muted: false,
        userId: { not: ownerId },
        user: { emailVerifiedAt: { not: null } },
        group: { members: { some: { userId: ownerId } } },
      },
      select: { user: { select: { id: true, email: true } } },
    });
    const owner = await this.prisma.user.findFirst({
      where: { id: ownerId, emailVerifiedAt: { not: null } },
      select: { id: true, email: true },
    });
    const family = [...new Map(members.map((m) => [m.user.id, m.user])).values()];
    return { owner, family };
  }

  async trigger(publicToken: string, input: EmergencyAlertInput): Promise<EmergencyAlertResultDto> {
    const profile = await this.prisma.profile.findUnique({ where: { publicToken } });
    if (!profile) throw new NotFoundException({ error: 'not_found' });

    const hasLocation = input.lat !== undefined && input.lng !== undefined;
    const lat = hasLocation ? round3(input.lat!) : null;
    const lng = hasLocation ? round3(input.lng!) : null;

    // Bajo un lock por perfil: dos toques simultáneos no pueden mandar dos tandas de emails.
    // La fila se reserva ANTES de enviar, así el segundo pedido la ve y queda suprimido.
    const reserved = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${profile.id}))`;
      const recent = await tx.emergencyAlert.findFirst({
        where: {
          profileId: profile.id,
          suppressed: false,
          test: false,
          createdAt: { gt: new Date(Date.now() - DEDUPE_WINDOW_MS) },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (recent) {
        await tx.emergencyAlert.create({
          data: { profileId: profile.id, lat, lng, notified: recent.notified, familyNotified: recent.familyNotified, suppressed: true },
        });
        return { recent };
      }
      return { alert: await tx.emergencyAlert.create({ data: { profileId: profile.id, lat, lng } }) };
    });
    if ('recent' in reserved && reserved.recent) {
      return { notified: reserved.recent.notified, family: reserved.recent.familyNotified };
    }
    const alert = reserved.alert!;

    const { owner, family } = await this.recipients(profile.ownerId);
    const name = `${profile.firstName} ${profile.lastName}`;
    const at = new Date();
    const send = (r: Recipient) => this.sendSafely(this.alertMessage(r.email, name, profile.firstName, at, lat, lng));
    const [ownerOk, ...familyOk] = await Promise.all([owner ? send(owner) : Promise.resolve(false), ...family.map(send)]);
    const familySent = familyOk.filter(Boolean).length;
    const notified = familySent + (ownerOk ? 1 : 0);
    const attempted = family.length + (owner ? 1 : 0);

    if (attempted > 0 && notified === 0) {
      // No salió ningún email: no cuenta para la espera de 10 minutos, así se puede reintentar.
      await this.prisma.emergencyAlert.delete({ where: { id: alert.id } });
      throw new ServiceUnavailableException({ error: 'send_failed' });
    }
    await this.prisma.emergencyAlert.update({ where: { id: alert.id }, data: { notified, familyNotified: familySent } });
    return { notified, family: familySent };
  }

  /** "Probar aviso": para que la familia sepa que funciona antes de que haga falta. Una vez cada 10 minutos por grupo. */
  async test(adminId: string, groupId: string): Promise<EmergencyAlertResultDto> {
    const group = await this.family.requireAdmin(adminId, groupId);
    const since = new Date(Date.now() - TEST_COOLDOWN_MS);
    const { count } = await this.prisma.familyGroup.updateMany({
      where: { id: groupId, OR: [{ lastTestAlertAt: null }, { lastTestAlertAt: { lt: since } }] },
      data: { lastTestAlertAt: new Date() },
    });
    if (count === 0) throw new HttpException({ error: 'test_alert_cooldown' }, 429);

    const members = await this.prisma.familyMember.findMany({
      where: { groupId, muted: false, user: { emailVerifiedAt: { not: null } } },
      select: { userId: true, user: { select: { email: true } } },
    });
    const web = process.env.WEB_URL ?? 'http://localhost:3000';
    const results = await Promise.all(
      members.map(async ({ userId, user }) => ({
        self: userId === adminId,
        ok: await this.sendSafely({
          to: user.email,
          subject: `[PRUEBA] Aviso de emergencia de ${group.name}`,
          text: `Esto es una prueba, no pasó nada.\n\nSi alguien escanea el QR de un miembro de "${group.name}" y marca una emergencia, te va a llegar un email como este.\n\nPodés silenciar el grupo desde ${web}/panel/familia.`,
          html: `<p><strong>Esto es una prueba, no pasó nada.</strong></p><p>Si alguien escanea el QR de un miembro de "${escape(group.name)}" y marca una emergencia, te va a llegar un email como este.</p>`,
        }),
      })),
    );
    const sent = results.filter((r) => r.ok);
    return { notified: sent.length, family: sent.filter((r) => !r.self).length };
  }

  /**
   * Historial de "Avisos recibidos": los de mis fichas y los de las fichas de mi familia,
   * pero de cada grupo solo los posteriores a mi ingreso (quien entra no ve ubicaciones viejas).
   * Sin toques repetidos ni pruebas, y solo de los últimos 30 días.
   */
  async history(userId: string): Promise<ReceivedAlertDto[]> {
    const memberships = await this.prisma.familyMember.findMany({
      where: { userId },
      select: { joinedAt: true, group: { select: { members: { where: { userId: { not: userId } }, select: { userId: true } } } } },
    });
    const since = new Date(Date.now() - LOCATION_RETENTION_MS);
    const alerts = await this.prisma.emergencyAlert.findMany({
      where: {
        suppressed: false,
        test: false,
        createdAt: { gte: since },
        OR: [
          { profile: { ownerId: userId } },
          ...memberships.map((m) => ({
            profile: { ownerId: { in: m.group.members.map((o) => o.userId) } },
            createdAt: { gte: m.joinedAt },
          })),
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, createdAt: true, lat: true, lng: true, profile: { select: { ownerId: true, firstName: true, lastName: true } } },
    });
    return alerts.map((a) => ({
      id: a.id,
      at: a.createdAt.toISOString(),
      profileName: `${a.profile.firstName} ${a.profile.lastName}`,
      mine: a.profile.ownerId === userId,
      location: a.lat !== null && a.lng !== null ? { lat: a.lat, lng: a.lng } : null,
    }));
  }

  private alertMessage(to: string, name: string, firstName: string, at: Date, lat: number | null, lng: number | null): MailMessage {
    const web = process.env.WEB_URL ?? 'http://localhost:3000';
    const map = lat !== null && lng !== null ? `https://www.google.com/maps?q=${lat},${lng}` : null;
    const where = map ? ` Ubicación aproximada: ${map}` : '';
    const text = [
      `Alguien escaneó la ficha de ${name} a las ${timeInJujuy(at)} y marcó que es una emergencia.${where}`,
      '',
      `Puede no ser real. Intentá comunicarte con ${firstName}. Si no responde, llamá al 107.`,
      '',
      `Recibís este aviso porque estás en un grupo familiar de HelpJuy. Podés silenciarlo desde ${web}/panel/familia.`,
    ].join('\n');
    const html = `
<div style="font-family:Arial,sans-serif;max-width:520px;color:#141414">
  <p style="background:#c8102e;color:#fff;padding:10px 14px;font-weight:700;margin:0">Posible emergencia: ${escape(name)}</p>
  <p>Alguien escaneó la ficha de <strong>${escape(name)}</strong> a las ${timeInJujuy(at)} y marcó que es una emergencia.</p>
  ${map ? `<p><a href="${map}">Ver ubicación aproximada en el mapa</a></p>` : ''}
  <p><strong>Puede no ser real.</strong> Intentá comunicarte con ${escape(firstName)}. Si no responde, llamá al <a href="tel:107">107</a>.</p>
  <p style="color:#6b6b6b;font-size:13px">Recibís este aviso porque estás en un grupo familiar de HelpJuy. <a href="${web}/panel/familia">Silenciar</a>.</p>
</div>`;
    return { to, subject: `Posible emergencia: ${name}`, text, html };
  }

  /** true si se envió. No loguea la dirección (dato personal). */
  private async sendSafely(msg: MailMessage): Promise<boolean> {
    try {
      await this.mailer.send(msg);
      return true;
    } catch (err) {
      this.logger.error(`No se pudo enviar un aviso: ${(err as Error).message}`);
      return false;
    }
  }
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
