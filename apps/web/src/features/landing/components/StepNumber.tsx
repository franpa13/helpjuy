'use client';

import { motion, useInView } from 'motion/react';
import { useRef } from 'react';

/**
 * Número grande del paso: sube desde una máscara al entrar en pantalla.
 * Se observa la máscara (que sí está visible): el número arranca recortado por ella,
 * así que observarlo a él nunca dispararía la animación.
 */
export function StepNumber({ n }: { n: number }) {
  const mask = useRef<HTMLSpanElement>(null);
  const inView = useInView(mask, { once: true, amount: 0.5 });
  return (
    <span ref={mask} className="block overflow-hidden" aria-hidden="true">
      <motion.span
        className="inline-block font-head text-[88px]/[0.8] font-extrabold text-red"
        initial={{ y: '100%' }}
        animate={inView ? { y: '0%' } : { y: '100%' }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: (n - 1) * 0.15 }}
      >
        {n}
      </motion.span>
    </span>
  );
}
