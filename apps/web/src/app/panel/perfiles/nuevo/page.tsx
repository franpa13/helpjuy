import { MAX_PROFILES_PER_ACCOUNT, type ConsentDto, type MeResponse, type ProfileDto } from '@helpjuy/contracts';
import { ResendVerificationBanner } from '@/features/auth/components/AccountActions';
import { Alert } from '@/components/ui/alert';
import { redirect } from 'next/navigation';
import { PanelPage } from '@/features/panel/components/PanelPage';
import { NewProfileNext } from '@/features/profiles/components/NewProfileNext';
import { NewProfileForm } from '@/features/profiles/components/NewProfileForm';
import { apiServer } from '@/shared/api/server';

export const metadata = { title: 'Nueva ficha — HelpJuy' };

export default async function NuevoPerfilPage() {
  const [me, profiles] = await Promise.all([apiServer<MeResponse>('/auth/me'), apiServer<ProfileDto[]>('/profiles')]);
  if (!me || !profiles) redirect('/ingresar?next=/panel/perfiles/nuevo');
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
      ) : hasOwn && !me.emailVerified ? (
        // Las fichas de la familia piden el email confirmado (frena la creación masiva de fichas).
        <div className="stack">
          <Alert variant="warning">
            <strong>Para agregar la ficha de otra persona, primero confirmá tu email.</strong> Te mandamos un link cuando
            creaste la cuenta; si no lo encontrás, pedí otro acá abajo.
          </Alert>
          <ResendVerificationBanner />
        </div>
      ) : (
        <NewProfileForm consent={consent} hasOwn={hasOwn} />
      )}
    </PanelPage>
  );
}
