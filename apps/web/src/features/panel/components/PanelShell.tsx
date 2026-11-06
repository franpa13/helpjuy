import Link from 'next/link';
import type { ReactNode } from 'react';
import { LogoutButton } from '@/features/auth/components/AccountActions';
import { Logo } from '@/shared/brand/Logo';
import { PanelNav } from './PanelNav';

const logout = 'justify-self-start font-head text-[15px] font-bold uppercase tracking-[0.12em] text-white';

/** Armado del panel: barra lateral en escritorio; barra superior + pestañas abajo en celular. */
export function PanelShell({ email, children }: { email?: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-paper panel:grid panel:grid-cols-[280px_1fr]">
      <aside className="hidden bg-night px-4 py-6 text-white panel:sticky panel:top-0 panel:flex panel:h-dvh panel:flex-col panel:gap-7">
        <Link href="/panel" className="px-2 text-white no-underline" aria-label="HelpJuy, mis fichas">
          <Logo size={28} crossColor="var(--red-bright)" />
        </Link>
        <PanelNav variant="side" />
        <div className="mt-auto grid gap-3 border-t border-white/12 px-2 pt-4 text-sm">
          {email && (
            <p className="grid gap-0.5 break-all text-white/85">
              <span className="font-head text-xs font-bold uppercase tracking-[0.12em] text-white/55">Tu cuenta</span>
              {email}
            </p>
          )}
          <span className={logout}>
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
        <span className={logout}>
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
