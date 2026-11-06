import { ShieldCheck } from 'lucide-react';
import box from '@/features/panel/components/panel-page.module.css';
import styles from './profiles.module.css';

const NEXT = [
  { title: 'Datos de la persona', text: 'Nombre y quién es para vos.' },
  { title: 'Consentimiento', text: 'Leés qué guardamos y para qué. Sin casillas marcadas de antemano.' },
  { title: 'La ficha', text: 'Alergias, remedios, contactos… todo opcional.' },
  { title: 'Tu QR', text: 'Lo imprimís para la billetera, el casco o la heladera.' },
];

/** Columna lateral de "Nueva ficha": qué va a pasar, para que nadie se sienta perdido. */
export function NewProfileNext() {
  return (
    <>
      <section className={box.box}>
        <h2 className={box.boxTitle}>Qué sigue</h2>
        <ol className={styles.nextList}>
          {NEXT.map((n, i) => (
            <li key={n.title}>
              <span className={styles.nextNum} aria-hidden="true">
                {i + 1}
              </span>
              <span>
                <strong>{n.title}</strong>
                <span className={styles.nextText}>{n.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>
      <p className={styles.privacyNote}>
        <ShieldCheck size={20} aria-hidden="true" />
        Tus datos de salud se guardan cifrados y vos elegís qué se ve en el QR.
      </p>
    </>
  );
}
