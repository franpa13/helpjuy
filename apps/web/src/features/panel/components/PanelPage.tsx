import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Card, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Props = {
  title: string;
  subtitle?: ReactNode;
  back?: { href: string; label: string };
  /** Columna lateral (en escritorio queda a la derecha y acompaña el scroll). */
  aside?: ReactNode;
  asideLabel?: string;
  children: ReactNode;
};

/**
 * Armado común de todas las pantallas del panel: mismo ancho, mismos márgenes, mismo encabezado
 * y la misma columna lateral. Así al pasar de una pantalla a otra solo cambia el contenido.
 */
export function PanelPage({ title, subtitle, back, aside, asideLabel, children }: Props) {
  return (
    <main className="w-full max-w-[1180px] px-4 pt-6 pb-12 panel:px-0 panel:pt-8">
      {back && (
        <Link href={back.href} className="mb-3.5 inline-flex items-center gap-1.5 text-[15px] font-bold text-ink">
          <ArrowLeft size={18} aria-hidden="true" />
          {back.label}
        </Link>
      )}
      <header className="mb-[22px] border-b-3 border-ink pb-3.5">
        <h1 className="text-[clamp(36px,5vw,52px)] wrap-anywhere">{title}</h1>
        {subtitle && <p className="mt-2 max-w-[44em] text-muted-foreground">{subtitle}</p>}
      </header>
      {aside ? (
        <div className="grid gap-5 wide:grid-cols-[minmax(0,1.7fr)_minmax(300px,1fr)] wide:items-start wide:gap-7">
          <div className="grid min-w-0 gap-4">{children}</div>
          <aside className="grid gap-4 wide:sticky wide:top-6" aria-label={asideLabel}>
            {aside}
          </aside>
        </div>
      ) : (
        children
      )}
    </main>
  );
}

/** Caja estándar de la columna lateral. */
export function PanelBox({ title, className, children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <Card className={cn('p-[18px]', className)}>
      <CardTitle>{title}</CardTitle>
      {children}
    </Card>
  );
}
