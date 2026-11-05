'use client';

import styles from '@/features/emergency-card/components/emergency-card.module.css';

/** Si la ficha no se puede cargar, nunca dejamos a nadie sin el botón de 107. */
export default function CardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className={styles.page}>
      <header className={styles.strip}>
        <span>Ficha de emergencia</span>
        <span>Jujuy</span>
      </header>
      <main className={styles.sec}>
        <h1 className={styles.name} style={{ fontSize: 34 }}>
          No pudimos cargar la ficha
        </h1>
        <p className={styles.meta} style={{ marginTop: 12 }}>
          Puede ser la señal. Si alguien necesita ayuda, llamá al 107 ahora y probá de nuevo después.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{ marginTop: 16, minHeight: 48, padding: '0 18px', border: '2px solid var(--ink)', background: 'transparent', font: 'inherit', fontWeight: 700, cursor: 'pointer' }}
        >
          Reintentar
        </button>
      </main>
      <nav aria-label="Llamadas">
        <div className={styles.callbar} style={{ gridTemplateColumns: '1fr' }}>
          <a className={`${styles.btn} ${styles.sos}`} href="tel:107">
            <small>Emergencias · SAME Jujuy</small>
            <b>Llamar 107</b>
          </a>
        </div>
      </nav>
    </div>
  );
}
