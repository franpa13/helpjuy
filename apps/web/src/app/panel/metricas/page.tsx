import type { AdminAccountsDto, AdminMetricsDto } from '@helpjuy/contracts';
import { notFound } from 'next/navigation';
import { AccountsTable } from '@/features/metrics/components/AccountsTable';
import { MetricsDashboard } from '@/features/metrics/components/MetricsDashboard';
import { PanelPage } from '@/features/panel/components/PanelPage';
import { apiServer } from '@/shared/api/server';

export const metadata = { title: 'Métricas — HelpJuy', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

/** Solo para los emails de ADMIN_EMAILS (en la API). A cualquier otro le responde "no encontrada". */
export default async function MetricasPage({ searchParams }: PageProps<'/panel/metricas'>) {
  const params = await searchParams;
  const q = first(params.q).trim().slice(0, 100);
  const page = Math.min(Math.max(Number.parseInt(first(params.pagina), 10) || 1, 1), 10_000);
  const query = new URLSearchParams({ page: String(page) });
  if (q) query.set('q', q);

  const [metrics, accounts] = await Promise.all([
    apiServer<AdminMetricsDto>('/admin/metrics'),
    apiServer<AdminAccountsDto>(`/admin/accounts?${query.toString()}`),
  ]);
  if (!metrics || !accounts) notFound();
  const at = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Jujuy',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(metrics.generatedAt));

  return (
    <PanelPage title="Métricas" subtitle={`Cómo se usa HelpJuy y quién se registró. Nunca datos médicos. Actualizado: ${at}.`}>
      <div className="grid gap-6">
        <MetricsDashboard metrics={metrics} />
        <AccountsTable data={accounts} />
      </div>
    </PanelPage>
  );
}
