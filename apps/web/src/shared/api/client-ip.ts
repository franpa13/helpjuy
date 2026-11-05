/**
 * La API limita intentos por IP. Como todas las requests le llegan desde el servidor de la web,
 * le pasamos la IP real del usuario firmada con un secreto compartido (PROXY_SECRET).
 * Vercel pisa `x-forwarded-for` con la IP real del cliente, así que el primer valor es confiable.
 */
export function clientIpHeaders(incoming: Headers): Record<string, string> {
  const secret = process.env.PROXY_SECRET;
  const ip = incoming.get('x-forwarded-for')?.split(',')[0]?.trim() || incoming.get('x-real-ip') || '';
  if (!secret || !ip) return {};
  return { 'x-proxy-secret': secret, 'x-client-ip': ip };
}
