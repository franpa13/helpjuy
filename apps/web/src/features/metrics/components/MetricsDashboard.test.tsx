import type { AdminMetricsDto } from '@helpjuy/contracts';
import { render, screen, within } from '@testing-library/react';
import { MetricsDashboard } from './MetricsDashboard';

const week = (i: number, signups: number, scans: number) => ({
  weekStart: new Date(Date.UTC(2026, 8, 14 + i * 7)).toISOString(),
  signups,
  profiles: signups,
  scans,
  alerts: 0,
});

const metrics: AdminMetricsDto = {
  generatedAt: '2026-11-07T12:00:00.000Z',
  totals: {
    accounts: 100,
    verifiedAccounts: 80,
    googleAccounts: 30,
    profiles: 90,
    familyProfiles: 20,
    withPhoto: 10,
    avgCompletion: 64,
    updated30d: 40,
    scans30d: 25,
    alerts30d: 2,
    familyGroups: 12,
    avgGroupMembers: 2.5,
  },
  funnel: [
    { step: 'accounts', count: 100 },
    { step: 'withProfile', count: 70 },
    { step: 'activeQr', count: 50 },
    { step: 'printed', count: 40 },
    { step: 'scanned', count: 10 },
  ],
  weekly: Array.from({ length: 8 }, (_, i) => week(i, i * 2, i)),
  history: [],
};

describe('MetricsDashboard', () => {
  it('muestra los totales principales', () => {
    render(<MetricsDashboard metrics={metrics} />);
    const tiles = screen.getByRole('list', { name: 'Totales' });
    expect(within(tiles).getByText('Cuentas').closest('li')).toHaveTextContent('100');
    expect(within(tiles).getByText('Escaneos (30 días)').closest('li')).toHaveTextContent('25');
  });

  it('el embudo dice cuántos llegan a cada paso y qué porcentaje de las cuentas es', () => {
    render(<MetricsDashboard metrics={metrics} />);
    const funnel = screen.getByRole('list', { name: 'Embudo' });
    const steps = within(funnel).getAllByRole('listitem');
    expect(steps).toHaveLength(5);
    expect(steps[1]).toHaveTextContent('Armó su ficha');
    expect(steps[1]).toHaveTextContent('70');
    expect(steps[1]).toHaveTextContent('70 %');
    expect(steps[4]).toHaveTextContent('10 %');
  });

  it('cada gráfico semanal tiene sus 8 barras con el valor accesible, y una tabla con los números', () => {
    render(<MetricsDashboard metrics={metrics} />);
    const chart = screen.getByRole('img', { name: /Cuentas nuevas por semana/ });
    expect(chart.querySelectorAll('[data-bar]')).toHaveLength(8);
    expect(screen.getByRole('table', { name: 'Por semana' })).toBeInTheDocument();
  });

  it('sin datos todavía, lo dice en vez de dibujar barras vacías', () => {
    const empty = { ...metrics, weekly: metrics.weekly.map((w) => ({ ...w, signups: 0, scans: 0 })) };
    render(<MetricsDashboard metrics={empty} />);
    expect(screen.getAllByText('Todavía no hay datos en estas semanas.').length).toBeGreaterThan(0);
  });
});
