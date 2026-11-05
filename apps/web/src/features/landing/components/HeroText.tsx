'use client';

import { motion, type Variants } from 'motion/react';
import Link from 'next/link';
import styles from './landing.module.css';

const EASE = [0.22, 1, 0.36, 1] as const;
const TITLE = 'Si no podés hablar, tu ficha habla por vos';

const title: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const word: Variants = {
  hidden: { y: '105%' },
  show: { y: '0%', transition: { duration: 0.7, ease: EASE } },
};

const MotionLink = motion.create(Link);

export function HeroText() {
  const words = TITLE.split(' ');
  return (
    <div className={styles.heroText}>
      <motion.h1 className={styles.heroTitle} variants={title} initial="hidden" animate="show" aria-label={TITLE}>
        {words.map((w, i) => (
          <span key={i} className={styles.wordMask} aria-hidden="true">
            <motion.span className={styles.word} variants={word}>
              {w}
            </motion.span>
            {i < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </motion.h1>

      <motion.p
        className={styles.heroLead}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE, delay: 0.75 }}
      >
        Cargá tus alergias, tu medicación y a quién llamar. Imprimí tu QR y llevalo en la billetera o en el casco. Si
        tenés un accidente, el paramédico lo escanea y sabe cómo ayudarte.
      </motion.p>

      <motion.div
        className={styles.heroCtas}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE, delay: 0.95 }}
      >
        <MotionLink
          href="/registro"
          className={styles.ctaPrimary}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        >
          Crear mi ficha gratis
        </MotionLink>
        <MotionLink
          href="/ingresar"
          className={styles.ctaGhost}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        >
          Ya tengo cuenta
        </MotionLink>
      </motion.div>

      <motion.p
        className={styles.heroNote}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.9 }}
        transition={{ duration: 0.8, delay: 1.2 }}
      >
        Es gratis, no hay que instalar nada y lo empezás en menos de 3 minutos.
      </motion.p>
    </div>
  );
}
