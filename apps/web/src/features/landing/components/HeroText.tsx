'use client';

import { motion, type Variants } from 'motion/react';
import Link from 'next/link';
import { Fragment } from 'react';

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
    <div>
      <motion.h1 className="max-w-[11ch] text-[clamp(54px,8.6vw,124px)]/[0.88] tracking-[-0.01em]" variants={title} initial="hidden" animate="show" aria-label={TITLE}>
        {words.map((w, i) => (
          // El espacio va afuera de la máscara: dentro de un inline-block el navegador lo descarta.
          <Fragment key={i}>
            <span className="-mb-[0.06em] inline-block overflow-hidden pb-[0.06em] align-top" aria-hidden="true">
              <motion.span className="inline-block will-change-transform" variants={word}>
                {w}
              </motion.span>
            </span>
            {i < words.length - 1 ? ' ' : null}
          </Fragment>
        ))}
      </motion.h1>

      <motion.p
        className="mt-6 max-w-[34em] text-[clamp(18px,1.6vw,21px)]/[1.55]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE, delay: 0.75 }}
      >
        Cargá tus alergias, tu medicación y a quién llamar. Imprimí tu QR y llevalo en la billetera o en el casco. Si
        tenés un accidente, el paramédico lo escanea y sabe cómo ayudarte.
      </motion.p>

      <motion.div
        className="mt-8 flex flex-wrap gap-3 max-[559px]:[&_a]:flex-[1_1_100%]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE, delay: 0.95 }}
      >
        <MotionLink
          href="/registro"
          className="inline-flex min-h-14 items-center justify-center rounded-md px-[26px] py-3.5 font-head text-[22px] font-extrabold uppercase tracking-[0.03em] no-underline border-2 border-red-bright bg-red-bright text-white"
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        >
          Crear mi ficha gratis
        </MotionLink>
        <MotionLink
          href="/ingresar"
          className="inline-flex min-h-14 items-center justify-center rounded-md px-[26px] py-3.5 font-head text-[22px] font-extrabold uppercase tracking-[0.03em] no-underline border-2 border-white text-white"
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        >
          Ya tengo cuenta
        </MotionLink>
      </motion.div>

      <motion.p
        className="mt-4 text-[15px] opacity-90"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.9 }}
        transition={{ duration: 0.8, delay: 1.2 }}
      >
        Es gratis, no hay que instalar nada y lo empezás en menos de 3 minutos.
      </motion.p>
    </div>
  );
}
