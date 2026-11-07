import { z } from 'zod';
import { singleLine } from './text';
import { consentAcceptanceSchema } from './consent';

export const relationshipSchema = z.enum(['SELF', 'CHILD', 'PARENT', 'PARTNER', 'OTHER']);
export type Relationship = z.infer<typeof relationshipSchema>;

export const RELATIONSHIP_LABELS: Record<Relationship, string> = {
  SELF: 'Yo',
  CHILD: 'Hijo/a',
  PARENT: 'Madre/Padre',
  PARTNER: 'Pareja',
  OTHER: 'Otro',
};

const name = singleLine(60).min(1);

export const createProfileSchema = z.object({
  firstName: name,
  lastName: name,
  relationship: relationshipSchema,
  isMinor: z.boolean(),
  consent: consentAcceptanceSchema,
});
export type CreateProfileInput = z.infer<typeof createProfileSchema>;

export const updateProfileSchema = z.object({
  firstName: name.optional(),
  lastName: name.optional(),
  relationship: relationshipSchema.optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export type ProfileDto = {
  id: string;
  firstName: string;
  lastName: string;
  relationship: Relationship;
  isMinor: boolean;
  publicToken: string;
  createdAt: string;
  /** Porcentaje de la ficha completa (0–100). */
  completion: number;
  /** El QR está activo: tiene al menos un contacto de emergencia. */
  active: boolean;
  /** never: nunca se imprimió · ok: lo impreso está al día · outdated: cambió algo impreso o el QR. */
  printStatus: 'never' | 'ok' | 'outdated';
  printedAt: string | null;
  /** Cambia cada vez que cambia la foto (sirve para no mostrar una vieja de caché). null: sin foto. */
  photoVersion: string | null;
};

/** Una cuenta: tu ficha más las de tu familia. Suficiente para una familia grande, y frena el abuso. */
export const MAX_PROFILES_PER_ACCOUNT = 10;

/** Foto en base64 (sin el prefijo data:). El servidor la recorta, la achica y le borra los metadatos. */
export const profilePhotoSchema = z.object({
  image: z.string().min(1).max(3_000_000),
});
export type ProfilePhotoInput = z.infer<typeof profilePhotoSchema>;

export const markPrintedSchema = z.object({ fingerprint: z.string().regex(/^[0-9a-f]{64}$/) });
