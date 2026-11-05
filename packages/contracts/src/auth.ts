import { z } from 'zod';

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

export const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(128),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;

export type MeResponse = { id: string; email: string; emailVerified: boolean };
