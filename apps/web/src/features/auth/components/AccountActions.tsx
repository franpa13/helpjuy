'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { postJson } from '@/shared/api/client';
import { Alert } from '@/components/ui/alert';

export function ResendVerificationBanner() {
  const [sent, setSent] = useState(false);
  if (sent) return <Alert variant="success">Te mandamos el link de nuevo. Revisá tu correo.</Alert>;
  return (
    <Alert variant="warning">
      Confirmá tu email para recibir avisos.{' '}
      <button
        type="button"
        onClick={async () => {
          await postJson('/auth/resend-verification').catch(() => undefined);
          setSent(true);
        }}
        className="cursor-pointer bg-transparent p-0 font-bold underline"
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
      className="cursor-pointer bg-transparent p-0 uppercase"
    >
      Salir
    </button>
  );
}
