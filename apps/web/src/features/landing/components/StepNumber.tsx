'use client';

import { motion } from 'motion/react';
import styles from './landing.module.css';

/** Número grande del paso: sube desde una máscara al entrar en pantalla. */
export function StepNumber({ n }: { n: number }) {
  return (
    <span className={styles.stepNumMask} aria-hidden="true">
      <motion.span
        className={styles.stepNum}
        initial={{ y: '100%' }}
        whileInView={{ y: '0%' }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: (n - 1) * 0.15 }}
      >
        {n}
      </motion.span>
    </span>
  );
}
