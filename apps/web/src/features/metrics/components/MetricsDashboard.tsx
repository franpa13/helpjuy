import type { AdminMetricsDto, FunnelStep, MetricsWeek } from '@helpjuy/contracts';
import { Card, CardTitle } from '@/components/ui/card';

/*
 * Tablero de métricas. Un solo color (azul noche): no hay series que distinguir, así que el color no
 * codifica nada que no diga ya el texto. Cada número también está en una tabla.
 */

const nf = new Intl.NumberFormat('es-AR');
const pct = (part: number, total: number) => (total ? Math.round((part / total) * 100) : 0);
const shortDate = (iso: string) =>
  new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Jujuy', day: 'numeric', month: 'numeric' }).format(new Date(iso));

const STEP_LABEL: Record<FunnelStep, { title: string; hint: string }> = {
  accounts: { title: 'Creó su cuenta', hint: 'Todas las cuentas' },
  withProfile: { title: 'Armó su ficha', hint: 'Al menos una ficha creada' },
  activeQr: { title: 'QR activo', hint: 'Cargó un contacto de emergencia' },
  printed: { title: 'Lo imprimió', hint: 'Confirmó que imprimió el QR' },
  scanned: { title: 'Lo escanearon', hint: 'Alguien abrió una de sus fichas (90 días)' },
};

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <li className="grid content-start gap-1 border border-line border-t-4 border-t-night bg-white p-4">
      <span className="label">{label}</span>
      <span className="font-head text-[40px]/none font-extrabold tabular-nums">{value}</span>
      {sub && <span className="text-sm text-muted-foreground">{sub}</span>}
    </li>
  );
}

