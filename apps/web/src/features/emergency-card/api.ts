import 'server-only';
import type { PublicCardDto } from '@helpjuy/contracts';

export const cardTag = (token: string) => `card:${token}`;

/**
 * Ficha pública cacheada por Next (tag `card:{token}`). La API la invalida al cambiar
 * (`/internal/revalidate`), así el escaneo nunca depende de que la API esté despierta.
 */
export async function getPublicCard(token: string): Promise<PublicCardDto | null> {
  const res = await fetch(`${process.env.API_URL}/public/cards/${token}`, {
    cache: 'force-cache',
    next: { tags: [cardTag(token)] },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`La API respondió ${res.status} para la ficha pública`);
  return (await res.json()) as PublicCardDto;
}
