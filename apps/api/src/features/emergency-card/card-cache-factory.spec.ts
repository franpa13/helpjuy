import { HttpCardCache, NoopCardCache, createCardCache } from './card-cache.js';

describe('createCardCache', () => {
  it('en producción sin WEB_URL o REVALIDATE_SECRET no arranca (si no, las fichas nunca se invalidarían)', () => {
    expect(() => createCardCache({ NODE_ENV: 'production', WEB_URL: 'https://web' })).toThrow(/REVALIDATE_SECRET/);
    expect(() => createCardCache({ NODE_ENV: 'production', REVALIDATE_SECRET: 's' })).toThrow(/WEB_URL/);
  });

  it('en desarrollo sin configuración usa la versión que no hace nada', () => {
    expect(createCardCache({ NODE_ENV: 'development' })).toBeInstanceOf(NoopCardCache);
  });

  it('con todo configurado usa HTTP', () => {
    expect(createCardCache({ NODE_ENV: 'production', WEB_URL: 'https://web', REVALIDATE_SECRET: 's' })).toBeInstanceOf(
      HttpCardCache,
    );
  });
});
