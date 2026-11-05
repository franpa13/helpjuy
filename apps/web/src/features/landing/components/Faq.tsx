'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId, useState } from 'react';
import styles from './landing.module.css';

export type FaqEntry = { q: string; a: string };

function FaqItem({ q, a }: FaqEntry) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className={styles.faqItem}>
      <button
        type="button"
        className={styles.faqQ}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
      >
        {q}
        <motion.span className={styles.faqIcon} animate={{ rotate: open ? 45 : 0 }} aria-hidden="true">
          +
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            key="a"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <p className={styles.faqA}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Faq({ items }: { items: FaqEntry[] }) {
  return (
    <div className={styles.faq}>
      {items.map((f) => (
        <FaqItem key={f.q} {...f} />
      ))}
    </div>
  );
}
