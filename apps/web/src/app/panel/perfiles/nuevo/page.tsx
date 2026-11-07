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
  // La primera ficha es siempre la tuya; recién después se agregan las de la familia.
  const hasOwn = profiles.some((p) => p.relationship === 'SELF');
  if (!consent) throw new Error('No se pudo cargar el consentimiento');

  return (
    <PanelPage
      title={hasOwn ? 'Nueva ficha' : 'Tu ficha'}
      subtitle={
        hasOwn
          ? 'Para alguien de tu familia o a tu cargo. Después cargás alergias, medicación y contactos.'
          : 'Primero la tuya. Después vas a poder cargar alergias, medicación y contactos, y sumar a tu familia.'
      }
      back={profiles.length > 0 ? { href: '/panel', label: 'Mis fichas' } : undefined}
      aside={<NewProfileNext />}
      asideLabel="Qué sigue"
    >
      <NewProfileForm consent={consent} hasOwn={hasOwn} />
    </PanelPage>
  );
}
