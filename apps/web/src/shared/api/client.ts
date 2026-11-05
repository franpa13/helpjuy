/** Error de la API con el código que devuelve el backend (`{ error: '...' }`). */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly body: unknown,
  ) {
    super(code);
  }
}

/**
 * Llamada a la API desde el navegador. Pasa por el rewrite `/api/*` de Next,
 * así la cookie de sesión queda en el mismo dominio que la web.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });
  if (!res.ok) {
    let body: { error?: string } | undefined;
    try {
      body = await res.json();
    } catch {
      body = undefined;
    }
    throw new ApiError(res.status, body?.error ?? (res.status === 429 ? 'rate_limited' : 'unknown'), body);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const postJson = <T>(path: string, body?: unknown) =>
  apiFetch<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });
