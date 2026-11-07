import type { MeResponse } from '@helpjuy/contracts';
import { redirect } from 'next/navigation';
import { AccountSettings } from '@/features/account/components/AccountSettings';
import { PanelBox, PanelPage } from '@/features/panel/components/PanelPage';
import { apiServer } from '@/shared/api/server';

export const metadata = { title: 'Tu cuenta — HelpJuy' };

export default async function CuentaPage() {
  const me = await apiServer<MeResponse>('/auth/me');
  if (!me) redirect('/ingresar?next=/panel/cuenta');

  return (
    <PanelPage
      title="Tu cuenta"
      subtitle="Tus datos son tuyos: los podés descargar o borrar cuando quieras."
      back={{ href: '/panel', label: 'Mis fichas' }}
      asideLabel="Tus derechos"
      aside={
        <PanelBox title="Tus derechos">
          <p className="text-[15px] text-muted-foreground">
            La Ley 25.326 de Protección de Datos Personales te da derecho a saber qué datos tuyos guardamos, a corregirlos y
            a pedir que los borremos. Acá lo hacés vos, sin pedirle nada a nadie.
          </p>
        </PanelBox>
      }
    >
      <AccountSettings email={me.email} emailVerified={me.emailVerified} />
    </PanelPage>
  );
}
