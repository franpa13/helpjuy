import type { AdminAccountRow, AdminAccountsDto } from '@helpjuy/contracts';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/** Cuentas registradas, para administrar. Solo datos de la cuenta: nunca datos médicos ni nombres de fichas. */

const day = (iso: string) =>
  new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Jujuy', day: 'numeric', month: 'numeric', year: 'numeric' }).format(
    new Date(iso),
  );

const method = (a: AdminAccountRow) => (a.google && a.password ? 'Google y email' : a.google ? 'Google' : 'Email');

/** Sí/No escrito (el color acompaña, no reemplaza). */
function YesNo({ value }: { value: boolean }) {
  return <span className={cn('font-bold', value ? 'text-green' : 'text-muted-foreground')}>{value ? 'Sí' : 'No'}</span>;
}

const pageHref = (q: string, page: number) => {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  params.set('pagina', String(page));
  return `/panel/metricas?${params.toString()}#cuentas`;
};

export function AccountsTable({ data }: { data: AdminAccountsDto }) {
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const pager = cn(buttonVariants({ variant: 'outline', size: 'compact' }), 'gap-1.5 bg-white');

  return (
    <Card id="cuentas" className="grid scroll-mt-6 gap-4 p-[18px]">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <CardTitle className="mb-0">Cuentas</CardTitle>
        <span className="text-sm text-muted-foreground tabular-nums">
          {data.total} {data.total === 1 ? 'cuenta' : 'cuentas'}
          {data.q ? ` con "${data.q}"` : ''}
        </span>
      </div>
      <p className="-mt-2 text-[15px] text-muted-foreground">
        Email, cuándo se registró y hasta dónde llegó. Nunca se ven datos médicos ni los nombres de las fichas.
      </p>

      <form method="get" action="/panel/metricas#cuentas" role="search" className="flex gap-2">
        <Input
          type="search"
          name="q"
          defaultValue={data.q}
          maxLength={100}
          placeholder="Buscar por email"
          aria-label="Buscar por email"
          className="min-w-0 flex-1 bg-white"
        />
        <Button type="submit" size="compact" className="gap-1.5">
          <Search size={18} aria-hidden="true" />
          Buscar
        </Button>
      </form>

      {data.items.length === 0 ? (
        <p className="py-6 text-center text-muted-foreground">
          {data.q ? `No hay cuentas con "${data.q}" en el email.` : 'Todavía no hay cuentas.'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-[15px] tabular-nums" aria-label="Cuentas registradas">
            <thead className="label">
              <tr className="border-b border-line [&>th]:py-2 [&>th]:pr-4 [&>th]:whitespace-nowrap">
                <th>Email</th>
                <th>Alta</th>
                <th>Entra con</th>
                <th>Email confirmado</th>
                <th>Fichas</th>
                <th>QR activo</th>
                <th>Impreso</th>
                <th>Familia</th>
                <th>Último ingreso</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((a) => (
                <tr key={a.id} className="border-b border-line [&>td]:py-2 [&>td]:pr-4">
                  <th scope="row" className="max-w-[260px] truncate py-2 pr-4 font-bold" title={a.email}>
                    {a.email}
                  </th>
                  <td>{day(a.createdAt)}</td>
                  <td>{method(a)}</td>
                  <td>
                    <YesNo value={a.emailVerified} />
                  </td>
                  <td>{a.profiles}</td>
                  <td>
                    <YesNo value={a.activeQr} />
                  </td>
                  <td>
                    <YesNo value={a.printed} />
                  </td>
                  <td>
                    <YesNo value={a.inFamily} />
                  </td>
                  <td>{a.lastLoginAt ? day(a.lastLoginAt) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <nav className="flex items-center justify-between gap-3" aria-label="Páginas de cuentas">
          {data.page > 1 ? (
            <Link className={pager} href={pageHref(data.q, data.page - 1)}>
              <ChevronLeft size={18} aria-hidden="true" />
              Anteriores
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-muted-foreground">
            Página {data.page} de {pages}
          </span>
          {data.page < pages ? (
            <Link className={pager} href={pageHref(data.q, data.page + 1)}>
              Siguientes
              <ChevronRight size={18} aria-hidden="true" />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </Card>
  );
}
