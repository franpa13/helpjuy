import type { Metadata } from 'next';
import { DEMO_CARD } from '@/features/demo/demo-card';
import { EmergencyCard } from '@/features/emergency-card/components/EmergencyCard';

export const metadata: Metadata = {
  title: 'Ficha de ejemplo — HelpJuy',
  description: 'Así ve tu ficha de emergencia quien escanea tu QR.',
  robots: { index: false, follow: true },
};

/** Ficha de ejemplo (persona inventada, sin base de datos). Los botones no llaman ni avisan a nadie. */
export default function DemoPage() {
  return <EmergencyCard card={DEMO_CARD} demo />;
}
