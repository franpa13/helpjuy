import * as React from 'react';
import { cn } from '@/lib/utils';

/** Barra de avance plana (sin animación de relleno: el número ya se lee al lado). */
function Progress({ value, className, ...props }: React.ComponentProps<'span'> & { value: number }) {
  return (
    <span
      data-slot="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className={cn('block h-2.5 bg-line', className)}
      {...props}
    >
      <span className="block h-full bg-green" style={{ width: `${value}%` }} />
    </span>
  );
}

export { Progress };
