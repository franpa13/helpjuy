import type { FamilyGroupDto, MeResponse, ProfileDto } from '@helpjuy/contracts';
import { redirect } from 'next/navigation';
import { FamilyGroups } from '@/features/family/components/FamilyGroups';
import dash from '@/features/panel/components/dashboard.module.css';
import { apiServer } from '@/shared/api/server';

export const metadata = { title: 'Familia — HelpJuy' };

export default async function FamiliaPage() {
  const me = await apiServer<MeResponse>('/auth/me');
  if (!me) redirect('/ingresar?next=/panel/familia');
  const [groups, profiles] = await Promise.all([
    apiServer<FamilyGroupDto[]>('/family-groups').then((g) => g ?? []),
    apiServer<ProfileDto[]>('/profiles').then((p) => p ?? []),
  ]);
  const self = profiles.find((p) => p.relationship === 'SELF');

  return (
    <>
      <main className={dash.wrap}>
        <div className={dash.head}>
          <h1>Mi familia</h1>
          <p>Las personas que se enteran si te pasa algo.</p>
        </div>
        <FamilyGroups
          initial={groups}
          emailVerified={me.emailVerified}
          myName={self ? `${self.firstName} ${self.lastName}` : undefined}
        />
      </main>
    </>
  );
}
