import { RELATIONSHIP_LABELS, type ProfileDto } from '@helpjuy/contracts';
import Link from 'next/link';
import styles from './profiles.module.css';

export function ProfileList({ profiles }: { profiles: ProfileDto[] }) {
  return (
    <ul className={styles.list}>
      {profiles.map((p) => (
        <li key={p.id} className={styles.item}>
          <div>
            <div className={styles.name}>
              {p.firstName} {p.lastName}
            </div>
            <div className={styles.meta}>
              {RELATIONSHIP_LABELS[p.relationship]}
              {p.isMinor ? ' · menor' : ''}
              {' · '}
              <span className={p.active ? styles.active : styles.inactive}>
                {p.active ? 'QR activo' : 'Falta un contacto de emergencia'}
              </span>
            </div>
            <div className={styles.links}>
              <Link href={`/panel/perfiles/${p.id}`}>Editar ficha</Link>
              <a href={`/e/${p.publicToken}`} target="_blank" rel="noreferrer">
                Ver como el paramédico
              </a>
            </div>
          </div>
          <span className={styles.progress}>Ficha al {p.completion}%</span>
        </li>
      ))}
    </ul>
  );
}
