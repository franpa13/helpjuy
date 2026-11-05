import { PUBLIC_TOKEN_RE } from '@helpjuy/contracts';
import { revalidateTag } from 'next/cache';
import { timingSafeEqual } from 'node:crypto';

const MAX_TOKENS = 10;

const sameSecret = (a: string, b: string) => {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
};

/**
 * La API llama acá cuando cambia una ficha. `expire: 0` hace que la próxima visita
 * regenere la página en vez de servir la versión vieja: con datos médicos, lo correcto
 * importa más que lo rápido. La API visita la página enseguida (warm-up).
 */
export async function POST(request: Request): Promise<Response> {
  const secret = process.env.REVALIDATE_SECRET;
  const sent = request.headers.get('x-revalidate-secret') ?? '';
  if (!secret || !sameSecret(sent, secret)) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  let tokens: unknown = [];
  try {
    tokens = ((await request.json()) as { tokens?: unknown }).tokens ?? [];
  } catch {
    return Response.json({ error: 'validation' }, { status: 400 });
  }
  if (!Array.isArray(tokens)) return Response.json({ error: 'validation' }, { status: 400 });

  const valid = tokens.filter((t): t is string => typeof t === 'string' && PUBLIC_TOKEN_RE.test(t)).slice(0, MAX_TOKENS);
  for (const t of valid) revalidateTag(`card:${t}`, { expire: 0 });
  return Response.json({ revalidated: valid.length });
}
