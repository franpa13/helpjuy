'use client';

import { resetPasswordSchema } from '@helpjuy/contracts';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { ApiError, postJson } from '@/shared/api/client';
import { toFieldErrors, type FieldErrors } from '@/shared/forms/errors';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';
import { Field } from '@/shared/ui/Field';
import { AUTH_FIELD_MESSAGES, authErrorMessage } from '../messages';

export function ResetForm({ token }: { token: string }) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);

  if (!token) {
    return (
      <div className="stack">
        <Alert tone="error">{authErrorMessage('invalid_token')}</Alert>
        <Link href="/recuperar">Pedir otro link</Link>
      </div>
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = { token, password: String(new FormData(e.currentTarget).get('password') ?? '') };
    const parsed = resetPasswordSchema.safeParse(data);
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error, AUTH_FIELD_MESSAGES));
      return;
    }
    setErrors({});
    setSending(true);
    try {
      await postJson('/auth/reset-password', parsed.data);
      setDone(true);
    } catch (err) {
      setFormError(authErrorMessage(err instanceof ApiError ? err.code : 'unknown'));
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <div className="stack">
        <Alert tone="success">Contraseña cambiada. Ingresá de nuevo.</Alert>
        <Link href="/ingresar">Ir a ingresar</Link>
      </div>
    );
  }

  return (
    <form className="stack" onSubmit={onSubmit} noValidate>
      {formError && (
        <Alert tone="error">
          {formError} <Link href="/recuperar">Pedir otro link</Link>
        </Alert>
      )}
      <Field
        label="Contraseña nueva"
        name="password"
        type="password"
        autoComplete="new-password"
        hint="Mínimo 8 caracteres"
        error={errors.password}
      />
      <Button type="submit" disabled={sending}>
        Guardar contraseña
      </Button>
    </form>
  );
}
