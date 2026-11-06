import type { BloodType, MedicalRecord, Visibility } from './medical';

const MAX_PRINTED_ALLERGIES = 3;

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
    allergies: allergies.slice(0, MAX_PRINTED_ALLERGIES),
    moreAllergies: Math.max(0, allergies.length - MAX_PRINTED_ALLERGIES),
    noAllergies: showAllergies && record.allergiesNone && record.allergies.length === 0,
    bloodType: record && visibility.vitals ? record.bloodType : undefined,
    anticoagulant: !!record && visibility.medications && record.medications.some((m) => m.anticoagulant),
    contact: contact ? { name: contact.name, phone: contact.phone } : undefined,
  };
}
