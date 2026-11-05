import {
  completion,
  medicalRecordSchema,
  saveMedicalRecordSchema,
  type BloodType,
  type MedicalRecord,
  type Visibility,
} from '@helpjuy/contracts';

/** Estado del formulario: todo como texto, tal cual lo escribe la persona. */
export type Draft = {
  sex: '' | 'F' | 'M' | 'X';
  birthDate: string;
  language: string;
  weightKg: string;
  heightCm: string;
  bloodType: '' | BloodType;
  allergies: { substance: string; reaction: string }[];
  allergiesNone: boolean;
  conditions: { name: string; note: string }[];
  conditionsNone: boolean;
  medications: { name: string; dose: string; anticoagulant: boolean }[];
  medicationsNone: boolean;
  contacts: { name: string; relation: string; phone: string }[];
  communication: string;
  transfusion: 'ACCEPTS' | 'REFUSES' | 'UNKNOWN';
  organDonor: 'YES' | 'NO' | 'UNKNOWN';
  directives: string;
  surgeries: string;
  implants: string;
  insuranceName: string;
  insuranceNumber: string;
  doctorName: string;
  doctorPhone: string;
  notes: string;
};

export function fromRecord(r: MedicalRecord): Draft {
  return {
    sex: r.sex ?? '',
    birthDate: r.birthDate ?? '',
    language: r.language ?? '',
    weightKg: r.weightKg?.toString() ?? '',
    heightCm: r.heightCm?.toString() ?? '',
    bloodType: r.bloodType ?? '',
    allergies: r.allergies.map((a) => ({ substance: a.substance, reaction: a.reaction ?? '' })),
    allergiesNone: r.allergiesNone,
    conditions: r.conditions.map((c) => ({ name: c.name, note: c.note ?? '' })),
    conditionsNone: r.conditionsNone,
    medications: r.medications.map((m) => ({ name: m.name, dose: m.dose ?? '', anticoagulant: m.anticoagulant })),
    medicationsNone: r.medicationsNone,
    contacts: r.contacts.map((c) => ({ name: c.name, relation: c.relation ?? '', phone: c.phone })),
    communication: r.communication ?? '',
    transfusion: r.transfusion,
    organDonor: r.organDonor,
    directives: r.directives ?? '',
    surgeries: r.surgeries ?? '',
    implants: r.implants ?? '',
    insuranceName: r.insurance?.name ?? '',
    insuranceNumber: r.insurance?.number ?? '',
    doctorName: r.doctor?.name ?? '',
    doctorPhone: r.doctor?.phone ?? '',
    notes: r.notes ?? '',
  };
}

const opt = (s: string) => (s.trim() === '' ? undefined : s.trim());
const num = (s: string) => (s.trim() === '' ? undefined : Number(s.replace(',', '.')));

/** Arma el payload: vacíos fuera, filas sin dato principal fuera, "no tengo" vacía la lista. */
export function toPayload(d: Draft) {
  return {
    sex: d.sex || undefined,
    birthDate: opt(d.birthDate),
    language: opt(d.language),
    weightKg: num(d.weightKg),
    heightCm: num(d.heightCm),
    bloodType: d.bloodType || undefined,
    allergies: d.allergiesNone
      ? []
      : d.allergies.filter((a) => a.substance.trim()).map((a) => ({ substance: a.substance.trim(), reaction: opt(a.reaction) })),
    allergiesNone: d.allergiesNone,
    conditions: d.conditionsNone
      ? []
      : d.conditions.filter((c) => c.name.trim()).map((c) => ({ name: c.name.trim(), note: opt(c.note) })),
    conditionsNone: d.conditionsNone,
    medications: d.medicationsNone
      ? []
      : d.medications
          .filter((m) => m.name.trim())
          .map((m) => ({ name: m.name.trim(), dose: opt(m.dose), anticoagulant: m.anticoagulant })),
    medicationsNone: d.medicationsNone,
    contacts: d.contacts
      .filter((c) => c.name.trim() || c.phone.trim())
      .map((c) => ({ name: c.name.trim(), relation: opt(c.relation), phone: c.phone.trim() })),
    communication: opt(d.communication),
    transfusion: d.transfusion,
    organDonor: d.organDonor,
    directives: opt(d.directives),
    surgeries: opt(d.surgeries),
    implants: opt(d.implants),
    insurance: opt(d.insuranceName) ? { name: d.insuranceName.trim(), number: opt(d.insuranceNumber) } : undefined,
    doctor: opt(d.doctorName) ? { name: d.doctorName.trim(), phone: opt(d.doctorPhone) } : undefined,
    notes: opt(d.notes),
  };
}

/** JSON.stringify descarta los undefined: el payload viaja limpio. */
export const clean = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

export function draftCompletion(d: Draft): number {
  const parsed = medicalRecordSchema.safeParse(clean(toPayload(d)));
  return parsed.success ? completion(parsed.data) : completion(medicalRecordSchema.parse({}));
}

const MESSAGES: Array<[RegExp, string]> = [
  [/phone$/, 'Revisá el teléfono'],
  [/^birthDate$/, 'Revisá la fecha de nacimiento'],
  [/^weightKg$/, 'Revisá el peso (en kilos)'],
  [/^heightCm$/, 'Revisá la altura (en centímetros)'],
  [/name$|substance$/, 'Completá este dato'],
];

export type EditorErrors = Record<string, string>;

export function validate(d: Draft, visibility: Visibility) {
  const result = saveMedicalRecordSchema.safeParse({ data: clean(toPayload(d)), visibility });
  if (result.success) return { ok: true as const, body: result.data };
  const errors: EditorErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path.slice(1).join('.');
    if (errors[key]) continue;
    errors[key] = MESSAGES.find(([re]) => re.test(key))?.[1] ?? 'Revisá este dato';
  }
  return { ok: false as const, errors };
}
