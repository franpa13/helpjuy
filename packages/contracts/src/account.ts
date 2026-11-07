import { z } from 'zod';

/** Borrar la cuenta pide escribir BORRAR: no se deshace. */
export const DELETE_ACCOUNT_WORD = 'BORRAR';
export const deleteAccountSchema = z.object({ confirm: z.literal(DELETE_ACCOUNT_WORD) });
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;

/** Una apertura de una ficha tuya (sin datos de quien la abrió). */
export type ScanDto = { id: string; at: string; profileName: string };
