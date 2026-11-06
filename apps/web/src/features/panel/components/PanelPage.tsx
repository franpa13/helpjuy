import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import styles from './panel-page.module.css';

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
    <main className={styles.wrap}>
      {back && (
        <Link href={back.href} className={styles.back}>
          <ArrowLeft size={18} aria-hidden="true" />
          {back.label}
        </Link>
      )}
      <header className={styles.head}>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </header>
      {aside ? (
        <div className={styles.layout}>
          <div className={styles.main}>{children}</div>
          <aside className={styles.side} aria-label={asideLabel}>
            {aside}
          </aside>
        </div>
      ) : (
        children
      )}
    </main>
  );
}
