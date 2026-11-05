import { z } from 'zod';

export const TIME_ZONE = 'America/Argentina/Jujuy';

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
export type BloodType = (typeof BLOOD_TYPES)[number];

export const SECTIONS = [
  'identity',
  'vitals',
  'allergies',
  'conditions',
  'medications',
  'contacts',
  'care',
  'history',
  'insurance',
  'doctor',
  'notes',
] as const;
export type Section = (typeof SECTIONS)[number];

/** Lo clínico se ve en el QR; lo administrativo queda privado hasta que el titular lo active. */
export const DEFAULT_VISIBILITY: Record<Section, boolean> = {
  identity: true,
  vitals: true,
  allergies: true,
  conditions: true,
  medications: true,
  contacts: true,
  care: true,
  history: true,
  insurance: false,
  doctor: false,
  notes: false,
};

/** Fecha de hoy (YYYY-MM-DD) en la zona horaria de Jujuy. */
export function todayInJujuy(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    now,
  );
}

export function ageFrom(birthDate: string, now: Date = new Date()): number {
  const [ty, tm, td] = todayInJujuy(now).split('-').map(Number);
  const [by, bm, bd] = birthDate.split('-').map(Number);
  let age = ty - by;
  if (tm < bm || (tm === bm && td < bd)) age -= 1;
  return age;
}

const isRealDate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
};

const birthDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'invalid_date')
  .refine(isRealDate, 'invalid_date')
  .refine((s) => s >= '1900-01-01', 'too_old')
  .refine((s) => s <= todayInJujuy(), 'future_date');

const text = (max: number) => z.string().trim().max(max);
const optText = (max: number) => text(max).optional();
const phone = z.string().trim().regex(/^\+?[0-9 ()-]{6,20}$/, 'invalid_phone');

export const allergySchema = z.object({ substance: text(80).min(1), reaction: optText(80) });
export const conditionSchema = z.object({ name: text(80).min(1), note: optText(120) });
export const medicationSchema = z.object({
  name: text(80).min(1),
  dose: optText(60),
  anticoagulant: z.boolean().default(false),
});
export const contactSchema = z.object({ name: text(60).min(1), relation: optText(40), phone });

export const medicalRecordSchema = z.object({
  sex: z.enum(['F', 'M', 'X']).optional(),
  birthDate: birthDateSchema.optional(),
  language: optText(40),
  weightKg: z.number().min(1).max(400).optional(),
  heightCm: z.number().min(30).max(250).optional(),
  bloodType: z.enum(BLOOD_TYPES).optional(),

  allergies: z.array(allergySchema).max(20).default([]),
  allergiesNone: z.boolean().default(false),
  conditions: z.array(conditionSchema).max(20).default([]),
  conditionsNone: z.boolean().default(false),
  medications: z.array(medicationSchema).max(30).default([]),
  medicationsNone: z.boolean().default(false),
  contacts: z.array(contactSchema).max(3).default([]),

  communication: optText(200),
  transfusion: z.enum(['ACCEPTS', 'REFUSES', 'UNKNOWN']).default('UNKNOWN'),
  organDonor: z.enum(['YES', 'NO', 'UNKNOWN']).default('UNKNOWN'),
  directives: optText(300),

  surgeries: optText(300),
  implants: optText(200),
  insurance: z.object({ name: text(60), number: optText(40) }).optional(),
  doctor: z.object({ name: text(60), phone: phone.optional() }).optional(),
  notes: optText(500),
});
export type MedicalRecord = z.infer<typeof medicalRecordSchema>;
export type MedicalRecordInput = z.input<typeof medicalRecordSchema>;

export const visibilitySchema = z.object(
  Object.fromEntries(SECTIONS.map((s) => [s, z.boolean()])) as Record<Section, z.ZodBoolean>,
);
export type Visibility = z.infer<typeof visibilitySchema>;

export const saveMedicalRecordSchema = z.object({ data: medicalRecordSchema, visibility: visibilitySchema });
export type SaveMedicalRecordInput = z.input<typeof saveMedicalRecordSchema>;

export type MedicalRecordResponse = { data: MedicalRecord; visibility: Visibility; updatedAt: string | null };

/** Porcentaje de la ficha completa: ocho preguntas clave con el mismo peso. */
export function completion(r: MedicalRecord): number {
  const answered = [
    r.contacts.length > 0,
    !!r.bloodType,
    r.allergies.length > 0 || r.allergiesNone,
    r.medications.length > 0 || r.medicationsNone,
    r.conditions.length > 0 || r.conditionsNone,
    !!r.birthDate,
    r.weightKg !== undefined,
    r.heightCm !== undefined,
  ].filter(Boolean).length;
  return Math.round((answered / 8) * 100);
}

/** El QR está activo cuando hay al menos un contacto de emergencia. */
export const isActive = (r: MedicalRecord) => r.contacts.length > 0;
