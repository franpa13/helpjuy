import Link from 'next/link';
import type { ReactNode } from 'react';
import { Logo } from '@/shared/brand/Logo';
import { FadeIn } from '@/shared/motion/FadeIn';

export function AppStrip({ right }: { right?: ReactNode }) {
  return (
    <header className="strip">
      <Link href="/" aria-label="HelpJuy, inicio">
        <Logo size={26} />
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
        <FadeIn>
        <div className="page-title">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {children}
      </FadeIn>
      </main>
    </>
  );
}
