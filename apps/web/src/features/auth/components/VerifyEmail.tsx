'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ApiError, postJson } from '@/shared/api/client';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

type State = 'checking' | 'ok' | 'invalid' | 'resent' | 'needs-login';

export function VerifyEmail({ token }: { token: string }) {
  const [state, setState] = useState<State>(token ? 'checking' : 'invalid');
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    postJson('/auth/verify-email', { token })
      .then(() => setState('ok'))
      .catch(() => setState('invalid'));
  }, [token]);

  async function resend() {
    try {
      await postJson('/auth/resend-verification');
      setState('resent');
    } catch (err) {
      setState(err instanceof ApiError && err.status === 401 ? 'needs-login' : 'invalid');
    }
  }

  if (state === 'checking') return <p className="text-muted-foreground">Confirmando tu email…</p>;
  if (state === 'ok')
    return (
      <div className="stack">
        <Alert variant="success">Listo, tu email quedó confirmado.</Alert>
        <Link href="/panel">Ir a mis fichas</Link>
      </div>
    );
  if (state === 'resent') return <Alert variant="success">Te mandamos otro link. Revisá tu correo.</Alert>;
  if (state === 'needs-login')
    return (
      <Alert variant="warning">
        Para pedir otro link primero <Link href="/ingresar?next=/panel">ingresá a tu cuenta</Link>.
      </Alert>
    );
  return (
    <div className="stack">
      <Alert variant="error">El link venció o ya se usó.</Alert>
      <Button type="button" onClick={resend}>
        Mandarme otro
      </Button>
    </div>
  );
}
