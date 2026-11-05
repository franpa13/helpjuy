import { z } from 'zod';
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

const name = z.string().trim().min(1).max(60);

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
};
