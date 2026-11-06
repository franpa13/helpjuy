type Env = { NODE_ENV?: string; SITE_URL?: string };

const PRIVATE_HOST = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.0\.0\.0|\[?::1\]?)/;

/**
 * Dirección pública que va dentro del QR. Un QR impreso no se puede corregir después,
 * así que en producción exigimos una URL pública https y fallamos fuerte si no está.
 * En desarrollo: SITE_URL=http://<IP-de-tu-compu>:3000 para probar con el celular en tu Wi-Fi.
 */
export function resolveSiteUrl(env: Env = process.env): string {
  const raw = env.SITE_URL?.trim();
  if (env.NODE_ENV !== 'production') return (raw || 'http://localhost:3000').replace(/\/$/, '');

  let url: URL;
  try {
    url = new URL(raw ?? '');
  } catch {
    throw new Error('Falta configurar SITE_URL (la dirección pública del sitio): sin eso los QR impresos no funcionarían.');
  }
  if (url.protocol !== 'https:' || PRIVATE_HOST.test(url.hostname)) {
    throw new Error(`SITE_URL tiene que ser una dirección pública https (recibido: ${raw}).`);
  }
  return url.origin;
}
