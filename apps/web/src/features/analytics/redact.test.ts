import { redactUrl } from './redact';

describe('redactUrl: lo que se manda a la analítica nunca lleva links secretos', () => {
  it('la ficha pública: el token es la llave de acceso, se reemplaza', () => {
    expect(redactUrl('https://helpjuy.vercel.app/e/Lu79aXT3udS93LtsS65_1g')).toBe('https://helpjuy.vercel.app/e/[ficha]');
  });

  it('las invitaciones a grupos', () => {
    expect(redactUrl('https://helpjuy.vercel.app/unirme/abc_DEF-123456789012345678901234567890123')).toBe(
      'https://helpjuy.vercel.app/unirme/[invitacion]',
    );
  });

  it('los links con token (confirmar email, nueva contraseña) pierden la query', () => {
    expect(redactUrl('https://helpjuy.vercel.app/verificar?token=secreto123')).toBe('https://helpjuy.vercel.app/verificar');
    expect(redactUrl('https://helpjuy.vercel.app/restablecer?token=x&otra=1')).toBe('https://helpjuy.vercel.app/restablecer');
  });

  it('los ids de fichas en el panel se agrupan', () => {
    expect(redactUrl('https://helpjuy.vercel.app/panel/perfiles/f1dc4430-11e3-4347-9246-f5a23f4ab6c6/imprimir')).toBe(
      'https://helpjuy.vercel.app/panel/perfiles/[id]/imprimir',
    );
  });

  it('el resto queda igual (sin query, por las dudas)', () => {
    expect(redactUrl('https://helpjuy.vercel.app/panel/familia')).toBe('https://helpjuy.vercel.app/panel/familia');
    expect(redactUrl('https://helpjuy.vercel.app/?cuenta=borrada')).toBe('https://helpjuy.vercel.app/');
  });
});
