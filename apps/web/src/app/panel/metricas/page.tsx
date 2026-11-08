import type { AdminMetricsDto } from '@helpjuy/contracts';
import { notFound } from 'next/navigation';
import { MetricsDashboard } from '@/features/metrics/components/MetricsDashboard';
import { PanelPage } from '@/features/panel/components/PanelPage';
import { apiServer } from '@/shared/api/server';

export const metadata = { title: 'Métricas — HelpJuy', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

/** Solo para los emails de ADMIN_EMAILS (en la API). A cualquier otro le responde "no encontrada". */
export default async function MetricasPage() {
  const metrics = await apiServer<AdminMetricsDto>('/admin/metrics');
  if (!metrics) notFound();
  const at = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Jujuy',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(metrics.generatedAt));

  return (
    <PanelPage title="Métricas" subtitle={`Cómo se usa HelpJuy. Solo números: nunca datos de nadie. Actualizado: ${at}.`}>
      <MetricsDashboard metrics={metrics} />
    </PanelPage>
  );
}
