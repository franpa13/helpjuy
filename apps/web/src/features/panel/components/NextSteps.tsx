import type { ProfileDto } from '@helpjuy/contracts';
import { Check } from 'lucide-react';
import Link from 'next/link';
import styles from './dashboard.module.css';

type Step = { key: 'email' | 'complete' | 'print' | 'family'; title: string; text: string; href: string; done: boolean };

type Input = { emailVerified: boolean; profiles: ProfileDto[]; familyMembers: number };

/** Lo que conviene hacer para que la ficha sirva de verdad, en orden. */
export function nextSteps({ emailVerified, profiles, familyMembers }: Input): Step[] {
  const first = profiles[0];
  return [
    {
      key: 'email',
      title: 'Confirmá tu email',
      text: 'Para recibir los avisos de emergencia de tu familia.',
      href: '/panel',
      done: emailVerified,
    },
    {
      key: 'complete',
      title: 'Completá tu ficha',
      text: 'Alergias, remedios, grupo sanguíneo y contactos.',
      href: first ? `/panel/perfiles/${first.id}` : '/panel/perfiles/nuevo',
      done: profiles.length > 0 && profiles.every((p) => p.completion === 100),
    },
    {
      key: 'print',
      title: 'Imprimí tu QR',
      text: 'Tarjeta para la billetera y sticker para el casco.',
      href: first ? `/panel/perfiles/${first.id}/imprimir` : '/panel',
      done: profiles.length > 0 && profiles.every((p) => p.printStatus === 'ok'),
    },
    {
      key: 'family',
      title: 'Armá tu grupo familiar',
      text: 'Para que se enteren si te pasa algo.',
      href: '/panel/familia',
      done: familyMembers > 0,
    },
  ];
}

export function NextSteps(props: Input) {
  const steps = nextSteps(props);
  const done = steps.filter((s) => s.done).length;
  return (
    <section className={styles.panelBox}>
      <div className={styles.boxHead}>
        <h2>Tus próximos pasos</h2>
        <span className={styles.count}>
          {done} de {steps.length} listos
        </span>
      </div>
      <ol className={styles.steps} aria-label="Tus próximos pasos">
        {steps.map((s) => (
          <li key={s.key} data-done={s.done}>
            <span className={styles.check} aria-hidden="true">
              {s.done ? <Check size={16} strokeWidth={3} /> : null}
            </span>
            <span>
              {s.done || s.key === 'email' ? (
                <strong>{s.title}</strong>
              ) : (
                <Link href={s.href} className={styles.stepLink}>
                  {s.title}
                </Link>
              )}
              <span className={styles.stepText}>{s.done ? 'Listo' : s.text}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
