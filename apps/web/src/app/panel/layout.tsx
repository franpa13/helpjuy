import type { MeResponse } from '@helpjuy/contracts';
import type { ReactNode } from 'react';
import { PanelShell } from '@/features/panel/components/PanelShell';
import { apiServer } from '@/shared/api/server';

/** Todo /panel/* comparte la barra lateral (escritorio) o las pestañas de abajo (celular). */
export default async function PanelLayout({ children }: { children: ReactNode }) {
  const me = await apiServer<MeResponse>('/auth/me');
  return (
    <PanelShell email={me?.email} admin={me?.admin ?? false}>
      {children}
    </PanelShell>
  );
}
