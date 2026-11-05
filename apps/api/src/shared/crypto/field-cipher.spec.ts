import { randomBytes } from 'node:crypto';
import { decryptJson, encryptJson, loadMedicalKey } from './field-cipher.js';

const key = randomBytes(32);

describe('field-cipher (AES-256-GCM)', () => {
  it('ida y vuelta', () => {
    const value = { allergies: [{ substance: 'Penicilina' }] };
    expect(decryptJson(encryptJson(value, key), key)).toEqual(value);
  });

  it('no deja el texto en claro y usa IV aleatorio', () => {
    const a = encryptJson({ x: 'Penicilina' }, key);
    const b = encryptJson({ x: 'Penicilina' }, key);
    expect(a).not.toContain('Penicilina');
    expect(a).toMatch(/^v1\./);
    expect(a).not.toBe(b);
  });

  it('un dato alterado se rechaza', () => {
    const parts = encryptJson({ x: 1 }, key).split('.');
    parts[3] = Buffer.from('{"x":2}').toString('base64url');
    expect(() => decryptJson(parts.join('.'), key)).toThrow();
  });

  it('otra clave no puede descifrar', () => {
    expect(() => decryptJson(encryptJson({ x: 1 }, key), randomBytes(32))).toThrow();
  });

  it('loadMedicalKey exige 32 bytes', () => {
    const prev = process.env.MEDICAL_DATA_KEY;
    process.env.MEDICAL_DATA_KEY = randomBytes(31).toString('base64');
    expect(() => loadMedicalKey()).toThrow(/32 bytes/);
    process.env.MEDICAL_DATA_KEY = randomBytes(32).toString('base64');
    expect(loadMedicalKey()).toHaveLength(32);
    process.env.MEDICAL_DATA_KEY = prev;
  });
});
