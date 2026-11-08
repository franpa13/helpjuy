import { ChartNoAxesColumn, UserRound } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { LogoutButton } from '@/features/auth/components/AccountActions';
import { Logo } from '@/shared/brand/Logo';
import { PanelNav } from './PanelNav';

/** Armado del panel: barra lateral en escritorio; barra superior + pestañas abajo en celular. */
export function PanelShell({ email, admin = false, children }: { email?: string; admin?: boolean; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-paper panel:grid panel:grid-cols-[280px_1fr]">
      <aside className="hidden bg-night px-4 py-6 text-white panel:sticky panel:top-0 panel:flex panel:h-dvh panel:flex-col panel:gap-7">
        <Link href="/panel" className="px-2 text-white no-underline" aria-label="HelpJuy, mis fichas">
          <Logo size={28} crossColor="var(--red-bright)" />
        </Link>
        <PanelNav variant="side" />
        <div className="mt-auto grid gap-3 border-t border-white/12 px-2 pt-4 text-sm">
          {admin && (
            <Link href="/panel/metricas" className="inline-flex items-center gap-2 font-bold text-white no-underline hover:text-white/80">
              <ChartNoAxesColumn size={18} aria-hidden="true" />
              Métricas
            </Link>
          )}
          <Link href="/panel/cuenta" className="grid gap-0.5 break-all text-white/85 no-underline hover:text-white">
            <span className="font-head text-xs font-bold uppercase tracking-[0.12em] text-white/55">Tu cuenta</span>
            {email ?? 'Ver tu cuenta'}
          </Link>
          <span className="justify-self-start">
            <LogoutButton />
          </span>
          <a className="font-head text-lg font-extrabold uppercase text-red-bright no-underline" href="tel:107">
            Emergencias: 107
          </a>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between bg-night px-4 py-2.5 text-white panel:hidden">
        <Link href="/panel" className="px-2 text-white no-underline" aria-label="HelpJuy, mis fichas">
          <Logo size={24} crossColor="var(--red-bright)" />
        </Link>
        <span className="flex items-center gap-4">
          {admin && (
            <Link href="/panel/metricas" className="text-white" aria-label="Métricas">
              <ChartNoAxesColumn size={22} aria-hidden="true" />
            </Link>
          )}
          <Link href="/panel/cuenta" className="text-white" aria-label="Tu cuenta">
            <UserRound size={22} aria-hidden="true" />
          </Link>
          <LogoutButton />
        </span>
      </header>

      <div className="pb-22 panel:px-[clamp(16px,4vw,48px)] panel:pt-2 panel:pb-8">{children}</div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/12 bg-night pb-[env(safe-area-inset-bottom)] panel:hidden">
        <PanelNav variant="tabs" />
      </div>
    </div>
  );
}
