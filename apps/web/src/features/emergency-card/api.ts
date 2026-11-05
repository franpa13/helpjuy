import 'server-only';
import type { PublicCardDto } from '@helpjuy/contracts';

export const cardTag = (token: string) => `card:${token}`;

/** Techo de antigüedad: si se pierde una invalidación, la ficha se corrige sola en como máximo 1 hora. */
export const CARD_MAX_AGE_SECONDS = 3600;
const API_TIMEOUT_MS = 8_000;

/**
 * Ficha pública cacheada por Next (tag `card:{token}`). La API la invalida al cambiar
 * (`/internal/revalidate`), así el escaneo casi nunca depende de que la API esté despierta.
 */
export async function getPublicCard(token: string): Promise<PublicCardDto | null> {
  const res = await fetch(`${process.env.API_URL}/public/cards/${token}`, {
    cache: 'force-cache',
    next: { revalidate: CARD_MAX_AGE_SECONDS, tags: [cardTag(token)] },
    // La web se identifica: así todos los renders no comparten el límite por IP de la API.
    headers: process.env.PROXY_SECRET ? { 'x-proxy-secret': process.env.PROXY_SECRET } : {},
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`La API respondió ${res.status} para la ficha pública`);
  return (await res.json()) as PublicCardDto;
}
