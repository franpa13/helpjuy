import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import * as React from 'react';
import { cn } from '@/lib/utils';

/** Caja blanca con regla de color arriba, como las secciones de una ficha en papel. */
const cardVariants = cva('border border-line bg-white', {
  variants: {
    rule: {
      night: 'border-t-4 border-t-night',
      red: 'border-t-4 border-t-red',
      thin: 'border-t-3 border-t-night',
      none: '',
    },
  },
  defaultVariants: { rule: 'night' },
});

function Card({
  className,
  rule,
  asChild = false,
  ...props
}: React.ComponentProps<'section'> & VariantProps<typeof cardVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'section';
  return <Comp data-slot="card" className={cn(cardVariants({ rule }), className)} {...props} />;
}

function CardTitle({ className, ...props }: React.ComponentProps<'h2'>) {
  return <h2 data-slot="card-title" className={cn('mb-2.5 text-[22px]', className)} {...props} />;
}

export { Card, CardTitle, cardVariants };
