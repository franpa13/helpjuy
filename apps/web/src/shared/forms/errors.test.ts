import { safeNext } from './errors';

describe('safeNext', () => {
  it('acepta rutas internas con query', () => {
    expect(safeNext('/panel', '/x')).toBe('/panel');
    expect(safeNext('/panel/perfiles/nuevo?a=1', '/x')).toBe('/panel/perfiles/nuevo?a=1');
  });

  it.each(['//evil.com', '/\\evil.com', '/\t/evil.com', '/\n/evil.com', 'https://evil.com', 'javascript:alert(1)', ''])(
    'rechaza %j',
    (next) => {
      expect(safeNext(next, '/panel')).toBe('/panel');
    },
  );
});
