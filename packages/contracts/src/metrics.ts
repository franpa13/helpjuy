/** Totales de la app (solo números: nunca nombres, emails ni datos médicos). */
export type MetricsTotals = {
  accounts: number;
  verifiedAccounts: number;
  googleAccounts: number;
  profiles: number;
  /** Fichas de otras personas (hijos, padres…). */
  familyProfiles: number;
  withPhoto: number;
  /** Promedio de avance de las fichas (0–100). */
  avgCompletion: number;
  /** Fichas con algún cambio en los últimos 30 días. */
  updated30d: number;
  scans30d: number;
  alerts30d: number;
  familyGroups: number;
  avgGroupMembers: number;
};

export type FunnelStep = 'accounts' | 'withProfile' | 'activeQr' | 'printed' | 'scanned';

export type MetricsWeek = { weekStart: string; signups: number; profiles: number; scans: number; alerts: number };

export type MetricsHistoryDay = { day: string } & MetricsTotals;

export type AdminMetricsDto = {
  generatedAt: string;
  totals: MetricsTotals;
  /** Cuántas cuentas llegaron a cada paso. */
  funnel: { step: FunnelStep; count: number }[];
  /** Últimas 8 semanas (ventanas de 7 días que terminan hoy), de la más vieja a la más nueva. */
  weekly: MetricsWeek[];
  /** Fotos diarias guardadas (últimos 90 días). */
  history: MetricsHistoryDay[];
};
