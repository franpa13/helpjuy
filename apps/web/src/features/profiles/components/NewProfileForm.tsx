'use client';

import {
  RELATIONSHIP_LABELS,
  createProfileSchema,
  relationshipSchema,
  type ConsentAcceptance,
  type ConsentDto,
  type ProfileDto,
  type Relationship,
} from '@helpjuy/contracts';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ApiError, apiFetch, postJson } from '@/shared/api/client';
import { type FieldErrors } from '@/shared/forms/errors';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';
import { Field } from '@/shared/ui/Field';
import { ConsentStep } from './ConsentStep';
import styles from './profiles.module.css';

type Draft = { firstName: string; lastName: string; relationship: Relationship; isMinor: boolean };

const nameSchema = createProfileSchema.pick({ firstName: true, lastName: true });

export function NewProfileForm({ consent: initialConsent, isFirst }: { consent: ConsentDto; isFirst: boolean }) {
  const router = useRouter();
  const [consent, setConsent] = useState(initialConsent);
  const [step, setStep] = useState<1 | 2>(1);
  const [draft, setDraft] = useState<Draft>({
    firstName: '',
    lastName: '',
    relationship: isFirst ? 'SELF' : 'CHILD',
    isMinor: false,
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  function onNext(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = nameSchema.safeParse(draft);
    if (!parsed.success) {
      const out: FieldErrors = {};
      for (const issue of parsed.error.issues) out[String(issue.path[0])] ??= 'Completá este dato';
      setErrors(out);
      return;
    }
    setErrors({});
    setStep(2);
  }

  async function onAccept(acceptance: ConsentAcceptance) {
    setFormError(null);
    setSending(true);
    try {
      await postJson<ProfileDto>('/profiles', { ...draft, consent: acceptance });
      router.push('/panel');
      router.refresh();
    } catch (err) {
      setSending(false);
      if (err instanceof ApiError && err.code === 'consent_outdated') {
        setConsent(await apiFetch<ConsentDto>('/consent/current'));
        setFormError('Actualizamos el texto del consentimiento. Leelo de nuevo antes de aceptar.');
        return;
      }
      setFormError('No pudimos crear la ficha. Probá de nuevo en un rato.');
    }
  }

  if (step === 2) {
    return (
      <div className="stack">
        <p className="label">Paso 2 de 2 · Consentimiento</p>
        {formError && <Alert tone={formError.startsWith('Actualizamos') ? 'warning' : 'error'}>{formError}</Alert>}
        <ConsentStep key={consent.version} consent={consent} isMinor={draft.isMinor} sending={sending} onAccept={onAccept} />
        <Button type="button" variant="secondary" onClick={() => setStep(1)} disabled={sending}>
          Volver
        </Button>
      </div>
    );
  }

  return (
    <form className="stack" onSubmit={onNext} noValidate>
      <p className="label">Paso 1 de 2 · ¿Para quién es esta ficha?</p>
      <Field
        label="Nombre"
        name="firstName"
        autoComplete="given-name"
        value={draft.firstName}
        onChange={(e) => setDraft({ ...draft, firstName: e.target.value })}
        error={errors.firstName}
      />
      <Field
        label="Apellido"
        name="lastName"
        autoComplete="family-name"
        value={draft.lastName}
        onChange={(e) => setDraft({ ...draft, lastName: e.target.value })}
        error={errors.lastName}
      />
      <fieldset className={styles.radios}>
        <legend className="label" style={{ marginBottom: 6 }}>
          ¿Quién es?
        </legend>
        {relationshipSchema.options.map((r) => (
          <label key={r} className={styles.radio}>
            <input
              type="radio"
              name="relationship"
              value={r}
              checked={draft.relationship === r}
              onChange={() => setDraft({ ...draft, relationship: r })}
            />
            {RELATIONSHIP_LABELS[r]}
          </label>
        ))}
      </fieldset>
      <label className={styles.check}>
        <input
          type="checkbox"
          checked={draft.isMinor}
          onChange={(e) => setDraft({ ...draft, isMinor: e.target.checked })}
        />
        <span>Es menor de 18 años</span>
      </label>
      <Button type="submit">Seguir</Button>
    </form>
  );
}
