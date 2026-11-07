import { MAX_PROFILES_PER_ACCOUNT, type ConsentDto, type ProfileDto } from '@helpjuy/contracts';
import { Alert } from '@/components/ui/alert';
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
      {profiles.length >= MAX_PROFILES_PER_ACCOUNT ? (
        <Alert variant="warning">
          Llegaste al máximo de {MAX_PROFILES_PER_ACCOUNT} fichas por cuenta. Si necesitás más, otra persona de la familia
          puede crear su propia cuenta y sumarse a tu grupo familiar.
        </Alert>
      ) : (
        <NewProfileForm consent={consent} hasOwn={hasOwn} />
      )}
    </PanelPage>
  );
}
