/**
 * Filas grandes para Checkbox y RadioGroupItem de shadcn: toda la fila es la etiqueta y se puede tocar
 * en cualquier punto. El estado se lee del data-state que pone Radix.
 */
export const checkCard =
  'flex cursor-pointer items-start gap-3 border-2 border-ink bg-white p-3.5 text-base [&_[data-slot=checkbox]]:mt-px';

export const radioCard =
  'flex min-h-12 cursor-pointer items-center gap-2 border-2 border-line bg-white px-3 py-2.5 has-data-[state=checked]:border-ink has-data-[state=checked]:font-bold';
