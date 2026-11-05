import { PUBLIC_TOKEN_RE } from '@helpjuy/contracts';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicCard } from '@/features/emergency-card/api';
import { EmergencyCard } from '@/features/emergency-card/components/EmergencyCard';

// ISR: cada ficha se genera en el primer pedido y queda cacheada. La API la invalida al cambiar.
// Como red de seguridad, se refresca en segundo plano una vez por día.
export const revalidate = 86400;

export function generateStaticParams() {
  return [];
}

export const metadata: Metadata = {
  title: 'Ficha de emergencia — HelpJuy',
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: 'no-referrer',
};

export default async function EmergencyCardPage({ params }: PageProps<'/e/[token]'>) {
  const { token } = await params;
  if (!PUBLIC_TOKEN_RE.test(token)) notFound();
  const card = await getPublicCard(token);
  if (!card) notFound();
  return <EmergencyCard card={card} token={token} />;
}
