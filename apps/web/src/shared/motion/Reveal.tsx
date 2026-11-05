'use client';

import { motion, type Variants } from 'motion/react';
import type { ReactNode } from 'react';

const EASE = [0.22, 1, 0.36, 1] as const;

/** Aparece suave al entrar en pantalla (una sola vez). */
export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

export const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

export const staggerChild = (from: { x?: number; y?: number } = { y: 18 }): Variants => ({
  hidden: { opacity: 0, ...from },
  show: { opacity: 1, x: 0, y: 0, transition: { duration: 0.6, ease: EASE } },
});

type ListProps = {
  as?: 'ul' | 'ol' | 'dl' | 'div';
  className?: string;
  children: ReactNode;
};

/** Contenedor que escalona la aparición de sus hijos `StaggerItem` al entrar en pantalla. */
export function StaggerList({ as = 'div', className, children }: ListProps) {
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      variants={staggerParent}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </Comp>
  );
}

type ItemProps = {
  as?: 'li' | 'div';
  className?: string;
  from?: { x?: number; y?: number };
  children: ReactNode;
};

export function StaggerItem({ as = 'div', className, from, children }: ItemProps) {
  const Comp = motion[as];
  return (
    <Comp className={className} variants={staggerChild(from)}>
      {children}
    </Comp>
  );
}
