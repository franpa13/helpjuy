import { z } from 'zod';

export const healthResponseSchema = z.object({ status: z.literal('ok') });
export type HealthResponse = z.infer<typeof healthResponseSchema>;
export * from './auth';
export * from './consent';
export * from './profiles';
export * from './medical';
export * from './public-card';
export * from './family';
