import { describe, expect, it } from 'vitest';
import { DEFAULT_VISIBILITY, medicalRecordSchema } from './medical';
import { printableData } from './printable';

const profile = { firstName: 'Lucía', lastName: 'Mamani' };
const record = medicalRecordSchema.parse({
  birthDate: '1985-06-20',
  bloodType: 'A+',
  allergies: [{ substance: 'Penicilina' }, { substance: 'Ibuprofeno' }, { substance: 'Látex' }, { substance: 'Maní' }],
  medications: [{ name: 'Warfarina', anticoagulant: true }],
  contacts: [{ name: 'Jorge Mamani', relation: 'hermano', phone: '388 412-3456' }],
  insurance: { name: 'ISJ', number: '123' },
});

describe('printableData', () => {
  it('con todo visible imprime nombre, 3 alergias (+N), sangre, anticoagulante y contacto', () => {
    expect(printableData(profile, record, DEFAULT_VISIBILITY)).toEqual({
      name: 'Lucía Mamani',
      allergies: ['Penicilina', 'Ibuprofeno', 'Látex'],
      moreAllergies: 1,
      noAllergies: false,
      bloodType: 'A+',
      anticoagulant: true,
      contact: { name: 'Jorge Mamani', phone: '388 412-3456' },
    });
  });

  it('una sección privada no se imprime', () => {
    const p = printableData(profile, record, { ...DEFAULT_VISIBILITY, allergies: false, vitals: false, contacts: false, medications: false });
    expect(p).toEqual({ name: 'Lucía Mamani', allergies: [], moreAllergies: 0, noAllergies: false, bloodType: undefined, anticoagulant: false, contact: undefined });
  });

  it('nunca imprime la fecha de nacimiento ni la obra social', () => {
    const json = JSON.stringify(printableData(profile, record, { ...DEFAULT_VISIBILITY, insurance: true }));
    expect(json).not.toContain('1985');
    expect(json).not.toContain('ISJ');
  });

  it('"no tengo alergias" se imprime como tal', () => {
    const r = medicalRecordSchema.parse({ allergiesNone: true });
    expect(printableData(profile, r, DEFAULT_VISIBILITY).noAllergies).toBe(true);
  });

  it('sin ficha imprime solo el nombre', () => {
    expect(printableData(profile, null, DEFAULT_VISIBILITY).name).toBe('Lucía Mamani');
  });
});
