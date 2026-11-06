import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import * as React from 'react';
import { cn } from '@/lib/utils';

/** Botones de HelpJuy: grandes, en mayúsculas condensadas, fáciles de tocar con una mano. */
const buttonVariants = cva(
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md border-2 font-head font-extrabold uppercase tracking-[0.04em] no-underline transition-[transform,opacity,background-color] duration-150 active:not-disabled:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'border-red bg-red text-white',
        destructive: 'border-red bg-red text-white',
        outline: 'border-ink bg-transparent text-ink',
        /** Sobre fondo azul noche */
        night: 'border-red-bright bg-red-bright text-white',
        ghost: 'border-transparent bg-transparent text-ink hover:bg-muted',
        link: 'border-0 bg-transparent p-0 font-sans font-bold normal-case tracking-normal text-ink underline underline-offset-3',
      },
      size: {
        default: 'min-h-13 w-full px-[18px] py-3 text-xl',
        sm: 'min-h-11 px-4 py-2 text-[17px]',
        inline: 'min-h-13 px-[18px] py-3 text-xl',
        icon: 'size-11',
      },
    },
    compoundVariants: [{ variant: 'link', className: 'min-h-0 text-base' }],
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'button';
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { Button, buttonVariants };
