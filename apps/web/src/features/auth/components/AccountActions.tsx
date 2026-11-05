'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { postJson } from '@/shared/api/client';
import { Alert } from '@/shared/ui/Alert';

export function ResendVerificationBanner() {
  const [sent, setSent] = useState(false);
  if (sent) return <Alert tone="success">Te mandamos el link de nuevo. Revisá tu correo.</Alert>;
  return (
    <Alert tone="warning">
      Confirmá tu email para recibir avisos.{' '}
      <button
        type="button"
        onClick={async () => {
          await postJson('/auth/resend-verification').catch(() => undefined);
          setSent(true);
        }}
        style={{ font: 'inherit', fontWeight: 700, textDecoration: 'underline', background: 'none', border: 0, cursor: 'pointer', padding: 0 }}
      >
        Reenviar
      </button>
    </Alert>
  );
}

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await postJson('/auth/logout').catch(() => undefined);
        router.push('/ingresar');
        router.refresh();
      }}
      style={{ font: 'inherit', color: 'inherit', background: 'none', border: 0, cursor: 'pointer', letterSpacing: 'inherit', textTransform: 'inherit' }}
    >
      Salir
    </button>
  );
}
