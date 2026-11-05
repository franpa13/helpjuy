import { z } from 'zod';

export const CONSENT_VERSION = '2026-11-05';

export const consentAcceptanceSchema = z.object({
  version: z.string().min(1).max(32),
  accepted: z.literal(true),
  guardianDeclared: z.boolean().optional(),
});
export type ConsentAcceptance = z.infer<typeof consentAcceptanceSchema>;

export type ConsentDto = { version: string; text: string };
