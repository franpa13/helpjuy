import type { ConsentDto, ProfileDto } from '@helpjuy/contracts';
import { redirect } from 'next/navigation';
import { PanelPage } from '@/features/panel/components/PanelPage';
import { NewProfileNext } from '@/features/profiles/components/NewProfileNext';
import { NewProfileForm } from '@/features/profiles/components/NewProfileForm';
import { apiServer } from '@/shared/api/server';

export const metadata = { title: 'Nueva ficha — HelpJuy' };

export default async function NuevoPerfilPage() {
  const profiles = await apiServer<ProfileDto[]>('/profiles');
  if (!profiles) redirect('/ingresar?next=/panel/perfiles/nuevo');
  const consent = await apiServer<ConsentDto>('/consent/current');
  if (!consent) throw new Error('No se pudo cargar el consentimiento');

  return (
    <PanelPage
      title="Nueva ficha"
      subtitle="Después vas a poder cargar alergias, medicación y contactos."
      back={profiles.length > 0 ? { href: '/panel', label: 'Mis fichas' } : undefined}
      aside={<NewProfileNext />}
      asideLabel="Qué sigue"
    >
      <NewProfileForm consent={consent} isFirst={profiles.length === 0} />
    </PanelPage>
  );
}
