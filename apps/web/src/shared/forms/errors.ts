import type { ZodError } from 'zod';

export type FieldErrors = Partial<Record<string, string>>;

/**
 * Traduce los errores de zod a un mensaje en español por campo.
 * `messages[campo]` es el texto para ese campo; si el campo tiene un mínimo, `messages['campo.too_small']`.
 */
export function toFieldErrors(error: ZodError, messages: Record<string, string>): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? '');
    if (out[field]) continue;
    out[field] = messages[`${field}.${issue.code}`] ?? messages[field] ?? 'Revisá este dato';
  }
  return out;
}

/** Devuelve un `next` interno seguro (evita redirecciones a otros sitios). */
export function safeNext(next: string | undefined | null, fallback: string): string {
  if (!next || !next.startsWith('/')) return fallback;
  // El parser de URL ignora tabs/saltos y trata "\" como "/": resolvemos y exigimos el mismo origen.
  const base = 'http://helpjuy.invalid';
  let url: URL;
  try {
    url = new URL(next, base);
  } catch {
    return fallback;
  }
  if (url.origin !== base) return fallback;
  return url.pathname + url.search;
}
