/**
 * Casillas y opciones grandes (toda la fila se puede tocar). Usan inputs nativos a propósito:
 * funcionan con el teclado, el lector de pantalla y los formularios sin JavaScript extra.
 */
export const checkCard =
  'flex cursor-pointer items-start gap-3 border-2 border-ink bg-white p-3.5 text-base [&_input]:mt-px [&_input]:size-6 [&_input]:shrink-0 [&_input]:accent-ink';

export const radioCard =
  'flex min-h-12 cursor-pointer items-center gap-2 border-2 border-line bg-white px-3 py-2.5 has-checked:border-ink has-checked:font-bold [&_input]:size-5 [&_input]:accent-ink';
