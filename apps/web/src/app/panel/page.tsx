import type { MeResponse, ProfileDto } from '@helpjuy/contracts';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LogoutButton, ResendVerificationBanner } from '@/features/auth/components/AccountActions';
import { AppStrip } from '@/features/auth/components/AuthShell';
import { ProfileList } from '@/features/profiles/components/ProfileList';
import { apiServer } from '@/shared/api/server';
import { buttonClass } from '@/shared/ui/Button';

export const metadata = { title: 'Tus fichas — HelpJuy' };

export default async function PanelPage() {
  const me = await apiServer<MeResponse>('/auth/me');
  if (!me) redirect('/ingresar?next=/panel');
  const profiles = (await apiServer<ProfileDto[]>('/profiles')) ?? [];
  if (profiles.length === 0) redirect('/panel/perfiles/nuevo');

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
      </main>
    </>
  );
}
