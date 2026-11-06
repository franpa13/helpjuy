import { RELATIONSHIP_LABELS, type ProfileDto } from '@helpjuy/contracts';
import { Eye, Pencil, Plus, Printer } from 'lucide-react';
import Link from 'next/link';
import styles from './dashboard.module.css';

const initials = (p: ProfileDto) => `${p.firstName[0] ?? ''}${p.lastName[0] ?? ''}`.toUpperCase();

function PrintNote({ p }: { p: ProfileDto }) {
  if (p.printStatus === 'outdated') return <p className={styles.noteWarn}>Cambiaron datos de tu QR impreso: reimprimilo.</p>;
  if (p.printStatus === 'never' && p.active) return <p className={styles.noteWarn}>Tu QR está listo: imprimilo.</p>;
  if (p.printStatus === 'ok' && p.printedAt)
    return <p className={styles.noteOk}>QR impreso el {new Date(p.printedAt).toLocaleDateString('es-AR')}</p>;
  return null;
}

export function ProfileCards({ profiles }: { profiles: ProfileDto[] }) {
  return (
    <div className={styles.cards}>
      {profiles.map((p) => {
        const name = `${p.firstName} ${p.lastName}`;
        return (
          <article key={p.id} className={styles.card} aria-label={name}>
            <header className={styles.cardHead}>
              <span className={styles.avatar} aria-hidden="true">
                {initials(p)}
              </span>
              <div className={styles.who}>
                <h2 className={styles.name}>{name}</h2>
                <p className={styles.meta}>
                  {RELATIONSHIP_LABELS[p.relationship]}
                  {p.isMinor ? ' · menor' : ''}
                </p>
              </div>
              <span className={p.active ? styles.chipOk : styles.chipWarn}>
                {p.active ? 'QR activo' : 'Falta un contacto de emergencia'}
              </span>
            </header>

            <div className={styles.progressRow}>
              <span className={styles.progressLabel}>Ficha al {p.completion}%</span>
              <span
                className={styles.bar}
                role="progressbar"
                aria-label="Ficha completa"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={p.completion}
              >
                <span style={{ width: `${p.completion}%` }} />
              </span>
            </div>

            <PrintNote p={p} />

            <div className={styles.actions}>
              <Link className={styles.actionPrimary} href={`/panel/perfiles/${p.id}`}>
                <Pencil size={18} aria-hidden="true" />
                Editar ficha
              </Link>
              <Link className={styles.action} href={`/panel/perfiles/${p.id}/imprimir`}>
                <Printer size={18} aria-hidden="true" />
                Imprimir QR
              </Link>
              <a className={styles.action} href={`/e/${p.publicToken}`} target="_blank" rel="noreferrer">
                <Eye size={18} aria-hidden="true" />
                Ver como el paramédico
              </a>
            </div>
          </article>
        );
      })}

      <Link href="/panel/perfiles/nuevo" className={styles.addCard}>
        <span className={styles.addIcon} aria-hidden="true">
          <Plus size={26} />
        </span>
        <span>
          <strong>Agregar otra persona</strong>
          <span className={styles.addText}>Un hijo, tu mamá o alguien a tu cargo, cada uno con su propio QR.</span>
        </span>
      </Link>
    </div>
  );
}
