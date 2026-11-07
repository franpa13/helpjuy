import { z } from 'zod';

// Caracteres de control (y DEL). Los nombres van a asuntos de email, mensajes de WhatsApp y la tarjeta impresa:
// ahí un salto de línea o un carácter invisible puede romper el formato o colar texto.
const CONTROL = /[\u0000-\u001f\u007f]/g;
const CONTROL_EXCEPT_NEWLINE = /[\u0000-\u0009\u000b-\u001f\u007f]/g;

/** Texto de una línea (nombres, sustancias, teléfonos de contacto…): los caracteres de control pasan a espacio. */
export const singleLine = (max: number) =>
  z
    .string()
    .overwrite((s) => s.replace(CONTROL, ' '))
    .trim()
    .max(max);

/** Texto largo (notas, voluntades): conserva los saltos de línea; saca el resto de los caracteres de control. */
export const multiLine = (max: number) =>
  z
    .string()
    .overwrite((s) => s.replace(/\r\n?/g, '\n').replace(CONTROL_EXCEPT_NEWLINE, ''))
    .trim()
    .max(max);
