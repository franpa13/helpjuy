import type { ReactNode } from 'react';
import styles from './ui.module.css';

export function Section({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      {title && (
        <h2 className="label" style={{ marginBottom: 10 }}>
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
