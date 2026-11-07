import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import { SCAN_RETENTION_MS } from '../emergency-card/scan.service.js';

const DAY = 24 * 60 * 60 * 1000;
/** Spec: la ubicación aproximada de un aviso se borra a los 30 días (el aviso queda, sin ubicación). */
const LOCATION_RETENTION_MS = 30 * DAY;
/** Un token ya usado no sirve para nada: lo guardamos un día por si hay que revisar algo. */
const USED_TOKEN_GRACE_MS = DAY;

export type MaintenanceResult = { sessions: number; emailTokens: number; invites: number; locations: number; scans: number };

/**
 * Limpieza de lo que vence. Corre todas las noches mientras la API está despierta y también
 * se puede disparar desde un cron externo (POST /internal/maintenance), porque en el plan gratis la API se duerme.
 */
@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger('Maintenance');

  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 4 * * *', { timeZone: 'America/Argentina/Jujuy' })
  async nightly(): Promise<void> {
    const r = await this.run();
    this.logger.log(`Limpieza: ${JSON.stringify(r)}`);
  }

  async run(now: Date = new Date()): Promise<MaintenanceResult> {
    const before = (ms: number) => new Date(now.getTime() - ms);
    const [sessions, emailTokens, invites, locations, scans] = await Promise.all([
      this.prisma.session.deleteMany({ where: { expiresAt: { lt: now } } }),
      this.prisma.emailToken.deleteMany({
        where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { lt: before(USED_TOKEN_GRACE_MS) } }] },
      }),
      this.prisma.familyInvite.deleteMany({
        where: { OR: [{ expiresAt: { lt: now } }, { usedAt: { not: null } }, { revokedAt: { not: null } }] },
      }),
      this.prisma.emergencyAlert.updateMany({
        where: { createdAt: { lt: before(LOCATION_RETENTION_MS) }, OR: [{ lat: { not: null } }, { lng: { not: null } }] },
        data: { lat: null, lng: null },
      }),
      this.prisma.cardScan.deleteMany({ where: { createdAt: { lt: before(SCAN_RETENTION_MS) } } }),
    ]);
    return {
      sessions: sessions.count,
      emailTokens: emailTokens.count,
      invites: invites.count,
      locations: locations.count,
      scans: scans.count,
    };
  }
}
