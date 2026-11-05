import { Eye, Gift, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Logo, LogoSymbol } from '@/shared/brand/Logo';
import { FadeIn } from '@/shared/motion/FadeIn';
import styles from './auth-shell.module.css';

export function AppStrip({ right }: { right?: ReactNode }) {
  return (
    <header className="strip">
      <Link href="/" aria-label="HelpJuy, inicio">
        <Logo size={26} crossColor="var(--red-bright)" />
      </Link>
      <span>{right ?? 'Jujuy'}</span>
    </header>
  );
}

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

export function AuthShell({ title, subtitle, variant = 'login', step, children }: Props) {
  const aside = ASIDE[variant];
  return (
    <div className={styles.shell}>
      <aside className={styles.aside}>
        <Link href="/" className={styles.brand} aria-label="HelpJuy, inicio">
          <Logo size={30} crossColor="var(--red-bright)" />
        </Link>
        <div className={styles.asideBody}>
          <p className={styles.headline}>{aside.headline}</p>
          <p className={styles.lead}>{aside.lead}</p>
          <ul className={styles.trust}>
            {TRUST.map(({ icon: Icon, text }) => (
              <li key={text}>
                <span className={styles.trustIcon}>
                  <Icon aria-hidden="true" size={20} strokeWidth={2.2} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className={styles.sos}>
          ¿Es una emergencia? Llamá al <a href="tel:107">107</a>
        </p>
        <LogoSymbol className={styles.watermark} size={340} color="currentColor" crossColor="currentColor" />
      </aside>

      <main className={styles.main}>
        <FadeIn className={styles.panel}>
          {step && (
            <ol className={styles.steps} aria-label={`Paso ${step} de 3`}>
              {STEPS.map((s, i) => (
                <li key={s} data-state={i + 1 < step ? 'done' : i + 1 === step ? 'current' : 'todo'}>
                  <span className={styles.stepDot} aria-hidden="true">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          )}
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          <div className={styles.body}>{children}</div>
        </FadeIn>
      </main>
    </div>
  );
}
