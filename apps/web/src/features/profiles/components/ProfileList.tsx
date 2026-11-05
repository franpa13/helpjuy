import { RELATIONSHIP_LABELS, type ProfileDto } from '@helpjuy/contracts';
import styles from './profiles.module.css';

// El porcentaje real llega con la ficha médica (Plan 2); por ahora solo hay nombre.
const PLACEHOLDER_PROGRESS = 10;

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
            </div>
          </div>
          <span className={styles.progress}>Ficha al {PLACEHOLDER_PROGRESS}%</span>
        </li>
      ))}
    </ul>
  );
}
