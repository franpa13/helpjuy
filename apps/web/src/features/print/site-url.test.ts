import { resolveSiteUrl } from './site-url';

describe('resolveSiteUrl', () => {
  it('en desarrollo usa localhost por defecto', () => {
    expect(resolveSiteUrl({ NODE_ENV: 'development' })).toBe('http://localhost:3000');
  });

  it('respeta SITE_URL y le saca la barra final', () => {
    expect(resolveSiteUrl({ NODE_ENV: 'development', SITE_URL: 'http://192.168.0.10:3000/' })).toBe('http://192.168.0.10:3000');
  });

  it.each([undefined, 'http://localhost:3000', 'https://127.0.0.1', 'https://192.168.0.10', 'http://helpjuy.app'])(
    'en producción rechaza %s (el QR impreso no se puede corregir después)',
    (url) => {
      expect(() => resolveSiteUrl({ NODE_ENV: 'production', SITE_URL: url })).toThrow(/SITE_URL/);
    },
  );

  it('en producción acepta una URL pública https', () => {
    expect(resolveSiteUrl({ NODE_ENV: 'production', SITE_URL: 'https://helpjuy.vercel.app' })).toBe('https://helpjuy.vercel.app');
  });
});
