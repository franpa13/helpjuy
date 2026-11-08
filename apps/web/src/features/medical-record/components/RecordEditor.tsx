'use client';

import {
  BLOOD_TYPES,
  type MedicalRecord,
  type MedicalRecordResponse,
  type ProfileDto,
  type Section,
  type Visibility,
} from '@helpjuy/contracts';
import { ChevronDown, Eye, Lock } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useUnsavedChangesGuard } from '@/shared/forms/useUnsavedChangesGuard';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import { motion } from 'motion/react';
import { useId, useMemo, useState, type ReactNode } from 'react';
import { ApiError, apiFetch } from '@/shared/api/client';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, TextareaField } from '@/shared/ui/Field';
import { ProfilePhoto } from '@/features/profiles/components/ProfilePhoto';
import { buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field as FieldRoot, FieldLabel } from '@/components/ui/field';
import { RadioGroup } from '@/components/ui/radio-group';
import { Select as SelectRoot, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { draftCompletion, fromRecord, validate, type Draft, type EditorErrors } from '../draft';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const row =
  'grid gap-2.5 border border-line bg-paper p-3 min-[720px]:grid-cols-[1fr_1fr_auto] min-[720px]:items-end min-[720px]:has-[>:nth-child(4)]:grid-cols-[1fr_1fr_1fr_auto]';
const previewLink = cn(buttonVariants({ variant: 'outline' }), 'font-sans text-[17px] font-bold normal-case tracking-normal');
/** "Quitar" una fila: discreto, para no competir con los datos. */
const removeBtnProps = { type: 'button' as const, variant: 'soft' as const, size: 'compact' as const, className: 'min-h-13 bg-transparent text-muted-foreground' };
/** Radix Select no acepta "" como valor: lo traducimos a uno interno. */
const EMPTY = '__vacio';
const grid2 = 'grid gap-3.5 sm:grid-cols-2';

const SECTION_LABEL: Record<Section, string> = {
  photo: 'Foto',
  identity: 'Edad, sexo e idioma',
  vitals: 'Sangre, peso y altura',
  allergies: 'Alergias',
  conditions: 'Enfermedades',
  medications: 'Medicación',
  contacts: 'Contactos de emergencia',
  care: 'Para tener en cuenta',
  history: 'Cirugías e implantes',
  insurance: 'Obra social',
  doctor: 'Médico de cabecera',
  notes: 'Notas',
};

/** "¿Quién ve esto?": dos opciones escritas, más claro que un interruptor de prendido/apagado. */
function VisibilityChoice({
  section,
  on,
  onChange,
  named = false,
}: {
  section: Section;
  on: boolean;
  onChange: (v: boolean) => void;
  /** Si el bloque tiene más de un selector, el título dice a qué sección corresponde. */
  named?: boolean;
}) {
  const name = `vis-${section}`;
  const options = [
    { value: true, label: 'Se ve en el QR', icon: Eye, cls: 'bg-green' },
    { value: false, label: 'Solo yo', icon: Lock, cls: 'bg-ink' },
  ];
  return (
    <div className="grid justify-items-start gap-1">
      <span className="font-head text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground" aria-hidden="true">
        {named ? `¿Quién ve: ${SECTION_LABEL[section].toLowerCase()}?` : '¿Quién ve esto?'}
      </span>
      <RadioGroup
        name={name}
        value={on ? 'public' : 'private'}
        onValueChange={(v) => onChange(v === 'public')}
        aria-label={`${SECTION_LABEL[section]}: ¿quién lo ve?`}
        className="inline-grid w-auto grid-cols-2 gap-1 rounded-full border-2 border-line bg-paper p-1"
      >
        {options.map(({ value, label, icon: Icon, cls }) => {
          const selected = on === value;
          return (
            <RadioGroupPrimitive.Item
              key={label}
              value={value ? 'public' : 'private'}
              className={cn(
                'relative grid min-h-10 cursor-pointer place-items-center whitespace-nowrap rounded-full px-3.5 text-sm font-bold text-muted-foreground transition-colors outline-none hover:text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue',
                selected && 'text-white hover:text-white',
              )}
            >
              {selected && (
                <motion.span
                  layoutId={`indicator-${section}`}
                  className={cn('absolute inset-0 rounded-full', cls)}
                  transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                />
              )}
              <span className="relative z-1 inline-flex items-center gap-1.5">
                <Icon size={16} aria-hidden="true" />
                {label}
              </span>
            </RadioGroupPrimitive.Item>
          );
        })}
      </RadioGroup>
    </div>
  );
}

function Block({
  title,
  question,
  sections,
  visibility,
  setVisible,
  tone,
  children,
}: {
  title: string;
  question?: string;
  sections: Section[];
  visibility: Visibility;
  setVisible: (s: Section, v: boolean) => void;
  tone?: 'red' | 'amber' | 'blue';
  children: ReactNode;
}) {
  return (
    <Card
      rule="none"
      className={cn(
        'border-t-3',
        tone === 'red' ? 'border-t-red' : tone === 'amber' ? 'border-t-amber' : tone === 'blue' ? 'border-t-blue' : 'border-t-ink',
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2.5 px-4 pt-3.5">
        <div>
          <h2 className="text-[26px]">{title}</h2>
          {question && <p className="mt-1 max-w-[34em] text-base text-muted-foreground">{question}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {sections.map((s) => (
            <VisibilityChoice
              key={s}
              section={s}
              named={sections.length > 1}
              on={visibility[s]}
              onChange={(v) => setVisible(s, v)}
            />
          ))}
        </div>
      </header>
      <div className="grid gap-3.5 px-4 pt-3.5 pb-4">{children}</div>
    </Card>
  );
}

function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<[T, string]>;
  onChange: (v: T) => void;
}) {
  const id = useId();
  return (
    <FieldRoot>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <SelectRoot value={value === '' ? EMPTY : value} onValueChange={(v) => onChange((v === EMPTY ? '' : v) as T)}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([v, l]) => (
            <SelectItem key={v || EMPTY} value={v === '' ? EMPTY : v}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectRoot>
    </FieldRoot>
  );
}

function NoneCheck({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 font-bold">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} />
      {label}
    </label>
  );
}

function VitalHeading() {
  return (
    <div className="border-l-6 border-red bg-white px-4 py-3">
      <p className="label">Lo vital · 2 minutos</p>
      <p className="mt-1">
        <strong>Con esto ya sirve en una emergencia.</strong> Con un contacto cargado, tu QR queda activo.
      </p>
    </div>
  );
}

/** Lo que suma pero no es urgente: plegado al principio para no espantar a nadie con 12 secciones. */
function OptionalSections({ open, onOpenChange, children }: { open: boolean; onOpenChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange} className="grid gap-4">
      <CollapsibleTrigger className="group flex w-full cursor-pointer items-center justify-between gap-3 border-2 border-dashed border-line bg-white p-4 text-left hover:border-ink">
        <span>
          <strong className="block font-head text-xl font-extrabold uppercase">Completá cuando puedas</strong>
          <span className="mt-0.5 block text-[15px] text-muted-foreground">
            Foto, obra social, médico, cirugías, transfusiones y notas.
          </span>
        </span>
        <ChevronDown size={24} aria-hidden="true" className="shrink-0 transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="grid gap-4">{children}</CollapsibleContent>
    </Collapsible>
  );
}

/** Errores que caen en las secciones plegadas (para abrirlas y que se vean). */
const OPTIONAL_ERROR = /^(communication|directives|surgeries|implants|insurance\.|doctor\.|notes)/;

function hasOptionalData(d: Draft, photo: boolean) {
  return (
    photo ||
    d.transfusion !== 'UNKNOWN' ||
    d.organDonor !== 'UNKNOWN' ||
    [d.communication, d.directives, d.surgeries, d.implants, d.insuranceName, d.insuranceNumber, d.doctorName, d.doctorPhone, d.notes].some(
      (v) => v.trim() !== '',
    )
  );
}

const snapshot = (d: Draft, v: Visibility) => JSON.stringify([d, v]);

type Props = {
  profile: ProfileDto;
  initial: { data: MedicalRecord; visibility: Visibility };
  /** La cuenta entró con Google y tiene foto (se ofrece copiarla a la ficha propia). */
  googlePhoto?: boolean;
};

export function RecordEditor({ profile, initial, googlePhoto = false }: Props) {
  const [draft, setDraft] = useState<Draft>(() => fromRecord(initial.data));
  const [visibility, setVisibility] = useState<Visibility>(initial.visibility);
  const [errors, setErrors] = useState<EditorErrors>({});
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [optionalOpen, setOptionalOpen] = useState(() => hasOptionalData(fromRecord(initial.data), !!profile.photoVersion));
  const [savedSnapshot, setSavedSnapshot] = useState(() => snapshot(fromRecord(initial.data), initial.visibility));
  const dirty = snapshot(draft, visibility) !== savedSnapshot;
  useUnsavedChangesGuard(dirty);
  const percent = useMemo(() => draftCompletion(draft), [draft]);
  const hasContact = draft.contacts.some((c) => c.phone.trim() !== '');
  const visibleSections = (Object.keys(SECTION_LABEL) as Section[]).filter((s) => visibility[s]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setStatus('idle');
  };
  const setVisible = (s: Section, v: boolean) => {
    setVisibility((vis) => ({ ...vis, [s]: v }));
    setStatus('idle');
  };
  const setRow = <K extends 'allergies' | 'conditions' | 'medications' | 'contacts'>(
    key: K,
    i: number,
    patch: Partial<Draft[K][number]>,
  ) => set(key, draft[key].map((row, j) => (j === i ? { ...row, ...patch } : row)) as Draft[K]);
  const removeRow = (key: 'allergies' | 'conditions' | 'medications' | 'contacts', i: number) =>
    set(key, draft[key].filter((_, j) => j !== i) as never);

  async function save() {
    const result = validate(draft, visibility);
    if (!result.ok) {
      setErrors(result.errors);
      if (Object.keys(result.errors).some((k) => OPTIONAL_ERROR.test(k))) setOptionalOpen(true);
      setStatus('error');
      return;
    }
    setErrors({});
    setStatus('saving');
    const sent = snapshot(draft, visibility);
    try {
      await apiFetch<MedicalRecordResponse>(`/profiles/${profile.id}/record`, {
        method: 'PUT',
        body: JSON.stringify(result.body),
      });
      setSavedSnapshot(sent);
      setStatus('saved');
    } catch (err) {
      setStatus('error');
      setErrors({ _form: err instanceof ApiError && err.status === 401 ? 'Tu sesión venció. Ingresá de nuevo.' : 'No pudimos guardar. Probá de nuevo.' });
    }
  }

  const err = (k: string) => errors[k];

  return (
    <div className="grid gap-4 [grid-template-areas:'progress'_'blocks'_'summary'_'links'_'save'] wide:grid-cols-[minmax(0,1.7fr)_minmax(300px,1fr)] wide:items-start wide:gap-7 wide:[grid-template-areas:'blocks_side']">
      <div className="grid min-w-0 gap-4 [grid-area:blocks]">
      <VitalHeading />
      <Block
        title="Contactos de emergencia"
        question="¿A quién llamamos? Con al menos uno, tu QR queda activo."
        sections={['contacts']}
        visibility={visibility}
        setVisible={setVisible}
      >
        {draft.contacts.map((c, i) => (
          <div key={i} className={row}>
            <Field
              label={`Nombre del contacto ${i + 1}`}
                maxLength={60}
              value={c.name}
              onChange={(e) => setRow('contacts', i, { name: e.target.value })}
              error={err(`contacts.${i}.name`)}
            />
            <Field
              label={`Relación ${i + 1}`}
                maxLength={40}
                error={err(`contacts.${i}.relation`)}
              value={c.relation}
              onChange={(e) => setRow('contacts', i, { relation: e.target.value })}
              placeholder="Madre, pareja, amigo…"
            />
            <Field
              label={`Teléfono del contacto ${i + 1}`}
                maxLength={20}
              type="tel"
              inputMode="tel"
              value={c.phone}
              onChange={(e) => setRow('contacts', i, { phone: e.target.value })}
              placeholder="388 412-3456"
              error={err(`contacts.${i}.phone`)}
            />
            <Button {...removeBtnProps} onClick={() => removeRow('contacts', i)}>
                Quitar
              </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          disabled={draft.contacts.length >= 3}
          onClick={() => set('contacts', [...draft.contacts, { name: '', relation: '', phone: '' }])}
        >
          Agregar contacto
        </Button>
      </Block>

      <Block
        title="Alergias"
        question="¿Sos alérgico a algo? Remedios, comidas, látex, picaduras…"
        sections={['allergies']}
        visibility={visibility}
        setVisible={setVisible}
        tone="red"
      >
        <NoneCheck label="No tengo alergias" checked={draft.allergiesNone} onChange={(v) => set('allergiesNone', v)} />
        {!draft.allergiesNone &&
          draft.allergies.map((a, i) => (
            <div key={i} className={row}>
              <Field
                label={`Alergia ${i + 1}`}
                maxLength={80}
                value={a.substance}
                onChange={(e) => setRow('allergies', i, { substance: e.target.value })}
                placeholder="Penicilina"
                error={err(`allergies.${i}.substance`)}
              />
              <Field
                label={`Reacción ${i + 1}`}
                maxLength={80}
                error={err(`allergies.${i}.reaction`)}
                value={a.reaction}
                onChange={(e) => setRow('allergies', i, { reaction: e.target.value })}
                placeholder="Me hincho, me cuesta respirar"
              />
              <Button {...removeBtnProps} onClick={() => removeRow('allergies', i)}>
                Quitar
              </Button>
            </div>
          ))}
        <Button
          type="button"
          variant="outline"
          disabled={draft.allergiesNone || draft.allergies.length >= 20}
          onClick={() => set('allergies', [...draft.allergies, { substance: '', reaction: '' }])}
        >
          Agregar alergia
        </Button>
      </Block>

      <Block
        title="Enfermedades"
        question="¿Tenés alguna enfermedad que un médico debería saber? Diabetes, epilepsia, del corazón, asma…"
        sections={['conditions']}
        visibility={visibility}
        setVisible={setVisible}
        tone="amber"
      >
        <NoneCheck label="No tengo enfermedades" checked={draft.conditionsNone} onChange={(v) => set('conditionsNone', v)} />
        {!draft.conditionsNone &&
          draft.conditions.map((c, i) => (
            <div key={i} className={row}>
              <Field
                label={`Enfermedad ${i + 1}`}
                maxLength={80}
                value={c.name}
                onChange={(e) => setRow('conditions', i, { name: e.target.value })}
                placeholder="Diabetes tipo 1"
                error={err(`conditions.${i}.name`)}
              />
              <Field label={`Detalle ${i + 1}`}
                maxLength={120}
                error={err(`conditions.${i}.note`)} value={c.note} onChange={(e) => setRow('conditions', i, { note: e.target.value })} />
              <Button {...removeBtnProps} onClick={() => removeRow('conditions', i)}>
                Quitar
              </Button>
            </div>
          ))}
        <Button
          type="button"
          variant="outline"
          disabled={draft.conditionsNone || draft.conditions.length >= 20}
          onClick={() => set('conditions', [...draft.conditions, { name: '', note: '' }])}
        >
          Agregar enfermedad
        </Button>
      </Block>

      <Block
        title="Medicación"
        question="¿Tomás algún remedio todos los días?"
        sections={['medications']}
        visibility={visibility}
        setVisible={setVisible}
        tone="blue"
      >
        <NoneCheck label="No tomo remedios" checked={draft.medicationsNone} onChange={(v) => set('medicationsNone', v)} />
        {!draft.medicationsNone &&
          draft.medications.map((m, i) => (
            <div key={i} className={row}>
              <Field
                label={`Remedio ${i + 1}`}
                maxLength={80}
                value={m.name}
                onChange={(e) => setRow('medications', i, { name: e.target.value })}
                placeholder="Losartán"
                error={err(`medications.${i}.name`)}
              />
              <Field label={`Dosis ${i + 1}`}
                maxLength={60}
                error={err(`medications.${i}.dose`)} value={m.dose} onChange={(e) => setRow('medications', i, { dose: e.target.value })} placeholder="50 mg a la mañana" />
              <label className="flex cursor-pointer items-center gap-2.5 font-bold">
                <Checkbox
                  checked={m.anticoagulant}
                  onCheckedChange={(v) => setRow('medications', i, { anticoagulant: v === true })}
                />
                Es anticoagulante (para la sangre)
              </label>
              <Button {...removeBtnProps} onClick={() => removeRow('medications', i)}>
                Quitar
              </Button>
            </div>
          ))}
        <Button
          type="button"
          variant="outline"
          disabled={draft.medicationsNone || draft.medications.length >= 30}
          onClick={() => set('medications', [...draft.medications, { name: '', dose: '', anticoagulant: false }])}
        >
          Agregar remedio
        </Button>
      </Block>

      <Block
        title="Datos básicos"
        sections={['identity', 'vitals']}
        visibility={visibility}
        setVisible={setVisible}
      >
        <div className="grid gap-3.5 sm:grid-cols-3">
          <Select
            label="Sexo"
            value={draft.sex}
            onChange={(v) => set('sex', v)}
            options={[
              ['', 'Prefiero no decir'],
              ['F', 'Femenino'],
              ['M', 'Masculino'],
              ['X', 'Otro'],
            ]}
          />
          <Field
            label="Fecha de nacimiento"
            type="date"
            value={draft.birthDate}
            onChange={(e) => set('birthDate', e.target.value)}
            hint="En la ficha solo se muestra la edad"
            error={err('birthDate')}
          />
          <Field label="Idioma"
                maxLength={40}
                error={err('language')} value={draft.language} onChange={(e) => set('language', e.target.value)} placeholder="Español" />
          <Select
            label="Grupo sanguíneo"
            value={draft.bloodType}
            onChange={(v) => set('bloodType', v)}
            options={[['', 'No sé'] as ['', string], ...BLOOD_TYPES.map((b) => [b, b] as [typeof b, string])]}
          />
          <Field
            label="Peso (kg)"
            inputMode="decimal"
            value={draft.weightKg}
            onChange={(e) => set('weightKg', e.target.value)}
            error={err('weightKg')}
          />
          <Field
            label="Altura (cm)"
            inputMode="numeric"
            value={draft.heightCm}
            onChange={(e) => set('heightCm', e.target.value)}
            error={err('heightCm')}
          />
        </div>
      </Block>

      <OptionalSections open={optionalOpen} onOpenChange={setOptionalOpen}>
        <Block
          title="Foto"
          question="Ayuda a confirmar que la ficha es de la persona que están atendiendo."
          sections={['photo']}
          visibility={visibility}
          setVisible={setVisible}
        >
          <ProfilePhoto
            profileId={profile.id}
            name={`${profile.firstName} ${profile.lastName}`}
            relationship={profile.relationship}
            isMinor={profile.isMinor}
            photoVersion={profile.photoVersion}
            googlePhoto={googlePhoto}
            visible={visibility.photo}
          />
        </Block>

        <Block title="Para tener en cuenta" sections={['care']} visibility={visibility} setVisible={setVisible}>
          <Field
            label="¿Cómo comunicarse con vos?"
                  maxLength={200}
                  error={err('communication')}
            value={draft.communication}
            onChange={(e) => set('communication', e.target.value)}
            placeholder="Soy sordo, leo los labios"
          />
          <div className={grid2}>
            <Select
              label="Transfusiones de sangre"
              value={draft.transfusion}
              onChange={(v) => set('transfusion', v)}
              options={[
                ['UNKNOWN', 'Prefiero no decir'],
                ['ACCEPTS', 'Acepto'],
                ['REFUSES', 'No acepto'],
              ]}
            />
            <Select
              label="Donante de órganos"
              value={draft.organDonor}
              onChange={(v) => set('organDonor', v)}
              options={[
                ['UNKNOWN', 'Prefiero no decir'],
                ['YES', 'Sí, soy donante'],
                ['NO', 'No'],
              ]}
            />
          </div>
          <TextareaField
            label="Voluntades anticipadas"
                  maxLength={300}
                  error={err('directives')}
            value={draft.directives}
            onChange={(e) => set('directives', e.target.value)}
            placeholder="Lo que querés que se respete"
          />
        </Block>

        <Block title="Cirugías e implantes" sections={['history']} visibility={visibility} setVisible={setVisible}>
          <div className={grid2}>
            <TextareaField label="Cirugías"
                  maxLength={300}
                  error={err('surgeries')} value={draft.surgeries} onChange={(e) => set('surgeries', e.target.value)} />
            <Field
              label="Implantes o prótesis"
                  maxLength={200}
                  error={err('implants')}
              value={draft.implants}
              onChange={(e) => set('implants', e.target.value)}
              placeholder="Marcapasos, placa de titanio…"
            />
          </div>
        </Block>

        <Block title="Obra social" sections={['insurance']} visibility={visibility} setVisible={setVisible}>
          <div className={grid2}>
            <Field label="Obra social o prepaga"
                  maxLength={60}
                  error={err('insurance.name')} value={draft.insuranceName} onChange={(e) => set('insuranceName', e.target.value)} />
            <Field label="Número de afiliado"
                  maxLength={40}
                  error={err('insurance.number')} value={draft.insuranceNumber} onChange={(e) => set('insuranceNumber', e.target.value)} />
          </div>
        </Block>

        <Block title="Médico de cabecera" sections={['doctor']} visibility={visibility} setVisible={setVisible}>
          <div className={grid2}>
            <Field label="Nombre del médico"
                  maxLength={60}
                  error={err('doctor.name')} value={draft.doctorName} onChange={(e) => set('doctorName', e.target.value)} />
            <Field
              label="Teléfono del médico"
                  maxLength={20}
              type="tel"
              value={draft.doctorPhone}
              onChange={(e) => set('doctorPhone', e.target.value)}
              error={err('doctor.phone')}
            />
          </div>
        </Block>

        <Block title="Notas" sections={['notes']} visibility={visibility} setVisible={setVisible}>
          <TextareaField label="Algo más que quieras dejar anotado"
                  maxLength={500}
                  error={err('notes')} value={draft.notes} onChange={(e) => set('notes', e.target.value)} />
        </Block>
      </OptionalSections>
      </div>

      {/* Columna lateral en escritorio; en celular sus piezas se reparten (progreso arriba, guardar fijo abajo). */}
      <div className="contents wide:sticky wide:top-6 wide:grid wide:gap-4 wide:border wide:border-t-4 wide:border-line wide:border-t-night wide:bg-white wide:p-[18px] wide:[grid-area:side]">
      <div className="grid gap-1.5 font-head text-xl font-extrabold uppercase max-wide:[grid-area:progress]" aria-live="polite">
        <span>Ficha al {percent}%</span>
        <Progress value={percent} aria-label="Ficha completa" />
      </div>

      <div className="max-wide:[grid-area:summary]" aria-live="polite">
        {visibleSections.length > 0 ? (
          <p className="border-l-6 border-green bg-white px-3.5 py-3 text-base">
            <strong>Quien escanee tu QR va a ver:</strong> {visibleSections.map((s) => SECTION_LABEL[s]).join(', ')}.
          </p>
        ) : (
          <Alert variant="warning">
            Quien escanee tu QR solo va a ver tu nombre. Activá al menos alergias, medicación y contactos.
          </Alert>
        )}
      </div>

      <div className="grid gap-2.5 max-wide:[grid-area:links]">
        <a className={previewLink} href={`/e/${profile.publicToken}`} target="_blank" rel="noreferrer">
          Ver como el paramédico
        </a>
        <a className={previewLink} href={`/panel/perfiles/${profile.id}/imprimir`}>
          Imprimir mi QR
        </a>
      </div>

      <div className="sticky bottom-0 grid gap-2.5 bg-linear-to-t from-paper from-75% to-transparent pt-3 pb-4 max-panel:bottom-[calc(70px+env(safe-area-inset-bottom))] max-wide:[grid-area:save] wide:static wide:bg-none wide:p-0">
        {status === 'saved' && (
          <Alert variant="success">
            Guardado. Tu QR ya muestra estos datos.
            {hasContact && (
              <>
                {' '}
                <a href={`/panel/perfiles/${profile.id}/imprimir`} className="font-bold">
                  Siguiente paso: imprimilo o guardalo en el celular →
                </a>
              </>
            )}
          </Alert>
        )}
        {dirty && status !== 'saving' && (
          <p className="text-center text-sm font-bold text-amber" role="status">
            Tenés cambios sin guardar
          </p>
        )}
        {status === 'error' && (
          <Alert variant="error">{errors._form ?? 'Hay datos para revisar. Están marcados en rojo.'}</Alert>
        )}
        <Button type="button" onClick={save} disabled={status === 'saving'}>
          {status === 'saving' && <Spinner className="size-5" />}
          {status === 'saving' ? 'Guardando…' : 'Guardar ficha'}
        </Button>
      </div>
      </div>
    </div>
  );
}
