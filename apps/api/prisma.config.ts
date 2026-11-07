import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // Migraciones por la conexión directa (Neon: sin pooler); la app usa DATABASE_URL (con pooler).
  datasource: { url: process.env.DIRECT_URL || env('DATABASE_URL') },
});
