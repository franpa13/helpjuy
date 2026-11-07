'use client';

import {
  RELATIONSHIP_LABELS,
  createProfileSchema,
    type ConsentAcceptance,
  type ConsentDto,
  type ProfileDto,
  type Relationship,
} from '@helpjuy/contracts';
import { Baby, Heart, UserRound, UsersRound, type LucideIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import { useState, type FormEvent } from 'react';
import { ApiError, apiFetch, postJson } from '@/shared/api/client';
import { type FieldErrors } from '@/shared/forms/errors';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field } from '@/shared/ui/Field';
import { ConsentStep } from './ConsentStep';
import { Checkbox } from '@/components/ui/checkbox';
import { checkCard } from '@/components/ui/choice';
import { FieldLegend, FieldSet } from '@/components/ui/field';
import { RadioGroup } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

type Draft = { firstName: string; lastName: string; relationship: Relationship; isMinor: boolean };

const nameSchema = createProfileSchema.pick({ firstName: true, lastName: true });

/** Para quién puede ser una ficha nueva una vez que ya tenés la tuya (la tuya es una sola). */
const OTHERS: Array<{ value: Exclude<Relationship, 'SELF'>; icon: LucideIcon; hint: string }> = [
  { value: 'CHILD', icon: Baby, hint: 'A tu cargo' },
  { value: 'PARENT', icon: UsersRound, hint: 'Ideal para la heladera' },
  { value: 'PARTNER', icon: Heart, hint: 'Tu compañero/a' },
  { value: 'OTHER', icon: UserRound, hint: 'Otro familiar o alguien que cuidás' },
];

/**
 * Alta de ficha. La primera es siempre la tuya: recién con esa podés agregar a tu familia.
 * (La API lo exige también, así no hay fichas sueltas sin un titular.)
 */
export function NewProfileForm({ consent: initialConsent, hasOwn }: { consent: ConsentDto; hasOwn: boolean }) {
  const router = useRouter();
  const [consent, setConsent] = useState(initialConsent);
  const [step, setStep] = useState<1 | 2>(1);
  const [draft, setDraft] = useState<Draft>({
    firstName: '',
    lastName: '',
    relationship: hasOwn ? 'CHILD' : 'SELF',
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
      const created = await postJson<ProfileDto>('/profiles', { ...draft, consent: acceptance });
      // Después de aceptar el consentimiento, directo a cargar la ficha.
      router.push(`/panel/perfiles/${created.id}`);
      router.refresh();
    } catch (err) {
      setSending(false);
      if (err instanceof ApiError && err.code === 'consent_outdated') {
        setConsent(await apiFetch<ConsentDto>('/consent/current'));
        setFormError('Actualizamos el texto del consentimiento. Leelo de nuevo antes de aceptar.');
        return;
      }
      if (err instanceof ApiError && err.code === 'self_profile_required') {
        setFormError('Primero creá tu propia ficha. Después podés agregar las de tu familia.');
        return;
      }
      if (err instanceof ApiError && err.code === 'self_profile_exists') {
        setFormError('Ya tenés tu ficha. Esta tiene que ser de otra persona.');
        return;
      }
      setFormError('No pudimos crear la ficha. Probá de nuevo en un rato.');
    }
  }

  if (step === 2) {
    return (
      <div className="stack">
        <p className="label">Paso 2 de 2 · Consentimiento</p>
        {formError && <Alert variant={formError.startsWith('Actualizamos') ? 'warning' : 'error'}>{formError}</Alert>}
        <ConsentStep key={consent.version} consent={consent} isMinor={draft.isMinor} sending={sending} onAccept={onAccept} />
        <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={sending}>
          Volver
        </Button>
      </div>
    );
  }

  return (
    <form className="stack" onSubmit={onNext} noValidate>
      {hasOwn ? (
        <p className="label">Paso 1 de 2 · ¿Para quién es esta ficha?</p>
      ) : (
        <div className="border-l-6 border-red bg-white px-4 py-3">
          <p className="label">Paso 1 de 2 · Tu ficha</p>
          <p className="mt-1">
            <strong>Empezá por la tuya:</strong> es la que vas a llevar encima. Después vas a poder agregar a tu familia.
          </p>
        </div>
      )}
      {formError && <Alert variant="error">{formError}</Alert>}
      {hasOwn && (
        <FieldSet className="gap-0">
          <FieldLegend>¿Para quién es?</FieldLegend>
          <RadioGroup
            name="relationship"
            aria-label="¿Para quién es?"
            value={draft.relationship}
            onValueChange={(r) => setDraft({ ...draft, relationship: r as Relationship })}
            className="grid-cols-2 sm:grid-cols-4"
          >
            {OTHERS.map(({ value, icon: Icon, hint }) => (
              <RadioGroupPrimitive.Item
                key={value}
                value={value}
                className={cn(
                  'grid cursor-pointer content-start justify-items-start gap-1.5 rounded-md border-2 border-line bg-white p-3 text-left transition-colors outline-none',
                  'hover:border-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue',
                  'data-[state=checked]:border-ink data-[state=checked]:bg-ink data-[state=checked]:text-white',
                )}
              >
                <Icon size={24} aria-hidden="true" />
                <span className="font-head text-xl/none font-extrabold uppercase">{RELATIONSHIP_LABELS[value]}</span>
                <span className="text-[13px]/tight opacity-75">{hint}</span>
              </RadioGroupPrimitive.Item>
            ))}
          </RadioGroup>
        </FieldSet>
      )}
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
      <label className={checkCard}>
        <Checkbox checked={draft.isMinor} onCheckedChange={(v) => setDraft({ ...draft, isMinor: v === true })} />
        <span>Es menor de 18 años</span>
      </label>
      <Button type="submit">Seguir</Button>
    </form>
  );
}
