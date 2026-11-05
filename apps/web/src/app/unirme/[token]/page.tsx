import type { InvitePreviewDto } from '@helpjuy/contracts';
import { BellRing, EyeOff, LogOut } from 'lucide-react';
import Link from 'next/link';
import { AuthShell } from '@/features/auth/components/AuthShell';
import { AcceptInvite } from '@/features/family/components/AcceptInvite';
import { headers } from 'next/headers';
import { clientIpHeaders } from '@/shared/api/client-ip';
import { apiServer } from '@/shared/api/server';
import { Alert } from '@/shared/ui/Alert';
import { buttonClass } from '@/shared/ui/Button';

export const metadata = { title: 'Invitación a un grupo familiar — HelpJuy', robots: { index: false, follow: false } };

async function getPreview(token: string): Promise<InvitePreviewDto | 'invalid' | 'error'> {
  try {
    const res = await fetch(`${process.env.API_URL}/family-invites/${encodeURIComponent(token)}`, {
      cache: 'no-store',
      headers: clientIpHeaders(await headers()),
    });
    if (res.status === 400 || res.status === 404) return 'invalid';
    return res.ok ? ((await res.json()) as InvitePreviewDto) : 'error';
  } catch {
    return 'error';
  }
}

export default async function UnirmePage({ params }: PageProps<'/unirme/[token]'>) {
  const { token } = await params;
  const [preview, me] = await Promise.all([getPreview(token), apiServer('/auth/me')]);
  const next = `/unirme/${token}`;

  if (preview === 'error') {
    return (
      <AuthShell variant="recover" title="No pudimos abrir la invitación">
        <Alert tone="warning">Puede ser la conexión. Esperá un momento y volvé a abrir el link.</Alert>
      </AuthShell>
    );
  }
  if (preview === 'invalid') {
    return (
      <AuthShell variant="recover" title="Esta invitación no sirve">
        <Alert tone="error">La invitación venció, se canceló o ya se usó. Pedile a quien te invitó un link nuevo.</Alert>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      variant="register"
      title={`Te invitan a ${preview.groupName}`}
      subtitle={`${preview.inviterName} quiere que te enteres si le pasa algo. Ya ${preview.memberCount === 1 ? 'hay 1 persona' : `hay ${preview.memberCount} personas`} en el grupo.`}
    >
      <div className="stack">
        <ul className="stack" style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ display: 'flex', gap: 12 }}>
            <BellRing aria-hidden="true" />
            <span>
              <strong>Vas a recibir un aviso por email</strong> si alguien escanea el QR de un miembro y marca una emergencia.
            </span>
          </li>
          <li style={{ display: 'flex', gap: 12 }}>
            <EyeOff aria-hidden="true" />
            <span>
              <strong>No vas a ver datos médicos</strong> de nadie, y nadie ve los tuyos.
            </span>
          </li>
          <li style={{ display: 'flex', gap: 12 }}>
            <LogOut aria-hidden="true" />
            <span>
              <strong>Podés silenciar o salir</strong> del grupo cuando quieras.
            </span>
          </li>
        </ul>

        {me ? (
          <AcceptInvite token={token} groupName={preview.groupName} />
        ) : (
          <>
            <Link className={buttonClass()} href={`/registro?next=${encodeURIComponent(next)}`}>
              Crear mi cuenta y unirme
            </Link>
            <Link className={buttonClass('secondary')} href={`/ingresar?next=${encodeURIComponent(next)}`}>
              Ya tengo cuenta
            </Link>
          </>
        )}
      </div>
    </AuthShell>
  );
}
