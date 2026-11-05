'use client';

import { registerSchema, type MeResponse } from '@helpjuy/contracts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ApiError, postJson } from '@/shared/api/client';
import { safeNext, toFieldErrors, type FieldErrors } from '@/shared/forms/errors';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';
import { Field } from '@/shared/ui/Field';
import { PasswordField } from '@/shared/ui/PasswordField';
import { AUTH_FIELD_MESSAGES, authErrorMessage } from '../messages';
import { GoogleButton } from './GoogleButton';

export function RegisterForm({ googleEnabled = false, next }: { googleEnabled?: boolean; next?: string }) {
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
      // Si vino desde una invitación (u otro lugar interno), vuelve ahí; si no, a crear su ficha.
      router.push(safeNext(next, '/panel/perfiles/nuevo'));
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
      <PasswordField label="Contraseña" name="password" autoComplete="new-password" minLength={8} error={errors.password} />
      <Button type="submit" disabled={sending}>
        {sending ? 'Creando…' : 'Crear cuenta'}
      </Button>
      <p className="muted" style={{ fontSize: 14 }}>
        Todavía no guardamos nada de tu salud. Eso lo cargás vos en el paso siguiente, después de leer y aceptar cómo cuidamos tus datos.
      </p>
      <p className="muted">
        ¿Ya tenés cuenta? <Link href={next ? `/ingresar?next=${encodeURIComponent(next)}` : '/ingresar'}>Ingresá</Link>
      </p>
    </form>
  );
}
