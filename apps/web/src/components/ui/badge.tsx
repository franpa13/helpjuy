import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import * as React from 'react';
import { cn } from '@/lib/utils';

/** Etiquetas chicas en mayúsculas (estado de la ficha, "Tu ficha", "Ejemplo"…). */
const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-[0.04em] [&>svg]:size-3.5',
  {
    variants: {
      variant: {
        red: 'bg-red-tint text-red',
        blue: 'bg-blue-tint text-blue',
        green: 'bg-green-tint text-green',
        amber: 'bg-amber-tint text-amber',
        night: 'bg-night text-white',
        outline: 'border border-line text-muted-foreground',
      },
    },
    defaultVariants: { variant: 'night' },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span';
  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