function Funnel({ steps }: { steps: AdminMetricsDto['funnel'] }) {
  const base = steps[0]?.count ?? 0;
  return (
    <ol className="grid list-none gap-3 p-0" aria-label="Embudo">
      {steps.map((s, i) => {
        const share = pct(s.count, base);
        const prev = i > 0 ? steps[i - 1]!.count : null;
        return (
          <li key={s.step} className="grid gap-1.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <span>
                <strong>{STEP_LABEL[s.step].title}</strong>{' '}
                <span className="text-sm text-muted-foreground">· {STEP_LABEL[s.step].hint}</span>
              </span>
              <span className="tabular-nums">
                <strong>{nf.format(s.count)}</strong> <span className="text-muted-foreground">({share} %)</span>
              </span>
            </div>
            {/* Barra plana con extremo redondeado; el ancho es la proporción sobre las cuentas. */}
            <span className="block h-3 bg-muted" aria-hidden="true">
              <span className="block h-full rounded-r-[4px] bg-night" style={{ width: `${share}%` }} />
            </span>
            {prev !== null && prev > 0 && (
              <span className="text-[13px] text-muted-foreground">{pct(s.count, prev)} % del paso anterior</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function WeeklyBars({ title, weeks, pick }: { title: string; weeks: MetricsWeek[]; pick: (w: MetricsWeek) => number }) {
  const values = weeks.map(pick);
  const max = Math.max(...values);
  const total = values.reduce((a, b) => a + b, 0);
  return (
    <Card className="grid gap-3 p-[18px]">
      <div className="flex items-baseline justify-between gap-3">
        <CardTitle className="mb-0 text-xl">{title}</CardTitle>
        <span className="text-sm text-muted-foreground tabular-nums">{nf.format(total)} en 8 semanas</span>
      </div>
      {max === 0 ? (
        <p className="py-6 text-center text-muted-foreground">Todavía no hay datos en estas semanas.</p>
      ) : (
        <div
          role="img"
          aria-label={`${title}: ${weeks.map((w, i) => `semana del ${shortDate(w.weekStart)}, ${values[i]}`).join('; ')}`}
          className="grid h-40 grid-cols-8 items-end gap-0.5 border-b border-line"
        >
          {weeks.map((w, i) => (
            // Zona de toque más grande que la barra; el valor aparece al pasar el mouse o tocar.
            <div key={w.weekStart} className="group relative flex h-full items-end justify-center" tabIndex={0}>
              <span
                data-bar
                className="block w-full max-w-9 rounded-t-[4px] bg-night transition-opacity group-hover:opacity-80"
                style={{ height: `${Math.max((values[i]! / max) * 100, values[i] ? 2 : 0)}%` }}
              />
              <span className="pointer-events-none absolute -top-1 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs text-white group-hover:block group-focus:block">
                {shortDate(w.weekStart)}: <strong>{values[i]}</strong>
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-8 gap-0.5 text-center text-[11px] text-muted-foreground" aria-hidden="true">
        {weeks.map((w) => (
          <span key={w.weekStart}>{shortDate(w.weekStart)}</span>
        ))}
      </div>
    </Card>
  );
}

export function MetricsDashboard({ metrics }: { metrics: AdminMetricsDto }) {
  const t = metrics.totals;
  return (
    <div className="grid gap-6">
      <ul className="grid list-none grid-cols-2 gap-3 p-0 min-[700px]:grid-cols-3 min-[1000px]:grid-cols-4" aria-label="Totales">
        <Tile label="Cuentas" value={nf.format(t.accounts)} sub={`${nf.format(t.verifiedAccounts)} con email confirmado`} />
        <Tile label="Fichas" value={nf.format(t.profiles)} sub={`${nf.format(t.familyProfiles)} de familiares`} />
        <Tile label="Avance promedio" value={`${t.avgCompletion} %`} sub="De lo que se puede cargar" />
        <Tile label="Actualizadas (30 días)" value={nf.format(t.updated30d)} sub="Fichas con algún cambio" />
        <Tile label="Escaneos (30 días)" value={nf.format(t.scans30d)} />
        <Tile label="Emergencias (30 días)" value={nf.format(t.alerts30d)} sub="Sin contar pruebas ni repetidas" />
        <Tile label="Grupos familiares" value={nf.format(t.familyGroups)} sub={`${t.avgGroupMembers} miembros en promedio`} />
        <Tile label="Entran con Google" value={`${pct(t.googleAccounts, t.accounts)} %`} sub={`${nf.format(t.withPhoto)} fichas con foto`} />
      </ul>

      <Card className="p-[18px]">
        <CardTitle>Embudo</CardTitle>
        <p className="mb-4 text-[15px] text-muted-foreground">
          Cuántas cuentas llegan a cada paso. Donde más cae, ahí hay que mejorar.
        </p>
        <Funnel steps={metrics.funnel} />
      </Card>

      <div className="grid gap-4 min-[1000px]:grid-cols-2">
        <WeeklyBars title="Cuentas nuevas por semana" weeks={metrics.weekly} pick={(w) => w.signups} />
        <WeeklyBars title="Escaneos por semana" weeks={metrics.weekly} pick={(w) => w.scans} />
      </div>

      <Card className="overflow-x-auto p-[18px]">
        <CardTitle>Los números, semana por semana</CardTitle>
        <table className="w-full text-left text-[15px] tabular-nums" aria-label="Por semana">
          <thead className="label">
            <tr className="border-b border-line [&>th]:py-2 [&>th]:pr-4">
              <th>Semana del</th>
              <th>Cuentas</th>
              <th>Fichas</th>
              <th>Escaneos</th>
              <th>Emergencias</th>
            </tr>
          </thead>
          <tbody>
            {metrics.weekly.map((w) => (
              <tr key={w.weekStart} className="border-b border-line [&>td]:py-2 [&>td]:pr-4">
                <td>{shortDate(w.weekStart)}</td>
                <td>{w.signups}</td>
                <td>{w.profiles}</td>
                <td>{w.scans}</td>
                <td>{w.alerts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {metrics.history.length > 0 && (
        <Card className="overflow-x-auto p-[18px]">
          <CardTitle>Evolución (una foto por día)</CardTitle>
          <table className="w-full text-left text-[15px] tabular-nums" aria-label="Evolución diaria">
            <thead className="label">
              <tr className="border-b border-line [&>th]:py-2 [&>th]:pr-4">
                <th>Día</th>
                <th>Cuentas</th>
                <th>Fichas</th>
                <th>Avance</th>
                <th>Escaneos 30 d</th>
              </tr>
            </thead>
            <tbody>
              {[...metrics.history].reverse().map((d) => (
                <tr key={d.day} className="border-b border-line [&>td]:py-2 [&>td]:pr-4">
                  <td>{d.day.split('-').reverse().join('/')}</td>
                  <td>{d.accounts}</td>
                  <td>{d.profiles}</td>
                  <td>{d.avgCompletion} %</td>
                  <td>{d.scans30d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
