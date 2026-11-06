import { Eye, Gift, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Logo, LogoSymbol } from '@/shared/brand/Logo';
import { FadeIn } from '@/shared/motion/FadeIn';

type Variant = 'register' | 'login' | 'recover';

const ASIDE: Record<Variant, { headline: string; lead: string }> = {
  register: {
    headline: 'Tu ficha de emergencia, lista en 3 minutos',
    lead: 'Primero creás tu cuenta. Tus datos médicos los cargás después, y vos decidís qué se ve al escanear tu QR.',
  },
  login: {
    headline: 'Qué bueno verte de nuevo',
    lead: 'Aprovechá para revisar tu ficha: un remedio nuevo o un teléfono que cambió pueden hacer la diferencia.',
  },
  recover: {
    headline: 'Tranqui, le pasa a todos',
    lead: 'Te mandamos un link seguro a tu email. Por seguridad, vence en una hora y sirve una sola vez.',
  },
};

const TRUST = [
  { icon: ShieldCheck, text: 'Tus datos de salud se guardan cifrados' },
  { icon: Eye, text: 'Vos elegís qué se ve al escanear tu QR' },
  { icon: Gift, text: 'Gratis y sin publicidad' },
];

const STEPS = ['Tu cuenta', 'Tu ficha', 'Tu QR'];

type Props = {
  title: string;
  subtitle?: string;
  variant?: Variant;
  /** Paso actual del alta (1 a 3). Solo en el registro. */
  step?: 1 | 2 | 3;
  children: ReactNode;
};

/** Pantallas de cuenta: panel de confianza (azul noche) + formulario (papel). */
export function AuthShell({ title, subtitle, variant = 'login', step, children }: Props) {
  const aside = ASIDE[variant];
  return (
    <div className="grid min-h-dvh grid-rows-[auto_1fr] bg-paper split:grid-cols-[minmax(380px,0.9fr)_1.1fr] split:grid-rows-1">
      <aside className="relative flex flex-col gap-3.5 overflow-hidden bg-night px-4 pt-3.5 pb-[18px] text-white split:sticky split:top-0 split:h-dvh split:gap-0 split:px-[clamp(32px,4vw,56px)] split:py-9">
        <Link href="/" className="self-start text-white no-underline" aria-label="HelpJuy, inicio">
          <Logo size={30} crossColor="var(--red-bright)" />
        </Link>
        <div className="relative z-1 split:my-auto split:max-w-[30em]">
          <p className="font-head text-2xl/[0.98] font-extrabold uppercase split:text-[clamp(40px,3.6vw,58px)]/[0.92]">
            {aside.headline}
          </p>
          <p className="mt-[18px] hidden text-lg/[1.55] text-white/85 split:block">{aside.lead}</p>
          <ul className="mt-8 hidden list-none gap-3.5 p-0 text-[17px] font-bold split:grid">
            {TRUST.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3.5">
                <span className="inline-grid size-10 shrink-0 place-items-center rounded-md bg-red-bright text-white">
                  <Icon aria-hidden="true" size={20} strokeWidth={2.2} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative z-1 hidden font-head text-xl font-extrabold uppercase tracking-[0.02em] split:block">
          ¿Es una emergencia? Llamá al{' '}
          <a href="tel:107" className="text-red-bright">
            107
          </a>
        </p>
        {/* El símbolo enorme y casi invisible: textura de marca, no decoración que compita. */}
        <LogoSymbol
          className="pointer-events-none absolute -right-[70px] -bottom-[60px] hidden opacity-[0.06] split:block"
          size={340}
          color="currentColor"
          crossColor="currentColor"
        />
      </aside>

      <main className="flex justify-center px-4 pt-7 pb-12 split:items-center split:px-[clamp(24px,5vw,80px)] split:py-12">
        <FadeIn className="w-full max-w-[440px]">
          {step && (
            <ol
              className="mb-[22px] grid list-none grid-cols-3 gap-2 p-0 text-sm font-bold text-muted-foreground"
              aria-label={`Paso ${step} de 3`}
            >
              {STEPS.map((s, i) => {
                const state = i + 1 < step ? 'done' : i + 1 === step ? 'current' : 'todo';
                return (
                  <li
                    key={s}
                    data-state={state}
                    className={cn(
                      'flex items-center gap-2 border-t-4 border-line pt-2',
                      state === 'current' && 'border-red text-ink',
                      state === 'done' && 'border-green',
                    )}
                  >
                    <span
                      className={cn(
                        'inline-grid size-[22px] place-items-center rounded-full bg-line text-xs text-ink',
                        state === 'current' && 'bg-red text-white',
                      )}
                      aria-hidden="true"
                    >
                      {i + 1}
                    </span>
                    {s}
                  </li>
                );
              })}
            </ol>
          )}
          <h1 className="text-[clamp(36px,7vw,52px)]/[0.92]">{title}</h1>
          {subtitle && <p className="mt-2.5 text-[17px] text-muted-foreground">{subtitle}</p>}
          <div className="mt-6 border-t-3 border-ink pt-6">{children}</div>
        </FadeIn>
      </main>
    </div>
  );
}
