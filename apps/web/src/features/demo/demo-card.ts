import type { PublicCardDto } from '@helpjuy/contracts';

/**
 * Ficha de ejemplo para /demo y el QR de la portada. Persona inventada; no está en la base de datos.
 * Los teléfonos no se marcan nunca (en modo demo los botones no llaman a nadie).
 */
export const DEMO_CARD: PublicCardDto = {
  firstName: 'Lucía',
  lastName: 'Mamani',
  active: true,
  updatedAt: '2026-11-10T12:00:00.000Z',
  identity: { age: 36, sex: 'F', language: 'Español' },
  vitals: { bloodType: 'A+', weightKg: 62, heightCm: 160 },
  allergies: {
    items: [{ substance: 'Penicilina', reaction: 'Me hincho, me cuesta respirar' }, { substance: 'Látex' }],
    none: false,
  },
  conditions: { items: [{ name: 'Diabetes tipo 1', note: 'Desde los 12 años' }], none: false },
  medications: { items: [{ name: 'Insulina glargina', dose: '20 U a la noche', anticoagulant: false }], none: false },
  contacts: [{ name: 'Jorge Mamani', relation: 'Hermano', phone: '388 000-0000' }],
  care: { transfusion: 'UNKNOWN', organDonor: 'YES' },
  insurance: { name: 'ISJ' },
};
