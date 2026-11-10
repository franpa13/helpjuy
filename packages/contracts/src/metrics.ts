import { z } from 'zod';

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

/** Una cuenta en la lista de administración. Nunca datos médicos ni nombres de las fichas. */
export type AdminAccountRow = {
  id: string;
  email: string;
  createdAt: string;
  emailVerified: boolean;
  /** Entra con Google. */
  google: boolean;
  /** Tiene contraseña (se registró con email). */
  password: boolean;
  profiles: number;
  /** Alguna de sus fichas tiene un contacto de emergencia cargado. */
  activeQr: boolean;
  printed: boolean;
  inFamily: boolean;
  /** Último inicio de sesión que todavía tenemos registrado (las sesiones vencidas se borran). */
  lastLoginAt: string | null;
};

export const ADMIN_ACCOUNTS_PAGE_SIZE = 25;

export const adminAccountsQuerySchema = z.object({
  q: z.string().trim().max(100).optional().default(''),
  page: z.coerce.number().int().min(1).max(10_000).optional().default(1),
});
export type AdminAccountsQuery = z.infer<typeof adminAccountsQuerySchema>;

export type AdminAccountsDto = { total: number; page: number; pageSize: number; q: string; items: AdminAccountRow[] };
