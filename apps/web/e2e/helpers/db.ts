import pg from 'pg';

/** Base de test del e2e (la misma que usa la API levantada por playwright.config.ts). */
const TEST_DB = 'postgresql://helpjuy:helpjuy@localhost:5433/helpjuy_test';

/** Equivale a que la persona abra el link de confirmación que le llegó por email. */
export async function verifyEmail(email: string): Promise<void> {
  const client = new pg.Client({ connectionString: TEST_DB });
  await client.connect();
  try {
    await client.query('UPDATE "User" SET "emailVerifiedAt" = now() WHERE email = $1', [email.toLowerCase()]);
  } finally {
    await client.end();
  }
}
