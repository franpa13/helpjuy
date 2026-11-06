'use client';

import { loginSchema, type MeResponse } from '@helpjuy/contracts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ApiError, postJson } from '@/shared/api/client';
import { safeNext, toFieldErrors, type FieldErrors } from '@/shared/forms/errors';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field } from '@/shared/ui/Field';
import { PasswordField } from '@/shared/ui/PasswordField';
import { AUTH_FIELD_MESSAGES, authErrorMessage } from '../messages';
import { GoogleButton } from './GoogleButton';

export function LoginForm({ next, googleEnabled = false, error }: { next?: string; googleEnabled?: boolean; error?: string }) {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(error ? authErrorMessage(error) : null);
  const [sending, setSending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const parsed = loginSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error, AUTH_FIELD_MESSAGES));
      return;
    }
    setErrors({});
    setSending(true);
    try {
      await postJson<MeResponse>('/auth/login', parsed.data);
      router.push(safeNext(next, '/panel'));
    } catch (err) {
      setFormError(authErrorMessage(err instanceof ApiError ? err.code : 'unknown'));
      setSending(false);
    }
  }

  return (
    <form className="stack" onSubmit={onSubmit} noValidate>
      {formError && <Alert variant="error">{formError}</Alert>}
      {googleEnabled && <GoogleButton next={safeNext(next, '/panel')} />}
      <Field label="Email" name="email" type="email" autoComplete="email" inputMode="email" error={errors.email} />
      <PasswordField label="Contraseña" name="password" autoComplete="current-password" error={errors.password} />
      <p style={{ marginTop: -6, textAlign: 'right', fontSize: 15 }}>
        <Link href="/recuperar">Me olvidé la contraseña</Link>
      </p>
      <Button type="submit" disabled={sending}>
        {sending ? 'Ingresando…' : 'Ingresar'}
      </Button>
      <p className="text-muted-foreground">
        ¿No tenés cuenta? <Link href="/registro">Creá tu ficha</Link>
      </p>
    </form>
  );
}
