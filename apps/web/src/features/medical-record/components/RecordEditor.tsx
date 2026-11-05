'use client';

import {
  BLOOD_TYPES,
  type MedicalRecord,
  type MedicalRecordResponse,
  type ProfileDto,
  type Section,
  type Visibility,
} from '@helpjuy/contracts';
import { useMemo, useState, type ReactNode } from 'react';
import { ApiError, apiFetch } from '@/shared/api/client';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';
import { Field } from '@/shared/ui/Field';
import { draftCompletion, fromRecord, validate, type Draft, type EditorErrors } from '../draft';
import styles from './record-editor.module.css';

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

function VisibilityToggle({ section, on, onChange }: { section: Section; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={`${SECTION_LABEL[section]}: se ve en mi QR`}
      className={`${styles.toggle} ${on ? styles.toggleOn : ''}`}
      onClick={() => onChange(!on)}
    >
      <span className={styles.knob} aria-hidden="true" />
      {on ? 'Se ve en el QR' : 'Privado'}
    </button>
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
    <section className={`${styles.block} ${tone ? styles[tone] : ''}`}>
      <header className={styles.blockHead}>
        <div>
          <h2>{title}</h2>
          {question && <p className={styles.question}>{question}</p>}
        </div>
        <div className={styles.toggles}>
          {sections.map((s) => (
            <VisibilityToggle key={s} section={s} on={visibility[s]} onChange={(v) => setVisible(s, v)} />
          ))}
        </div>
      </header>
      <div className={styles.blockBody}>{children}</div>
    </section>
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
    <label className={styles.select}>
      <span className="label">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as T)}>
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
    <label className={styles.none}>
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
    <div className={styles.editor}>
      <div className={styles.progress} aria-live="polite">
        <span>Ficha al {percent}%</span>
        <span className={styles.bar}>
          <span style={{ width: `${percent}%` }} />
        </span>
      </div>

      <Block
        title="Datos básicos"
        sections={['identity', 'vitals']}
        visibility={visibility}
        setVisible={setVisible}
      >
        <div className={styles.grid3}>
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
          <Field label="Idioma" value={draft.language} onChange={(e) => set('language', e.target.value)} placeholder="Español" />
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
            <div key={i} className={styles.row}>
              <Field
                label={`Alergia ${i + 1}`}
                value={a.substance}
                onChange={(e) => setRow('allergies', i, { substance: e.target.value })}
                placeholder="Penicilina"
                error={err(`allergies.${i}.substance`)}
              />
              <Field
                label={`Reacción ${i + 1}`}
                value={a.reaction}
                onChange={(e) => setRow('allergies', i, { reaction: e.target.value })}
                placeholder="Me hincho, me cuesta respirar"
              />
              <button type="button" className={styles.remove} onClick={() => removeRow('allergies', i)}>
                Quitar
              </button>
            </div>
          ))}
        <Button
          type="button"
          variant="secondary"
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
            <div key={i} className={styles.row}>
              <Field
                label={`Enfermedad ${i + 1}`}
                value={c.name}
                onChange={(e) => setRow('conditions', i, { name: e.target.value })}
                placeholder="Diabetes tipo 1"
                error={err(`conditions.${i}.name`)}
              />
              <Field label={`Detalle ${i + 1}`} value={c.note} onChange={(e) => setRow('conditions', i, { note: e.target.value })} />
              <button type="button" className={styles.remove} onClick={() => removeRow('conditions', i)}>
                Quitar
              </button>
            </div>
          ))}
        <Button
          type="button"
          variant="secondary"
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
            <div key={i} className={styles.row}>
              <Field
                label={`Remedio ${i + 1}`}
                value={m.name}
                onChange={(e) => setRow('medications', i, { name: e.target.value })}
                placeholder="Losartán"
                error={err(`medications.${i}.name`)}
              />
              <Field label={`Dosis ${i + 1}`} value={m.dose} onChange={(e) => setRow('medications', i, { dose: e.target.value })} placeholder="50 mg a la mañana" />
              <label className={styles.none}>
                <input
                  type="checkbox"
                  checked={m.anticoagulant}
                  onChange={(e) => setRow('medications', i, { anticoagulant: e.target.checked })}
                />
                Es anticoagulante (para la sangre)
              </label>
              <button type="button" className={styles.remove} onClick={() => removeRow('medications', i)}>
                Quitar
              </button>
            </div>
          ))}
        <Button
          type="button"
          variant="secondary"
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
          <div key={i} className={styles.row}>
            <Field
              label={`Nombre del contacto ${i + 1}`}
              value={c.name}
              onChange={(e) => setRow('contacts', i, { name: e.target.value })}
              error={err(`contacts.${i}.name`)}
            />
            <Field
              label={`Relación ${i + 1}`}
              value={c.relation}
              onChange={(e) => setRow('contacts', i, { relation: e.target.value })}
              placeholder="Madre, pareja, amigo…"
            />
            <Field
              label={`Teléfono del contacto ${i + 1}`}
              type="tel"
              inputMode="tel"
              value={c.phone}
              onChange={(e) => setRow('contacts', i, { phone: e.target.value })}
              placeholder="388 412-3456"
              error={err(`contacts.${i}.phone`)}
            />
            <button type="button" className={styles.remove} onClick={() => removeRow('contacts', i)}>
              Quitar
            </button>
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          disabled={draft.contacts.length >= 3}
          onClick={() => set('contacts', [...draft.contacts, { name: '', relation: '', phone: '' }])}
        >
          Agregar contacto
        </Button>
      </Block>

      <Block title="Para tener en cuenta" sections={['care']} visibility={visibility} setVisible={setVisible}>
        <Field
          label="¿Cómo comunicarse con vos?"
          value={draft.communication}
          onChange={(e) => set('communication', e.target.value)}
          placeholder="Soy sordo, leo los labios"
        />
        <div className={styles.grid2}>
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
          value={draft.directives}
          onChange={(e) => set('directives', e.target.value)}
          placeholder="Lo que querés que se respete"
        />
      </Block>

      <Block title="Cirugías e implantes" sections={['history']} visibility={visibility} setVisible={setVisible}>
        <div className={styles.grid2}>
          <Field label="Cirugías" value={draft.surgeries} onChange={(e) => set('surgeries', e.target.value)} />
          <Field
            label="Implantes o prótesis"
            value={draft.implants}
            onChange={(e) => set('implants', e.target.value)}
            placeholder="Marcapasos, placa de titanio…"
          />
        </div>
      </Block>

      <Block title="Obra social" sections={['insurance']} visibility={visibility} setVisible={setVisible}>
        <div className={styles.grid2}>
          <Field label="Obra social o prepaga" value={draft.insuranceName} onChange={(e) => set('insuranceName', e.target.value)} />
          <Field label="Número de afiliado" value={draft.insuranceNumber} onChange={(e) => set('insuranceNumber', e.target.value)} />
        </div>
      </Block>

      <Block title="Médico de cabecera" sections={['doctor']} visibility={visibility} setVisible={setVisible}>
        <div className={styles.grid2}>
          <Field label="Nombre del médico" value={draft.doctorName} onChange={(e) => set('doctorName', e.target.value)} />
          <Field
            label="Teléfono del médico"
            type="tel"
            value={draft.doctorPhone}
            onChange={(e) => set('doctorPhone', e.target.value)}
            error={err('doctor.phone')}
          />
        </div>
      </Block>

      <Block title="Notas" sections={['notes']} visibility={visibility} setVisible={setVisible}>
        <Field label="Algo más que quieras dejar anotado" value={draft.notes} onChange={(e) => set('notes', e.target.value)} />
      </Block>

      <div className={styles.saveBar}>
        {status === 'saved' && <Alert tone="success">Guardado. Tu QR ya muestra estos datos.</Alert>}
        {status === 'error' && (
          <Alert tone="error">{errors._form ?? 'Hay datos para revisar. Están marcados en rojo.'}</Alert>
        )}
        <div className={styles.saveActions}>
          <a className={styles.preview} href={`/e/${profile.publicToken}`} target="_blank" rel="noreferrer">
            Ver como el paramédico
          </a>
          <Button type="button" onClick={save} disabled={status === 'saving'}>
            {status === 'saving' ? 'Guardando…' : 'Guardar ficha'}
          </Button>
        </div>
      </div>
    </div>
  );
}
