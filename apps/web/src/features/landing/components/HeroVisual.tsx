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
      className="relative aspect-[460/520] w-[min(100%,460px)] justify-self-center"
      aria-label="Ejemplo: se escanea el QR de la tarjeta y aparece la ficha de emergencia en el celular"
      role="img"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {/* Celular */}
      <motion.div
        className="absolute top-0 right-0 h-full w-[66%]"
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
        <motion.div className="size-full rounded-[34px] bg-ink p-2.5 shadow-[0_30px_60px_-30px_rgb(0_0_0/0.55)] outline outline-white/14 will-change-transform" style={{ rotateX, rotateY, transformPerspective: 900 }}>
          <div className="flex h-full flex-col overflow-hidden rounded-[26px] bg-paper text-ink">
            <div className="flex justify-between bg-red px-3 pt-[18px] pb-1.5 font-head text-[10px] font-bold tracking-[0.12em] text-white uppercase">
              <span>Ficha de emergencia</span>
              <span>Jujuy</span>
            </div>

            <AnimatePresence mode="wait">
              {showFicha ? (
                <motion.div
                  key="ficha"
                  className="flex flex-1 flex-col"
                  variants={rows}
                  initial={reduce ? false : 'hidden'}
                  animate="show"
                >
                  <motion.div variants={row}>
                    <div className="px-3 pt-2.5 font-head text-[26px]/[0.95] font-extrabold uppercase">Lucía Mamani</div>
                    <div className="border-b-2 border-ink px-3 pt-0.5 pb-2 text-[11px] text-muted-foreground">Femenina, 41 años</div>
                  </motion.div>
                  <motion.div variants={row} className="grid grid-cols-3 border-b-2 border-ink [&>div]:border-r [&>div]:border-line [&>div]:px-2.5 [&>div]:py-1.5 [&>div:last-child]:border-r-0 [&_b]:font-head [&_b]:text-[22px] [&_b]:font-extrabold [&_small]:block [&_small]:font-head [&_small]:text-[9px] [&_small]:font-bold [&_small]:uppercase [&_small]:tracking-[0.12em] [&_small]:text-muted-foreground">
                    <div>
                      <small>Sangre</small>
                      <b className="text-red">A+</b>
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
                      className="m-2 border-l-6 border-red bg-red-tint px-2.5 py-2 [&_small]:block [&_small]:font-head [&_small]:text-[9px] [&_small]:font-bold [&_small]:uppercase [&_small]:tracking-[0.12em] [&_small]:text-red [&_b]:block [&_b]:font-head [&_b]:text-xl/[1.05] [&_b]:font-extrabold [&_b]:text-red [&_b]:uppercase"
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
                  <motion.div variants={row} className="border-b border-line px-3 py-1.5 text-xs font-bold [&_small]:block [&_small]:font-head [&_small]:text-[9px] [&_small]:font-bold [&_small]:uppercase [&_small]:tracking-[0.12em] [&_small]:text-muted-foreground">
                    <small>Medicación</small>
                    <span>Warfarina (anticoagulante)</span>
                  </motion.div>
                  <motion.div variants={row} className="border-b border-line px-3 py-1.5 text-xs font-bold [&_small]:block [&_small]:font-head [&_small]:text-[9px] [&_small]:font-bold [&_small]:uppercase [&_small]:tracking-[0.12em] [&_small]:text-muted-foreground">
                    <small>Condiciones</small>
                    <span>Epilepsia</span>
                  </motion.div>
                  <motion.div variants={row} className="mt-auto grid grid-cols-[1fr_1.6fr] font-head text-[15px] font-extrabold text-white uppercase [&_span]:px-2 [&_span]:pt-3 [&_span]:pb-4 [&_span]:text-center">
                    <span className="bg-red">107</span>
                    <span className="bg-ink">Llamar a Jorge</span>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="espera"
                  className="grid flex-1 place-content-center justify-items-center gap-3.5 font-head text-lg font-extrabold tracking-[0.04em] text-ink uppercase"
                  exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.25 } }}
                >
                  <LogoSymbol size={56} color="#141414" />
                  <span>Escaneá el QR</span>
                  <span className="flex gap-1.5 [&_i]:size-[7px] [&_i]:bg-red" aria-hidden="true">
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
      <motion.div className="absolute bottom-[6%] left-0 z-2 w-[62%] max-[559px]:-bottom-[2%]" style={{ x: cardX, y: cardY }}>
        <motion.div
          className="relative"
          animate={reduce ? undefined : { y: [0, 7, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.4 }}
        >
          <motion.div
            className="relative -rotate-5 rounded-lg border-3 border-ink bg-white text-ink shadow-[0_24px_40px_-24px_rgb(0_0_0/0.6)] will-change-transform"
            initial={reduce ? false : { opacity: 0, x: -90, y: 40, rotate: -18 }}
            animate={{ opacity: 1, x: 0, y: 0, rotate: -5 }}
            transition={{ type: 'spring', stiffness: 70, damping: 14, delay: 0.25 }}
          >
            <div className="flex items-center gap-1.5 bg-red px-2.5 py-1.5 font-head text-[13px] font-extrabold tracking-[0.1em] text-white uppercase">
              <LogoSymbol size={14} crossColor="currentColor" />
              Emergencia médica
            </div>
            <div className="grid grid-cols-[44%_1fr] items-center gap-2.5 p-2.5">
              <div className="relative overflow-hidden">
                <FakeQr className="block h-auto w-full" />
                {!reduce && (
                  <motion.span
                    key={scanned ? 'loop' : 'first'}
                    className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-red opacity-0 shadow-[0_0_10px_2px_rgb(200_16_46/0.6)]"
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
              <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-xs/[1.3] [&_dd]:m-0 [&_dd]:font-bold [&_dt]:text-muted-foreground">
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
                className="absolute -top-5 -left-1.5 inline-flex items-center gap-1.5 rounded-full bg-ink px-2.5 py-1.5 text-[13px] font-bold whitespace-nowrap text-white shadow-[0_10px_20px_-10px_rgb(0_0_0/0.6)] [&_svg]:text-[#4ade80]"
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
