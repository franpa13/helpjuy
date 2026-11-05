'use client';

import { MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';

/** Respeta la preferencia del sistema "reducir movimiento" en toda la app. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
