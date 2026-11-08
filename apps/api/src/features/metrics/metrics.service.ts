import { Injectable } from '@nestjs/common';
import { completion, isActive, type AdminMetricsDto, type MetricsTotals, type MetricsWeek } from '@helpjuy/contracts';
import { MedicalCipher } from '../../shared/crypto/medical-cipher.js';
import { PrismaService } from '../../shared/prisma/prisma.service.js';

const DAY = 24 * 60 * 60 * 1000;
const WEEKS = 8;

/** Fecha de hoy (AAAA-MM-DD) en Jujuy: la foto diaria es "del día" según el reloj de acá. */
const todayInJujuy = (now: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Jujuy', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);

/**
 * Métricas de uso calculadas desde la base. Solo agregados: nunca devuelve nombres, emails ni datos médicos.
 * Para saber si un QR está activo o cuánto se completó una ficha hay que descifrarla; el resultado son solo totales.
 */
@Injectable()
export class MetricsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cipher: MedicalCipher,
  ) {}

  async compute(now: Date = new Date()): Promise<AdminMetricsDto> {
    const since30 = new Date(now.getTime() - 30 * DAY);
    const realAlert = { suppressed: false, test: false };

    const [accounts, verifiedAccounts, googleAccounts, profiles, familyProfiles, withPhoto, updated30d, scans30d, alerts30d, groups, members] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { emailVerifiedAt: { not: null } } }),
        this.prisma.user.count({ where: { googleId: { not: null } } }),
        this.prisma.profile.count(),
        this.prisma.profile.count({ where: { relationship: { not: 'SELF' } } }),
        this.prisma.profile.count({ where: { photoUpdatedAt: { not: null } } }),
        this.prisma.medicalRecord.count({ where: { updatedAt: { gte: since30 } } }),
        this.prisma.cardScan.count({ where: { createdAt: { gte: since30 } } }),
        this.prisma.emergencyAlert.count({ where: { ...realAlert, createdAt: { gte: since30 } } }),
        this.prisma.familyGroup.count(),
        this.prisma.familyMember.count(),
      ]);

    // Ficha activa (tiene contacto) y avance: hay que descifrar. Se quedan acá: solo salen los totales.
    const records = await this.prisma.medicalRecord.findMany({ select: { ciphertext: true, profile: { select: { ownerId: true } } } });
    const activeOwners = new Set<string>();
    let completionSum = 0;
    for (const r of records) {
      const data = this.cipher.decrypt(r.ciphertext);
      completionSum += completion(data);
      if (isActive(data)) activeOwners.add(r.profile.ownerId);
    }

    const [withProfile, printed, scanned] = await Promise.all([
      this.prisma.user.count({ where: { profiles: { some: {} } } }),
      this.prisma.user.count({ where: { profiles: { some: { printedAt: { not: null } } } } }),
      this.prisma.user.count({ where: { profiles: { some: { scans: { some: {} } } } } }),
    ]);

    const totals: MetricsTotals = {
      accounts,
      verifiedAccounts,
      googleAccounts,
      profiles,
      familyProfiles,
      withPhoto,
      // Las fichas sin nada cargado cuentan como 0 %.
      avgCompletion: profiles ? Math.round(completionSum / profiles) : 0,
      updated30d,
      scans30d,
      alerts30d,
      familyGroups: groups,
      avgGroupMembers: groups ? Math.round((members / groups) * 10) / 10 : 0,
    };

    const weekly: MetricsWeek[] = [];
    for (let i = WEEKS - 1; i >= 0; i--) {
      const from = new Date(now.getTime() - (i + 1) * 7 * DAY);
      const to = new Date(now.getTime() - i * 7 * DAY + 1);
      const range = { gte: from, lt: to };
      const [signups, newProfiles, scans, alerts] = await Promise.all([
        this.prisma.user.count({ where: { createdAt: range } }),
        this.prisma.profile.count({ where: { createdAt: range } }),
        this.prisma.cardScan.count({ where: { createdAt: range } }),
        this.prisma.emergencyAlert.count({ where: { ...realAlert, createdAt: range } }),
      ]);
      weekly.push({ weekStart: from.toISOString(), signups, profiles: newProfiles, scans, alerts });
    }

    const snapshots = await this.prisma.metricsSnapshot.findMany({
      where: { day: { gte: new Date(now.getTime() - 90 * DAY) } },
      orderBy: { day: 'asc' },
    });

    return {
      generatedAt: now.toISOString(),
      totals,
      funnel: [
        { step: 'accounts', count: accounts },
        { step: 'withProfile', count: withProfile },
        { step: 'activeQr', count: activeOwners.size },
        { step: 'printed', count: printed },
        { step: 'scanned', count: scanned },
      ],
      weekly,
      history: snapshots.map((s) => ({ day: s.day.toISOString().slice(0, 10), ...(s.data as MetricsTotals) })),
    };
  }

  /** Foto diaria de los totales. Si ya hay una de hoy, la actualiza. */
  async snapshot(now: Date = new Date()): Promise<void> {
    const { totals } = await this.compute(now);
    const day = new Date(`${todayInJujuy(now)}T00:00:00.000Z`);
    await this.prisma.metricsSnapshot.upsert({ where: { day }, create: { day, data: totals }, update: { data: totals } });
  }
}
