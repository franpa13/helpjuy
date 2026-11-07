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

export type MeResponse = {
  id: string;
  email: string;
  emailVerified: boolean;
  /** Entró con Google y su cuenta tiene foto: se le ofrece copiarla a su ficha. */
  googlePhoto: boolean;
};

export const tokenSchema = z.object({ token: z.string().min(10).max(200) });
export type TokenInput = z.infer<typeof tokenSchema>;

export const forgotPasswordSchema = z.object({ email: emailSchema });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(10).max(200),
  password: z.string().min(8).max(128),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
