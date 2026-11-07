import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { ScanDto } from '@helpjuy/contracts';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import { Mailer } from '../mail/mailer.js';

const DEDUPE_MS = 10 * 60 * 1000;
const EMAIL_EVERY_MS = 60 * 60 * 1000;
const RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

const timeInJujuy = (d: Date) =>
  new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Jujuy', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d);

/**
 * "Sabés cuándo lo escanean": cada apertura de la ficha pública queda registrada (sin IP ni datos de quien la abrió)
 * y el titular recibe un email, como mucho uno por hora por ficha.
 */
@Injectable()
export class ScanService {
  private readonly logger = new Logger('Scans');

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: Mailer,
  ) {}

  async record(publicToken: string, viewerId: string | null): Promise<void> {
    const profile = await this.prisma.profile.findUnique({
      where: { publicToken },
      select: { id: true, ownerId: true, firstName: true, lastName: true, lastScanEmailAt: true, owner: { select: { email: true, emailVerifiedAt: true } } },
    });
    if (!profile) throw new NotFoundException({ error: 'not_found' });
    // El titular revisando su propia ficha no es un escaneo.
    if (viewerId === profile.ownerId) return;

    const now = new Date();
    const recent = await this.prisma.cardScan.count({
      where: { profileId: profile.id, createdAt: { gt: new Date(now.getTime() - DEDUPE_MS) } },
    });
    if (recent > 0) return;
    await this.prisma.cardScan.create({ data: { profileId: profile.id } });

    const canEmail = profile.owner.emailVerifiedAt && (!profile.lastScanEmailAt || now.getTime() - profile.lastScanEmailAt.getTime() > EMAIL_EVERY_MS);
    if (!canEmail) return;
    // Se marca antes de mandar: dos escaneos casi simultáneos no generan dos emails.
    const { count } = await this.prisma.profile.updateMany({
      where: { id: profile.id, lastScanEmailAt: profile.lastScanEmailAt },
      data: { lastScanEmailAt: now },
    });
    if (count === 0) return;
    await this.mailer.send(this.message(profile.owner.email, `${profile.firstName} ${profile.lastName}`, now)).catch((err: Error) => {
      this.logger.error(`No se pudo avisar el escaneo: ${err.message}`);
    });
  }

  async history(ownerId: string): Promise<ScanDto[]> {
    await this.forgetOld();
    const scans = await this.prisma.cardScan.findMany({
      where: { profile: { ownerId } },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: { id: true, createdAt: true, profile: { select: { firstName: true, lastName: true } } },
    });
    return scans.map((s) => ({ id: s.id, at: s.createdAt.toISOString(), profileName: `${s.profile.firstName} ${s.profile.lastName}` }));
  }

  /** Spec: los escaneos se guardan 90 días. */
  async forgetOld(): Promise<void> {
    await this.prisma.cardScan.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - RETENTION_MS) } } });
  }

  private message(to: string, name: string, at: Date) {
    const web = process.env.WEB_URL ?? 'http://localhost:3000';
    const text = [
      `Alguien abrió la ficha de emergencia de ${name} a las ${timeInJujuy(at)}.`,
      '',
      'Puede ser un control, alguien que encontró tu billetera o una emergencia. Si fue una emergencia, quien la abrió puede avisar a tu familia desde la ficha.',
      '',
      `Si no reconocés este escaneo o perdiste el sticker o la tarjeta, generá un QR nuevo desde ${web}/panel: el viejo deja de funcionar.`,
      '',
      'Te avisamos como mucho una vez por hora por ficha.',
    ].join('\n');
    const html = `
<div style="font-family:Arial,sans-serif;max-width:520px;color:#141414">
  <p style="background:#0f2236;color:#fff;padding:10px 14px;font-weight:700;margin:0">Alguien abrió la ficha de ${escape(name)}</p>
  <p>Alguien abrió la ficha de emergencia de <strong>${escape(name)}</strong> a las ${timeInJujuy(at)}.</p>
  <p>Puede ser un control, alguien que encontró tu billetera o una emergencia.</p>
  <p>Si no lo reconocés o perdiste el sticker, <a href="${web}/panel">generá un QR nuevo</a>: el viejo deja de funcionar.</p>
  <p style="color:#6b6b6b;font-size:13px">Te avisamos como mucho una vez por hora por ficha.</p>
</div>`;
    return { to, subject: `Alguien abrió la ficha de ${name}`, text, html };
  }
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
