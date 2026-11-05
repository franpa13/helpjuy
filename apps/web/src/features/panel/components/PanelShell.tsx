import Link from 'next/link';
import type { ReactNode } from 'react';
import { LogoutButton } from '@/features/auth/components/AccountActions';
import { Logo } from '@/shared/brand/Logo';
import { PanelNav } from './PanelNav';
import styles from './panel-shell.module.css';

/** Armado del panel: barra lateral en escritorio; barra superior + pestañas abajo en celular. */
export function PanelShell({ email, children }: { email?: string; children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <aside className={styles.side}>
        <Link href="/panel" className={styles.brand} aria-label="HelpJuy, mis fichas">
          <Logo size={28} crossColor="var(--red-bright)" />
        </Link>
        <PanelNav variant="side" />
        <div className={styles.sideFoot}>
          {email && (
            <p className={styles.account}>
              <span className={styles.accountLabel}>Tu cuenta</span>
              {email}
            </p>
          )}
          <span className={styles.logout}>
            <LogoutButton />
          </span>
          <a className={styles.sos} href="tel:107">
            Emergencias: 107
          </a>
        </div>
      </aside>

      <header className={styles.top}>
        <Link href="/panel" className={styles.brand} aria-label="HelpJuy, mis fichas">
          <Logo size={24} crossColor="var(--red-bright)" />
        </Link>
        <span className={styles.logout}>
          <LogoutButton />
        </span>
      </header>

      <div className={styles.content}>{children}</div>

      <div className={styles.tabsWrap}>
        <PanelNav variant="tabs" />
      </div>
    </div>
  );
}
