import type { ConsentDto, ProfileDto } from '@helpjuy/contracts';
import { redirect } from 'next/navigation';
import { NewProfileForm } from '@/features/profiles/components/NewProfileForm';
import { apiServer } from '@/shared/api/server';

export const metadata = { title: 'Nueva ficha — HelpJuy' };

export default async function NuevoPerfilPage() {
  const profiles = await apiServer<ProfileDto[]>('/profiles');
  if (!profiles) redirect('/ingresar?next=/panel/perfiles/nuevo');
  const consent = await apiServer<ConsentDto>('/consent/current');
  if (!consent) throw new Error('No se pudo cargar el consentimiento');

  return (
    <>
      <main className="page">
        <div className="page-title">
          <h1>Nueva ficha</h1>
          <p>Después vas a poder cargar alergias, medicación y contactos.</p>
        </div>
        <NewProfileForm consent={consent} isFirst={profiles.length === 0} />
      </main>
    </>
  );
}
