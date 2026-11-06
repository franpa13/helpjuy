import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

/** Avisos con una franja de color a la izquierda (como un sello en la ficha). */
const alertVariants = cva('w-full border-l-8 px-3.5 py-3 text-base', {
  variants: {
    variant: {
      info: 'border-ink bg-white',
      error: 'border-red bg-red-tint',
      warning: 'border-amber bg-amber-tint',
      success: 'border-green bg-green-tint',
    },
  },
  defaultVariants: { variant: 'info' },
});

function Alert({ className, variant, ...props }: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Alert, alertVariants };
