import type { FamilyGroupDto, MeResponse, ProfileDto } from '@helpjuy/contracts';
import { Users } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LogoutButton, ResendVerificationBanner } from '@/features/auth/components/AccountActions';
import { AppStrip } from '@/features/auth/components/AuthShell';
import { ProfileList } from '@/features/profiles/components/ProfileList';
import { apiServer } from '@/shared/api/server';
import { buttonClass } from '@/shared/ui/Button';
import styles from './panel.module.css';

export const metadata = { title: 'Tus fichas — HelpJuy' };

export default async function PanelPage() {
  const me = await apiServer<MeResponse>('/auth/me');
  if (!me) redirect('/ingresar?next=/panel');
  const [profiles, groups] = await Promise.all([
    apiServer<ProfileDto[]>('/profiles').then((p) => p ?? []),
    apiServer<FamilyGroupDto[]>('/family-groups').then((g) => g ?? []),
  ]);
  if (profiles.length === 0) redirect('/panel/perfiles/nuevo');
  const members = new Set(groups.flatMap((g) => g.members.filter((m) => !m.isMe).map((m) => m.userId))).size;

  return (
    <>
      <AppStrip right={<LogoutButton />} />
      <main className="page stack">
        <div className="page-title">
          <h1>Tus fichas</h1>
          <p>{me.email}</p>
        </div>
        {!me.emailVerified && <ResendVerificationBanner />}
        <ProfileList profiles={profiles} />
        <Link className={buttonClass('secondary')} href="/panel/perfiles/nuevo">
          Agregar otra persona
        </Link>

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
      </main>
    </>
  );
}
