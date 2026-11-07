import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import * as React from 'react';
import { cn } from '@/lib/utils';

/** Botones de HelpJuy: grandes, en mayúsculas condensadas, fáciles de tocar con una mano. */
const buttonCva = cva(
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md border-2 text-center font-head font-extrabold uppercase tracking-[0.04em] no-underline transition-[transform,opacity,background-color] duration-150 active:not-disabled:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'border-red bg-red text-white',
        destructive: 'border-red bg-red text-white',
        outline: 'border-ink bg-transparent text-ink',
        /** Sobre fondo azul noche */
        night: 'border-red-bright bg-red-bright text-white',
        /** Contorno blanco sobre fondo oscuro */
        inverse: 'border-white bg-transparent text-white',
        /** Botón secundario chico de las tarjetas (papel, borde suave) */
        soft: 'border-line bg-paper text-ink hover:border-ink',
        /** Acción principal en tinta (tarjetas de ficha) */
        ink: 'border-ink bg-ink text-white',
        ghost: 'border-transparent bg-transparent text-ink hover:bg-muted',
        link: 'border-0 bg-transparent p-0 font-sans font-bold normal-case tracking-normal text-ink underline underline-offset-3',
      },
      size: {
        default: 'min-h-13 w-full px-[18px] py-3 text-xl/tight',
        sm: 'min-h-11 px-4 py-2 text-[17px]/tight',
        inline: 'min-h-13 px-[18px] py-3 text-xl/tight',
        lg: 'min-h-14 px-[26px] py-3.5 text-[22px]/tight tracking-[0.03em]',
        /** Acciones secundarias: letra normal, más chicas */
        compact: 'min-h-11 gap-1.5 px-3.5 font-sans text-[15px]/tight font-bold normal-case tracking-normal',
        icon: 'size-11',
      },
    },
    compoundVariants: [{ variant: 'link', className: 'min-h-0 w-auto px-0 py-0 text-base' }],
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

/** Siempre pasa por tailwind-merge: así una variante puede pisar el padding o el ancho del tamaño. */
const buttonVariants = (props?: VariantProps<typeof buttonCva>) => cn(buttonCva(props));

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> & VariantProps<typeof buttonCva> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'button';
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { Button, buttonVariants };
