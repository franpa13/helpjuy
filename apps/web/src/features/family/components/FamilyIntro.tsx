import { BellOff, EyeOff, MailCheck } from 'lucide-react';
import styles from './family.module.css';

const STEPS = [
  { title: 'Creá tu grupo', text: 'Ponele un nombre, por ejemplo "Familia Paredes". Lo administrás vos.' },
  { title: 'Invitá por WhatsApp', text: 'Les mandás un link. Cada persona crea su cuenta gratis y acepta unirse.' },
  {
    title: 'Si pasa algo, les llega un aviso',
    text: 'Quien escanee tu QR toca "Es una emergencia" y el grupo recibe un email con la hora y la ubicación aproximada.',
  },
];

const PROMISES = [
  { icon: EyeOff, text: 'Nadie ve tus datos médicos: el grupo solo recibe avisos.' },
  { icon: BellOff, text: 'Cada persona puede silenciar los avisos o salir cuando quiera.' },
  { icon: MailCheck, text: 'Los avisos llegan solo a emails confirmados.' },
];

export function IntroLead() {
  return (
    <p className={`${styles.introLead} ${styles.areaLead}`}>
      Todavía no tenés un grupo familiar. Armalo en un minuto con las personas que querés que se enteren si te pasa algo.
    </p>
  );
}

/** Cómo funciona (3 pasos) y qué garantías tiene, para quien todavía no tiene grupo. */
export function FamilyIntro({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`${styles.intro} ${compact ? styles.introCompact : styles.areaSteps}`}>
      <ol className={styles.steps} aria-label="Cómo funciona">
        {STEPS.map((s, i) => (
          <li key={s.title}>
            <span className={styles.stepNum} aria-hidden="true">
              {i + 1}
            </span>
            <span>
              <strong>{s.title}</strong>
              <span className={styles.stepText}>{s.text}</span>
            </span>
          </li>
        ))}
      </ol>
      <ul className={styles.promises}>
        {PROMISES.map(({ icon: Icon, text }) => (
          <li key={text}>
            <Icon size={20} aria-hidden="true" />
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Ejemplo del email que recibe la familia. Va con un nombre inventado y la etiqueta EJEMPLO
 * para que nadie piense que ya escanearon su QR.
 */
export function AlertPreview({ compact = false }: { compact?: boolean }) {
  const name = 'Lucía Mamani';
  return (
    <figure
      className={`${styles.preview} ${compact ? '' : styles.areaPreview}`}
      aria-label="Ejemplo del email que recibe tu familia"
    >
      {!compact && <figcaption className={styles.previewCaption}>Así le llega a tu familia</figcaption>}
      <div className={styles.mail}>
        <span className={styles.exampleTag}>EJEMPLO</span>
        <p className={styles.exampleNote}>Así se vería si alguien escanea un QR y marca una emergencia (nombre inventado).</p>
        <div className={styles.mailFrom}>
          <span>HelpJuy</span>
          <span>14:32</span>
        </div>
        <p className={styles.mailSubject}>Posible emergencia: {name}</p>
        <p>
          Alguien escaneó la ficha de <strong>{name}</strong> a las 14:32 y marcó que es una emergencia.
        </p>
        <p className={styles.mailLink}>Ver ubicación aproximada en el mapa</p>
        <p>
          <strong>Puede no ser real.</strong> Intentá comunicarte con Lucía. Si no responde, llamá al 107.
        </p>
      </div>
    </figure>
  );
}
