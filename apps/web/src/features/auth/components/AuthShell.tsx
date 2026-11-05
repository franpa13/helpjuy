import Link from 'next/link';
import type { ReactNode } from 'react';

export function AppStrip({ right }: { right?: ReactNode }) {
  return (
    <header className="strip">
      <Link href="/">
        <i className="cross" aria-hidden="true" />
        HelpJuy
      </Link>
      <span>{right ?? 'Jujuy'}</span>
    </header>
  );
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <>
      <AppStrip />
      <main className="page">
        <div className="page-title">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {children}
      </main>
    </>
  );
}
