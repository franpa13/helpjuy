import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Une clases de Tailwind resolviendo conflictos.
 * Ojo: si después de un `leading-*` viene un `text-*`, tailwind-merge descarta el `leading-*`.
 * Para tamaño + interlineado usá la forma corta `text-[22px]/none` o `text-sm/[1.2]`.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
