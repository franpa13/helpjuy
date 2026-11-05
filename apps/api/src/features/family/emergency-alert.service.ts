import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { EmergencyAlertInput, EmergencyAlertResultDto } from '@helpjuy/contracts';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import { Mailer, type MailMessage } from '../mail/mailer.js';
import { FamilyService } from './family.service.js';

const DEDUPE_WINDOW_MS = 10 * 60 * 1000;
const round3 = (n: number) => Math.round(n * 1000) / 1000;

const timeInJujuy = (d: Date) =>
  new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Jujuy', hour: '2-digit', minute: '2-digit' }).format(d);

@Injectable()
export class EmergencyAlertService {
  private readonly logger = new Logger('EmergencyAlert');

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: Mailer,
    private readonly family: FamilyService,
  ) {}

  /** Dueño de la ficha + miembros no silenciados de todos sus grupos, sin repetir personas. */
  async recipients(ownerId: string): Promise<string[]> {
    const members = await this.prisma.familyMember.findMany({
      where: { muted: false, group: { members: { some: { userId: ownerId } } } },
      select: { user: { select: { id: true, email: true } } },
    });
    const owner = await this.prisma.user.findUniqueOrThrow({ where: { id: ownerId }, select: { id: true, email: true } });
    const byId = new Map([[owner.id, owner.email]]);
    for (const m of members) byId.set(m.user.id, m.user.email);
    return [...byId.values()];
  }

  async trigger(publicToken: string, input: EmergencyAlertInput): Promise<EmergencyAlertResultDto> {
    const profile = await this.prisma.profile.findUnique({ where: { publicToken } });
    if (!profile) throw new NotFoundException({ error: 'not_found' });

    const lat = input.lat !== undefined && input.lng !== undefined ? round3(input.lat) : null;
    const lng = input.lat !== undefined && input.lng !== undefined ? round3(input.lng) : null;

    // Un aviso cada 10 minutos por persona: un doble toque o una broma no llena de emails a la familia.
    const recent = await this.prisma.emergencyAlert.findFirst({
      where: { profileId: profile.id, suppressed: false, test: false, createdAt: { gt: new Date(Date.now() - DEDUPE_WINDOW_MS) } },
      orderBy: { createdAt: 'desc' },
    });
    if (recent) {
      await this.prisma.emergencyAlert.create({
        data: { profileId: profile.id, lat, lng, notified: recent.notified, suppressed: true },
      });
      return { notified: recent.notified };
    }

    const to = await this.recipients(profile.ownerId);
    const name = `${profile.firstName} ${profile.lastName}`;
    const now = new Date();
    await Promise.all(to.map((email) => this.sendSafely(this.alertMessage(email, name, profile.firstName, now, lat, lng))));
    await this.prisma.emergencyAlert.create({ data: { profileId: profile.id, lat, lng, notified: to.length } });
    return { notified: to.length };
  }

  /** "Probar aviso": para que la familia sepa que funciona antes de que haga falta. */
  async test(adminId: string, groupId: string): Promise<EmergencyAlertResultDto> {
    const group = await this.family.requireAdmin(adminId, groupId);
    const members = await this.prisma.familyMember.findMany({
      where: { groupId, muted: false },
      select: { user: { select: { email: true } } },
    });
    const web = process.env.WEB_URL ?? 'http://localhost:3000';
    await Promise.all(
      members.map(({ user }) =>
        this.sendSafely({
          to: user.email,
          subject: `[PRUEBA] Aviso de emergencia de ${group.name}`,
          text: `Esto es una prueba, no pasó nada.\n\nSi alguien escanea el QR de un miembro de "${group.name}" y marca una emergencia, te va a llegar un email como este.\n\nPodés silenciar el grupo desde ${web}/panel/familia.`,
          html: `<p><strong>Esto es una prueba, no pasó nada.</strong></p><p>Si alguien escanea el QR de un miembro de "${escape(group.name)}" y marca una emergencia, te va a llegar un email como este.</p>`,
        }),
      ),
    );
    return { notified: members.length };
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

  private async sendSafely(msg: MailMessage): Promise<void> {
    try {
      await this.mailer.send(msg);
    } catch (err) {
      this.logger.error(`No se pudo enviar el aviso a ${msg.to}: ${(err as Error).message}`);
    }
  }
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
