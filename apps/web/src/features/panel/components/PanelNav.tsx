'use client';

import { IdCard, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './panel-shell.module.css';

const ITEMS = [
  {
    href: '/panel',
    label: 'Mis fichas',
    hint: 'Tus datos y tu QR',
    icon: IdCard,
    // Todo lo que no es familia es parte de "Mis fichas" (editar, nueva ficha…)
    active: (p: string) => !p.startsWith('/panel/familia'),
  },
  {
    href: '/panel/familia',
    label: 'Mi familia',
    hint: 'Quién recibe tus avisos',
    icon: Users,
    active: (p: string) => p.startsWith('/panel/familia'),
  },
];

/** Las dos secciones del panel. En escritorio va en la barra lateral; en celular, como pestañas abajo. */
export function PanelNav({ variant = 'side' }: { variant?: 'side' | 'tabs' }) {
  const pathname = usePathname() ?? '/panel';
  return (
    <nav aria-label="Secciones del panel" className={variant === 'side' ? styles.sideNav : styles.tabs}>
      {ITEMS.map(({ href, label, hint, icon: Icon, active }) => {
        const current = active(pathname);
        return (
          <Link key={href} href={href} className={styles.navItem} aria-current={current ? 'page' : undefined}>
            <span className={styles.navIcon} aria-hidden="true">
              <Icon size={22} strokeWidth={2.2} />
            </span>
            <span className={styles.navText}>
              <span className={styles.navLabel}>{label}</span>
              {variant === 'side' && <span className={styles.navHint}>{hint}</span>}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
