'use client';

import { registerSchema, type MeResponse } from '@helpjuy/contracts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ApiError, postJson } from '@/shared/api/client';
import { toFieldErrors, type FieldErrors } from '@/shared/forms/errors';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';
import { Field } from '@/shared/ui/Field';
import { AUTH_FIELD_MESSAGES, authErrorMessage } from '../messages';
import { GoogleButton } from './GoogleButton';

export function RegisterForm({ googleEnabled = false }: { googleEnabled?: boolean }) {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const parsed = registerSchema.safeParse(data);
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error, AUTH_FIELD_MESSAGES));
      return;
    }
    setErrors({});
    setSending(true);
    try {
      await postJson<MeResponse>('/auth/register', parsed.data);
      router.push('/panel/perfiles/nuevo');
    } catch (err) {
      setFormError(authErrorMessage(err instanceof ApiError ? err.code : 'unknown'));
      setSending(false);
    }
  }

  return (
    <form className="stack" onSubmit={onSubmit} noValidate>
      {formError && <Alert tone="error">{formError}</Alert>}
      {googleEnabled && <GoogleButton next="/panel" />}
      <Field label="Email" name="email" type="email" autoComplete="email" inputMode="email" error={errors.email} />
      <Field
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="new-password"
        hint="Mínimo 8 caracteres"
        error={errors.password}
      />
      <Button type="submit" disabled={sending}>
        {sending ? 'Creando…' : 'Crear cuenta'}
      </Button>
      <p className="muted">
        ¿Ya tenés cuenta? <Link href="/ingresar">Ingresá</Link>
      </p>
    </form>
  );
}
