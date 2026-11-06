import type { FamilyGroupDto, MeResponse, ProfileDto } from '@helpjuy/contracts';
import { Users } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ResendVerificationBanner } from '@/features/auth/components/AccountActions';
import { NextSteps } from '@/features/panel/components/NextSteps';
import { ProfileCards } from '@/features/panel/components/ProfileCards';
import { PanelPage } from '@/features/panel/components/PanelPage';
import { apiServer } from '@/shared/api/server';
import styles from './panel.module.css';

export const metadata = { title: 'Mis fichas — HelpJuy' };

export default async function MisFichasPage() {
  const me = await apiServer<MeResponse>('/auth/me');
  if (!me) redirect('/ingresar?next=/panel');
  const [profiles, groups] = await Promise.all([
    apiServer<ProfileDto[]>('/profiles').then((p) => p ?? []),
    apiServer<FamilyGroupDto[]>('/family-groups').then((g) => g ?? []),
  ]);
  if (profiles.length === 0) redirect('/panel/perfiles/nuevo');
  const members = new Set(groups.flatMap((g) => g.members.filter((m) => !m.isMe).map((m) => m.userId))).size;

  return (
    <PanelPage
      title="Mis fichas"
      subtitle="Cada ficha tiene su propio QR. Revisala cada tanto: un remedio nuevo o un teléfono que cambió hacen la diferencia."
      asideLabel="Próximos pasos"
      aside={
        <>
          {!me.emailVerified && <ResendVerificationBanner />}
          <NextSteps emailVerified={me.emailVerified} profiles={profiles} familyMembers={members} />
          <Link href="/panel/familia" className={styles.familyCard}>
            <span className={styles.familyIcon} aria-hidden="true">
              <Users size={24} />
            </span>
            <span>
              <strong>{groups.length === 0 ? '¿Querés que tu familia se entere si te pasa algo?' : 'Tu grupo familiar'}</strong>
              <span className={styles.familyText}>
                {groups.length === 0
                  ? 'Armá tu grupo familiar: si alguien marca una emergencia en tu QR, les llega un aviso.'
                  : `${members} ${members === 1 ? 'persona recibe' : 'personas reciben'} tus avisos de emergencia.`}
              </span>
            </span>
          </Link>
        </>
      }
    >
      <ProfileCards profiles={profiles} />
    </PanelPage>
  );
}
