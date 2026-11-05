import { DEFAULT_VISIBILITY, medicalRecordSchema } from '@helpjuy/contracts';
import { fromRecord, validate } from './draft';

describe('validate (editor)', () => {
  it('un texto demasiado largo se marca en su campo con un mensaje claro', () => {
    const d = fromRecord(medicalRecordSchema.parse({}));
    d.allergies = [{ substance: 'Penicilina', reaction: 'x'.repeat(85) }];
    const r = validate(d, DEFAULT_VISIBILITY);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors['allergies.0.reaction']).toBe('Texto demasiado largo');
  });
});
