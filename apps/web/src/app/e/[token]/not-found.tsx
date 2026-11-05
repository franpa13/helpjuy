import styles from '@/features/emergency-card/components/emergency-card.module.css';

export default function CardNotFound() {
  return (
    <div className={styles.page}>
      <header className={styles.strip}>
        <span>Ficha de emergencia</span>
        <span>Jujuy</span>
      </header>
      <main className={styles.sec}>
        <h1 className={styles.name} style={{ fontSize: 36 }}>
          Este código no corresponde a ninguna ficha activa
        </h1>
        <p className={styles.meta} style={{ marginTop: 12 }}>
          Puede que la persona haya generado un QR nuevo. Si alguien necesita ayuda, llamá al 107.
        </p>
      </main>
      <nav className={styles.barWrap} style={{ display: 'block', position: 'static' }} aria-label="Llamadas">
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
