'use client';

import {
  BLOOD_TYPES,
  type MedicalRecord,
  type MedicalRecordResponse,
  type ProfileDto,
  type Section,
  type Visibility,
} from '@helpjuy/contracts';
import { Eye, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState, type ReactNode } from 'react';
import { ApiError, apiFetch } from '@/shared/api/client';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field } from '@/shared/ui/Field';
import { draftCompletion, fromRecord, validate, type Draft, type EditorErrors } from '../draft';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const removeBtn =
  'min-h-13 cursor-pointer rounded-md border-2 border-line bg-transparent px-3.5 font-bold text-muted-foreground';
const row =
  'grid gap-2.5 border border-line bg-paper p-3 min-[720px]:grid-cols-[1fr_1fr_auto] min-[720px]:items-end min-[720px]:has-[>:nth-child(4)]:grid-cols-[1fr_1fr_1fr_auto]';
const previewLink = 'inline-flex min-h-13 items-center justify-center rounded-md border-2 border-ink font-bold no-underline';
const grid2 = 'grid gap-3.5 sm:grid-cols-2';

const SECTION_LABEL: Record<Section, string> = {
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
      <div role="radiogroup" aria-label={`${SECTION_LABEL[section]}: ¿quién lo ve?`} className="inline-grid grid-cols-2 gap-1 rounded-full border-2 border-line bg-paper p-1">
        {options.map(({ value, label, icon: Icon, cls }) => {
          const selected = on === value;
          return (
            <label
              key={label}
              className={cn(
                'relative grid min-h-10 cursor-pointer place-items-center whitespace-nowrap rounded-full px-3.5 text-sm font-bold text-muted-foreground transition-colors hover:text-ink has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-blue',
                selected && 'text-white hover:text-white',
              )}
            >
              <input
                type="radio"
                name={name}
                className="absolute inset-0 z-2 m-0 size-full cursor-pointer opacity-0"
                checked={selected}
                onChange={() => onChange(value)}
              />
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
            </label>
          );
        })}
      </div>
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
  return (
    <label className="grid gap-1.5">
      <span className="label">{label}</span>
      <select
        className="min-h-13 rounded-md border-2 border-ink bg-white px-3 py-2.5 text-ink"
       value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

function NoneCheck({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 font-bold [&_input]:size-[22px] [&_input]:accent-ink">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

type Props = { profile: ProfileDto; initial: { data: MedicalRecord; visibility: Visibility } };

export function RecordEditor({ profile, initial }: Props) {
  const [draft, setDraft] = useState<Draft>(() => fromRecord(initial.data));
  const [visibility, setVisibility] = useState<Visibility>(initial.visibility);
  const [errors, setErrors] = useState<EditorErrors>({});
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const percent = useMemo(() => draftCompletion(draft), [draft]);
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
      setStatus('error');
      return;
    }
    setErrors({});
    setStatus('saving');
    try {
      await apiFetch<MedicalRecordResponse>(`/profiles/${profile.id}/record`, {
        method: 'PUT',
        body: JSON.stringify(result.body),
      });
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
              <button type="button" className={removeBtn} onClick={() => removeRow('allergies', i)}>
                Quitar
              </button>
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
              <button type="button" className={removeBtn} onClick={() => removeRow('conditions', i)}>
                Quitar
              </button>
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
              <label className="flex cursor-pointer items-center gap-2.5 font-bold [&_input]:size-[22px] [&_input]:accent-ink">
                <input
                  type="checkbox"
                  checked={m.anticoagulant}
                  onChange={(e) => setRow('medications', i, { anticoagulant: e.target.checked })}
                />
                Es anticoagulante (para la sangre)
              </label>
              <button type="button" className={removeBtn} onClick={() => removeRow('medications', i)}>
                Quitar
              </button>
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
            <button type="button" className={removeBtn} onClick={() => removeRow('contacts', i)}>
              Quitar
            </button>
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
        <Field
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
          <Field label="Cirugías"
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
        <Field label="Algo más que quieras dejar anotado"
                maxLength={500}
                error={err('notes')} value={draft.notes} onChange={(e) => set('notes', e.target.value)} />
      </Block>
      </div>

      {/* Columna lateral en escritorio; en celular sus piezas se reparten (progreso arriba, guardar fijo abajo). */}
      <div className="contents wide:sticky wide:top-6 wide:grid wide:gap-4 wide:border wide:border-t-4 wide:border-line wide:border-t-night wide:bg-white wide:p-[18px] wide:[grid-area:side]">
      <div className="grid gap-1.5 font-head text-xl font-extrabold uppercase max-wide:[grid-area:progress]" aria-live="polite">
        <span>Ficha al {percent}%</span>
        <Progress value={percent} aria-hidden="true" className="[&>span]:transition-[width] [&>span]:duration-400" />
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
        {status === 'saved' && <Alert variant="success">Guardado. Tu QR ya muestra estos datos.</Alert>}
        {status === 'error' && (
          <Alert variant="error">{errors._form ?? 'Hay datos para revisar. Están marcados en rojo.'}</Alert>
        )}
        <Button type="button" onClick={save} disabled={status === 'saving'}>
          {status === 'saving' ? 'Guardando…' : 'Guardar ficha'}
        </Button>
      </div>
      </div>
    </div>
  );
}
