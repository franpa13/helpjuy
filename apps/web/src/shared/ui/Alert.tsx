import type { ReactNode } from 'react';
import styles from './ui.module.css';

type Props = { tone?: 'error' | 'warning' | 'success' | 'info'; children: ReactNode };

export function Alert({ tone = 'info', children }: Props) {
  const toneClass = tone === 'info' ? '' : styles[`alert-${tone}`];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={[styles.alert, toneClass].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}
