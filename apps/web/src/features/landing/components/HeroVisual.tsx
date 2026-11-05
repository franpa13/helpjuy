import { LogoSymbol } from '@/shared/brand/Logo';
import { FakeQr } from './FakeQr';
import styles from './landing.module.css';

/** La ficha en el celular + la tarjeta de billetera con el QR. Datos de ejemplo. */
export function HeroVisual() {
  return (
    <div className={styles.visual} aria-label="Ejemplo de ficha de emergencia y tarjeta con QR" role="img">
      <div className={styles.phone}>
        <div className={styles.phoneScreen}>
          <div className={styles.fStrip}>
            <span>Ficha de emergencia</span>
            <span>Jujuy</span>
          </div>
          <div className={styles.fName}>Lucía Mamani</div>
          <div className={styles.fMeta}>Femenina, 41 años</div>
          <div className={styles.fVitals}>
            <div>
              <small>Sangre</small>
              <b className={styles.fBlood}>A+</b>
            </div>
            <div>
              <small>Peso</small>
              <b>64</b>
            </div>
            <div>
              <small>Altura</small>
              <b>158</b>
            </div>
          </div>
          <div className={styles.fAlert}>
            <small>Alergias</small>
            <b>Penicilina</b>
            <b>Ibuprofeno</b>
          </div>
          <div className={styles.fRow}>
            <small>Medicación</small>
            <span>Warfarina (anticoagulante)</span>
          </div>
          <div className={styles.fRow}>
            <small>Condiciones</small>
            <span>Epilepsia</span>
          </div>
          <div className={styles.fCalls}>
            <span className={styles.fSos}>107</span>
            <span className={styles.fFam}>Llamar a Jorge</span>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHead}>
          <LogoSymbol size={14} crossColor="currentColor" />
          Emergencia médica
        </div>
        <div className={styles.cardBody}>
          <div className={styles.qrWrap}>
            <FakeQr className={styles.qr} />
            <span className={styles.scanLine} aria-hidden="true" />
          </div>
          <dl className={styles.cardData}>
            <dt>Alergia</dt>
            <dd>Penicilina</dd>
            <dt>Sangre</dt>
            <dd>A+</dd>
            <dt>Llamar</dt>
            <dd>388 4xx-xxxx</dd>
          </dl>
        </div>
      </div>
    </div>
  );
}
