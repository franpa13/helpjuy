import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LogoSymbol } from '@/shared/brand/Logo';

/*
 * Piezas de la ficha pública. Se tiene que leer al sol, con apuro y con guantes.
 * Ver docs/design/ficha-emergencia-v3.html
 */

/** Rótulo chico en mayúsculas (12px) de la ficha pública. */
export const tiny = 'font-head text-xs font-bold uppercase tracking-[0.12em]';

export function CardPage({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh bg-paper text-ink">{children}</div>;
}

export function CardStrip({ logo = false }: { logo?: boolean }) {
  return (
    <header className="flex items-center justify-between bg-red px-4 py-2.5 font-head text-sm font-bold uppercase tracking-[0.14em] text-white card:px-8">
      <span className="inline-flex items-center gap-2.5">
        {logo && <LogoSymbol size={18} crossColor="currentColor" />}
        <span>Ficha de emergencia</span>
      </span>
      <span>Jujuy</span>
    </header>
  );
}

const tones = {
  plain: '',
  red: 'border-l-8 border-red bg-red-tint [&_h2]:text-red',
  amber: 'border-l-8 border-amber bg-amber-tint [&_h2]:text-amber',
  blue: 'border-l-8 border-blue bg-blue-tint [&_h2]:text-blue',
};

/** Sección de la ficha. El título lleva un cuadradito del color de la sección. */
export const sec = 'border-b border-line p-4 card:px-8';
export const secTitle =
  "mb-2.5 flex items-center gap-2 text-base/none tracking-[0.14em] before:size-2.5 before:bg-current before:content-['']";

export function CardSection({
  tone = 'plain',
  title,
  className,
  children,
  ...props
}: { tone?: keyof typeof tones; title: string; className?: string; children: ReactNode } & React.ComponentProps<'section'>) {
  return (
    <section className={cn(sec, tones[tone], className)} {...props}>
      <h2 className={secTitle}>{title}</h2>
      {children}
    </section>
  );
}

/** Aviso de ficha sin datos (ámbar, sin cuadradito). */
export function InactiveNotice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={cn(sec, tones.amber)}>
      <h2 className="mb-2.5 text-xl/none tracking-[0.02em]">{title}</h2>
      {children}
    </section>
  );
}

/** Botón grande de llamada (107 en rojo, contacto en azul noche). */
export function CallButton({
  href,
  caption,
  title,
  tone,
  side = false,
  children,
}: {
  href: string;
  caption: string;
  title: string;
  tone: 'sos' | 'fam';
  side?: boolean;
  children?: ReactNode;
}) {
  return (
    <a
      className={cn(
        'block text-white no-underline',
        tone === 'sos' ? 'bg-red' : 'bg-night',
        side ? 'border-b border-ink px-[22px] py-5' : 'px-4 pt-3.5 pb-[18px]',
      )}
      href={href}
    >
      <small className={cn(tiny, 'block opacity-90')}>{caption}</small>
      <b className={cn('mt-1 block font-head font-extrabold uppercase', side ? 'text-[34px]/none' : 'text-[28px]/none')}>{title}</b>
      {children}
    </a>
  );
}

/** Barra de llamadas al pie (al alcance del pulgar). Con un solo botón ocupa todo el ancho. */
export const callbar = 'grid grid-cols-2 border-t-3 border-ink has-[>a:only-child]:grid-cols-1';
