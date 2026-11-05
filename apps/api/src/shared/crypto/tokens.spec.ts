import { randomToken, sha256Hex } from './tokens.js';

describe('tokens', () => {
  it('randomToken(16) da 22 caracteres base64url', () => {
    expect(randomToken(16)).toMatch(/^[A-Za-z0-9_-]{22}$/);
  });

  it('randomToken no se repite', () => {
    expect(new Set(Array.from({ length: 1000 }, () => randomToken(16))).size).toBe(1000);
  });

  it('sha256Hex es determinístico y de 64 hex', () => {
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});
