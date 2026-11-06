import type { BloodType, MedicalRecord, Visibility } from './medical';

const MAX_PRINTED_ALLERGIES = 3;
/** Lo que entra en una línea de la tarjeta sin cortarse: el resto está en la ficha. */
const MAX_ALLERGY_CHARS = 22;
const fit = (s: string) => (s.length > MAX_ALLERGY_CHARS ? `${s.slice(0, MAX_ALLERGY_CHARS - 1)}…` : s);

/** Lo que va impreso en la tarjeta y el sticker. Sirve sin señal: solo lo más crítico. */
export type PrintableData = {
  name: string;
  allergies: string[];
  /** Cuántas alergias más hay que no entran en el papel. */
  moreAllergies: number;
  noAllergies: boolean;
  bloodType?: BloodType;
  anticoagulant: boolean;
  contact?: { name: string; phone: string };
};

export type PrintStatus = 'never' | 'ok' | 'outdated';

/**
 * Única fuente de verdad de lo impreso: la usa la web para dibujar y la API para la huella
 * que detecta cuándo hay que reimprimir. Solo toma secciones visibles en el QR.
 */
export function printableData(
  profile: { firstName: string; lastName: string },
  record: MedicalRecord | null,
  visibility: Visibility,
): PrintableData {
  const showAllergies = !!record && visibility.allergies;
  const allergies = showAllergies ? record.allergies.map((a) => a.substance) : [];
  const contact = record && visibility.contacts ? record.contacts[0] : undefined;
  return {
    name: `${profile.firstName} ${profile.lastName}`,
    allergies: allergies.slice(0, MAX_PRINTED_ALLERGIES).map(fit),
    moreAllergies: Math.max(0, allergies.length - MAX_PRINTED_ALLERGIES),
    noAllergies: showAllergies && record.allergiesNone && record.allergies.length === 0,
    bloodType: record && visibility.vitals ? record.bloodType : undefined,
    anticoagulant: !!record && visibility.medications && record.medications.some((m) => m.anticoagulant),
    contact: contact ? { name: contact.name, phone: contact.phone } : undefined,
  };
}

/**
 * Texto que se hashea (sha256) para la huella de lo impreso. Lo usan la API y la web
 * con la misma serialización, así la web puede decir "esto es lo que mostré".
 */
export function printFingerprintInput(token: string, printable: PrintableData): string {
  return JSON.stringify({ token, printable });
}
