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
export function FamilyIntro() {
  return (
    <div className={`${styles.intro} ${styles.areaSteps}`}>
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

/** Vista previa del email real que recibe la familia. */
export function AlertPreview({ name = 'Francisco Paredes' }: { name?: string }) {
  const first = name.split(' ')[0];
  return (
    <figure className={`${styles.preview} ${styles.areaPreview}`} aria-label="Ejemplo del email que recibe tu familia">
      <figcaption className={styles.previewCaption}>Así le llega a tu familia</figcaption>
      <div className={styles.mail}>
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
          <strong>Puede no ser real.</strong> Intentá comunicarte con {first}. Si no responde, llamá al 107.
        </p>
      </div>
    </figure>
  );
}
