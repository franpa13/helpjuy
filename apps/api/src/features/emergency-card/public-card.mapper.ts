import { ageFrom, isActive, type MedicalRecord, type PublicCardDto, type Visibility } from '@helpjuy/contracts';

const defined = <T extends object>(o: T): T =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== '')) as T;

/**
 * Arma lo que ve quien escanea. Solo copia las secciones públicas, campo por campo
 * (lista blanca): nada que no esté acá puede filtrarse aunque el contrato crezca.
 */
export function toPublicCard(
  profile: { firstName: string; lastName: string; photoUpdatedAt?: Date | null },
  record: MedicalRecord | null,
  visibility: Visibility,
  updatedAt: Date | null,
  now: Date = new Date(),
): PublicCardDto {
  const card: PublicCardDto = {
    firstName: profile.firstName,
    lastName: profile.lastName,
    active: record ? isActive(record) : false,
    updatedAt: updatedAt ? updatedAt.toISOString() : null,
  };
  const show = (s: keyof Visibility) => visibility[s] === true;
  // La foto se ve solo si el titular la eligió mostrar (por defecto, oculta).
  if (show('photo') && profile.photoUpdatedAt) card.photoVersion = String(profile.photoUpdatedAt.getTime());
  if (!record) return card;

  if (show('identity')) {
    card.identity = defined({
      age: record.birthDate ? ageFrom(record.birthDate, now) : undefined,
      sex: record.sex,
      language: record.language,
    });
  }
  if (show('vitals')) {
    card.vitals = defined({ bloodType: record.bloodType, weightKg: record.weightKg, heightCm: record.heightCm });
  }
  if (show('allergies')) {
    card.allergies = {
      items: record.allergies.map((a) => defined({ substance: a.substance, reaction: a.reaction })),
      none: record.allergiesNone && record.allergies.length === 0,
    };
  }
  if (show('conditions')) {
    card.conditions = {
      items: record.conditions.map((c) => defined({ name: c.name, note: c.note })),
      none: record.conditionsNone && record.conditions.length === 0,
    };
  }
  if (show('medications')) {
    card.medications = {
      items: record.medications.map((m) => defined({ name: m.name, dose: m.dose, anticoagulant: m.anticoagulant })),
      none: record.medicationsNone && record.medications.length === 0,
    };
  }
  if (show('contacts')) {
    card.contacts = record.contacts.map((c) => defined({ name: c.name, relation: c.relation, phone: c.phone }));
  }
  if (show('care')) {
    card.care = defined({
      communication: record.communication,
      transfusion: record.transfusion,
      organDonor: record.organDonor,
      directives: record.directives,
    });
  }
  if (show('history') && (record.surgeries || record.implants)) {
    card.history = defined({ surgeries: record.surgeries, implants: record.implants });
  }
  if (show('insurance') && record.insurance?.name) {
    card.insurance = defined({ name: record.insurance.name, number: record.insurance.number });
  }
  if (show('doctor') && record.doctor?.name) {
    card.doctor = defined({ name: record.doctor.name, phone: record.doctor.phone });
  }
  if (show('notes') && record.notes) card.notes = record.notes;
  return card;
}
