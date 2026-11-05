import 'server-only';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'hj_session';

/**
 * Llamada a la API desde un Server Component, reenviando la cookie de sesión.
 * Devuelve null si no hay sesión (401).
 */
export async function apiServer<T>(path: string): Promise<T | null> {
  const store = await cookies();
  const session = store.get(SESSION_COOKIE)?.value;
  const res = await fetch(`${process.env.API_URL}${path}`, {
    headers: session ? { Cookie: `${SESSION_COOKIE}=${session}` } : {},
    cache: 'no-store',
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`API ${path} respondió ${res.status}`);
  return (await res.json()) as T;
}
