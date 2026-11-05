import { describe, expect, it } from 'vitest';
import { ageFrom, completion, medicalRecordSchema } from './medical';

const empty = medicalRecordSchema.parse({});

describe('medicalRecordSchema', () => {
  it('una ficha vacía es válida y trae defaults', () => {
    expect(empty.allergies).toEqual([]);
    expect(empty.allergiesNone).toBe(false);
    expect(empty.transfusion).toBe('UNKNOWN');
  });

  it('rechaza una fecha de nacimiento futura', () => {
    expect(medicalRecordSchema.safeParse({ birthDate: '2999-01-01' }).success).toBe(false);
  });

  it('rechaza una fecha anterior a 1900 o con formato inválido', () => {
    expect(medicalRecordSchema.safeParse({ birthDate: '1850-01-01' }).success).toBe(false);
    expect(medicalRecordSchema.safeParse({ birthDate: '14/03/1992' }).success).toBe(false);
  });

  it('rechaza un teléfono con letras', () => {
    const r = medicalRecordSchema.safeParse({ contacts: [{ name: 'María', phone: 'llamame' }] });
    expect(r.success).toBe(false);
  });

  it('acepta teléfonos argentinos comunes', () => {
    const r = medicalRecordSchema.safeParse({ contacts: [{ name: 'María', phone: '+54 388 412-3456' }] });
    expect(r.success).toBe(true);
  });
});

describe('completion', () => {
  it('vacía → 0', () => {
    expect(completion(empty)).toBe(0);
  });

  it('completa → 100', () => {
    const full = medicalRecordSchema.parse({
      birthDate: '1992-03-14',
      weightKg: 78,
      heightCm: 175,
      bloodType: 'O+',
      allergiesNone: true,
      conditions: [{ name: 'Diabetes tipo 1' }],
      medicationsNone: true,
      contacts: [{ name: 'María', phone: '3884123456' }],
    });
    expect(completion(full)).toBe(100);
  });

  it('"no tengo alergias" cuenta como respondido', () => {
    expect(completion(medicalRecordSchema.parse({ allergiesNone: true }))).toBe(13);
  });
});

describe('ageFrom', () => {
  it('todavía no cumplió si el cumpleaños es mañana', () => {
    expect(ageFrom('1992-03-15', new Date('2026-03-14T15:00:00Z'))).toBe(33);
  });

  it('cumplió el día del cumpleaños (hora de Argentina)', () => {
    // 2026-03-15 01:00 UTC es todavía 14 de marzo en Argentina (UTC-3)
    expect(ageFrom('1992-03-15', new Date('2026-03-15T01:00:00Z'))).toBe(33);
    expect(ageFrom('1992-03-15', new Date('2026-03-15T12:00:00Z'))).toBe(34);
  });
});
