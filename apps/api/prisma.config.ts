import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // Migraciones por la conexión directa (Neon: sin pooler); la app usa DATABASE_URL (con pooler).
  // Sin URL no fallamos acá: `prisma generate` no la necesita (en Vercel la web instala todo el monorepo sin base);
  // `migrate` sí, y avisa si falta.
  datasource: { url: process.env.DIRECT_URL || process.env.DATABASE_URL || '' },
});
