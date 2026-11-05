'use client';

import { loginSchema, type MeResponse } from '@helpjuy/contracts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ApiError, postJson } from '@/shared/api/client';
import { safeNext, toFieldErrors, type FieldErrors } from '@/shared/forms/errors';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';
import { Field } from '@/shared/ui/Field';
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
      {formError && <Alert tone="error">{formError}</Alert>}
      {googleEnabled && <GoogleButton next={safeNext(next, '/panel')} />}
      <Field label="Email" name="email" type="email" autoComplete="email" inputMode="email" error={errors.email} />
      <Field label="Contraseña" name="password" type="password" autoComplete="current-password" error={errors.password} />
      <Button type="submit" disabled={sending}>
        {sending ? 'Ingresando…' : 'Ingresar'}
      </Button>
      <p className="muted">
        <Link href="/recuperar">Me olvidé la contraseña</Link>
      </p>
      <p className="muted">
        ¿No tenés cuenta? <Link href="/registro">Creá tu ficha</Link>
      </p>
    </form>
  );
}
