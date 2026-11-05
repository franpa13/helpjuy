import type { FamilyGroupDto, MeResponse } from '@helpjuy/contracts';
import { redirect } from 'next/navigation';
import { FamilyGroups } from '@/features/family/components/FamilyGroups';
import { apiServer } from '@/shared/api/server';

export const metadata = { title: 'Familia — HelpJuy' };

export default async function FamiliaPage() {
  const me = await apiServer<MeResponse>('/auth/me');
  if (!me) redirect('/ingresar?next=/panel/familia');
  const groups = (await apiServer<FamilyGroupDto[]>('/family-groups')) ?? [];

  return (
    <>
      <main className="page stack">
        <div className="page-title">
          <h1>Mi familia</h1>
          <p>
            Si alguien escanea el QR de un miembro y toca &quot;Es una emergencia&quot;, le llega un aviso por email a todo el grupo.
            Nadie ve los datos médicos de los demás.
          </p>
        </div>
        <FamilyGroups initial={groups} emailVerified={me.emailVerified} />
      </main>
    </>
  );
}
