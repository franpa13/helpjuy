'use client';

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Variants,
} from 'motion/react';
import { useState, type PointerEvent } from 'react';
import { LogoSymbol } from '@/shared/brand/Logo';
import { FakeQr } from './FakeQr';
import styles from './landing.module.css';

const EASE = [0.22, 1, 0.36, 1] as const;

const rows: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const row: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

/**
 * Cuenta cómo funciona HelpJuy: la tarjeta entra, se escanea el QR y la ficha se arma en el celular.
 * Después queda flotando suave y el celular sigue un poco al mouse. Datos de ejemplo.
 */
export function HeroVisual() {
  const reduce = useReducedMotion();
  const [scanned, setScanned] = useState(false);
  const showFicha = scanned || reduce;

  // Inclinación según el mouse (solo con puntero fino; en táctil queda quieto).
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 120, damping: 18 });
  const sy = useSpring(my, { stiffness: 120, damping: 18 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [-9, 9]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [7, -7]);
  const cardX = useTransform(sx, [-0.5, 0.5], [-12, 12]);
  const cardY = useTransform(sy, [-0.5, 0.5], [-8, 8]);

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }

  function onPointerLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <div
      className={styles.visual}
      aria-label="Ejemplo: se escanea el QR de la tarjeta y aparece la ficha de emergencia en el celular"
      role="img"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {/* Celular */}
      <motion.div
        className={styles.phoneFloat}
        initial={{ opacity: 0, y: 30 }}
        animate={reduce ? { opacity: 1, y: 0 } : { opacity: 1, y: [0, -10, 0] }}
        transition={
          reduce
            ? { duration: 0 }
            : {
                opacity: { duration: 0.6, ease: EASE },
                y: { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.6 },
              }
        }
      >
        <motion.div className={styles.phone} style={{ rotateX, rotateY, transformPerspective: 900 }}>
          <div className={styles.phoneScreen}>
            <div className={styles.fStrip}>
              <span>Ficha de emergencia</span>
              <span>Jujuy</span>
            </div>

            <AnimatePresence mode="wait">
              {showFicha ? (
                <motion.div
                  key="ficha"
                  className={styles.fBody}
                  variants={rows}
                  initial={reduce ? false : 'hidden'}
                  animate="show"
                >
                  <motion.div variants={row}>
                    <div className={styles.fName}>Lucía Mamani</div>
                    <div className={styles.fMeta}>Femenina, 41 años</div>
                  </motion.div>
                  <motion.div variants={row} className={styles.fVitals}>
                    <div>
                      <small>Sangre</small>
                      <b className={styles.fBlood}>A+</b>
                    </div>
                    <div>
                      <small>Peso</small>
                      <b>64</b>
                    </div>
                    <div>
                      <small>Altura</small>
                      <b>158</b>
                    </div>
                  </motion.div>
                  <motion.div variants={row}>
                    <motion.div
                      className={styles.fAlert}
                      animate={
                        reduce
                          ? undefined
                          : {
                              boxShadow: [
                                '0 0 0 0 rgba(200,16,46,0.55)',
                                '0 0 0 12px rgba(200,16,46,0)',
                                '0 0 0 0 rgba(200,16,46,0)',
                              ],
                            }
                      }
                      transition={{ duration: 1.4, delay: 0.9, repeat: 2, repeatDelay: 0.4 }}
                    >
                      <small>Alergias</small>
                      <b>Penicilina</b>
                      <b>Ibuprofeno</b>
                    </motion.div>
                  </motion.div>
                  <motion.div variants={row} className={styles.fRow}>
                    <small>Medicación</small>
                    <span>Warfarina (anticoagulante)</span>
                  </motion.div>
                  <motion.div variants={row} className={styles.fRow}>
                    <small>Condiciones</small>
                    <span>Epilepsia</span>
                  </motion.div>
                  <motion.div variants={row} className={styles.fCalls}>
                    <span className={styles.fSos}>107</span>
                    <span className={styles.fFam}>Llamar a Jorge</span>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="espera"
                  className={styles.fWaiting}
                  exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.25 } }}
                >
                  <LogoSymbol size={56} color="#141414" />
                  <span>Escaneá el QR</span>
                  <span className={styles.dots} aria-hidden="true">
                    {[0, 1, 2].map((i) => (
                      <motion.i
                        key={i}
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
                      />
                    ))}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>

      {/* Tarjeta de billetera */}
      <motion.div className={styles.cardPos} style={{ x: cardX, y: cardY }}>
        <motion.div
          className={styles.cardFloat}
          animate={reduce ? undefined : { y: [0, 7, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.4 }}
        >
          <motion.div
            className={styles.card}
            initial={reduce ? false : { opacity: 0, x: -90, y: 40, rotate: -18 }}
            animate={{ opacity: 1, x: 0, y: 0, rotate: -5 }}
            transition={{ type: 'spring', stiffness: 70, damping: 14, delay: 0.25 }}
          >
            <div className={styles.cardHead}>
              <LogoSymbol size={14} crossColor="currentColor" />
              Emergencia médica
            </div>
            <div className={styles.cardBody}>
              <div className={styles.qrWrap}>
                <FakeQr className={styles.qr} />
                {!reduce && (
                  <motion.span
                    key={scanned ? 'loop' : 'first'}
                    className={styles.scanLine}
                    initial={{ top: '0%', opacity: 0 }}
                    animate={{ top: ['0%', '96%', '0%'], opacity: [0, 1, 1, 0] }}
                    transition={
                      scanned
                        ? { duration: 1.8, ease: 'easeInOut', repeat: Infinity, repeatDelay: 6, delay: 5 }
                        : { duration: 1.6, ease: 'easeInOut', delay: 1.2 }
                    }
                    onAnimationComplete={() => setScanned(true)}
                  />
                )}
              </div>
              <dl className={styles.cardData}>
                <dt>Alergia</dt>
                <dd>Penicilina</dd>
                <dt>Sangre</dt>
                <dd>A+</dd>
                <dt>Llamar</dt>
                <dd>388 4xx-xxxx</dd>
              </dl>
            </div>
          </motion.div>

          <AnimatePresence>
            {showFicha && !reduce && (
              <motion.div
                className={styles.chip}
                initial={{ opacity: 0, scale: 0.6, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 16 }}
              >
                <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                  <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2.4" />
                </svg>
                QR escaneado
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}
