import * as React from 'react';
import { cn } from '@/lib/utils';

/** Campo de texto con borde de tinta grueso: se ve bien con poca luz o con la pantalla al sol. */
function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'min-h-13 w-full min-w-0 rounded-md border-2 border-input bg-white px-3.5 py-3 text-ink placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red aria-invalid:bg-red-tint',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
