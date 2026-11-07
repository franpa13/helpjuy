import { describe, expect, it } from 'vitest';
import { createProfileSchema } from './profiles';
import { medicalRecordSchema } from './medical';
import { multiLine, singleLine } from './text';

describe('textos sin caracteres de control', () => {
  it('una línea: saca saltos de línea, tabs y caracteres invisibles', () => {
    expect(singleLine(60).parse('  Ana\r\nBcc: x@y.com\u0000 ')).toBe('Ana  Bcc: x@y.com');
    expect(singleLine(60).parse('Ana\tPérez\u007f')).toBe('Ana Pérez');
  });

  it('varias líneas: conserva los saltos de línea pero no lo demás', () => {
    expect(multiLine(200).parse('Primera\nSegunda\r\u0007')).toBe('Primera\nSegunda');
  });

  it('se aplica al nombre de la ficha y a los nombres de los contactos', () => {
    const p = createProfileSchema.parse({
      firstName: 'Ana\r\n',
      lastName: 'Paredes\u0000',
      relationship: 'SELF',
      isMinor: false,
      consent: { version: 'x', accepted: true },
    });
    expect(p).toMatchObject({ firstName: 'Ana', lastName: 'Paredes' });
    const r = medicalRecordSchema.parse({ contacts: [{ name: 'Jorge\nMamani', phone: '3884123456' }], notes: 'Uno\nDos' });
    expect(r.contacts[0]?.name).toBe('Jorge Mamani');
    expect(r.notes).toBe('Uno\nDos');
  });
});
