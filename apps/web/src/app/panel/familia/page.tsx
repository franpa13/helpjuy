import type { FamilyGroupDto, MeResponse } from '@helpjuy/contracts';
import { redirect } from 'next/navigation';
import { FamilyGroups } from '@/features/family/components/FamilyGroups';
import { PanelPage } from '@/features/panel/components/PanelPage';
import { apiServer } from '@/shared/api/server';

export const metadata = { title: 'Familia — HelpJuy' };

export default async function FamiliaPage() {
  const me = await apiServer<MeResponse>('/auth/me');
  if (!me) redirect('/ingresar?next=/panel/familia');
  const groups = (await apiServer<FamilyGroupDto[]>('/family-groups')) ?? [];

  return (
    <PanelPage title="Mi familia" subtitle="Las personas que se enteran si te pasa algo.">
      <FamilyGroups initial={groups} emailVerified={me.emailVerified} />
    </PanelPage>
  );
}
