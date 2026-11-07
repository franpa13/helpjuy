'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { postJson } from '@/shared/api/client';

export function ResendVerificationBanner() {
  const [sent, setSent] = useState(false);
  if (sent) return <Alert variant="success">Te mandamos el link de nuevo. Revisá tu correo.</Alert>;
  return (
    <Alert variant="warning">
      Confirmá tu email para recibir avisos.{' '}
      <Button
        type="button"
        variant="link"
        className="align-baseline"
        onClick={async () => {
          await postJson('/auth/resend-verification').catch(() => undefined);
          setSent(true);
        }}
      >
        Reenviar
      </Button>
    </Alert>
  );
}

/** Salir: hereda el color y la tipografía de donde está (barra lateral o barra de arriba). */
export function LogoutButton() {
  const router = useRouter();
  return (
    <Button
      type="button"
      variant="link"
      className="gap-1.5 font-head text-[15px] font-bold tracking-[0.12em] text-white uppercase no-underline"
      onClick={async () => {
        await postJson('/auth/logout').catch(() => undefined);
        router.push('/ingresar');
        router.refresh();
      }}
    >
      Salir
      <LogOut aria-hidden="true" size={15} />
    </Button>
  );
}
