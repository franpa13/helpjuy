'use client';

import { forgotPasswordSchema } from '@helpjuy/contracts';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { ApiError, postJson } from '@/shared/api/client';
import { toFieldErrors, type FieldErrors } from '@/shared/forms/errors';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';
import { Field } from '@/shared/ui/Field';
import { AUTH_FIELD_MESSAGES, authErrorMessage } from '../messages';

export function ForgotForm() {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error, AUTH_FIELD_MESSAGES));
      return;
    }
    setErrors({});
    setSending(true);
    try {
      await postJson('/auth/forgot-password', parsed.data);
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
        <Alert tone="success">Si hay una cuenta con ese email, te mandamos un link para elegir una contraseña nueva. Revisá también el correo no deseado.</Alert>
        <Link href="/ingresar">Volver a ingresar</Link>
      </div>
    );
  }

  return (
    <form className="stack" onSubmit={onSubmit} noValidate>
      {formError && <Alert tone="error">{formError}</Alert>}
      <Field label="Email" name="email" type="email" autoComplete="email" inputMode="email" error={errors.email} />
      <Button type="submit" disabled={sending}>
        Mandarme el link
      </Button>
    </form>
  );
}
