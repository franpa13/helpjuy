import { render, screen } from '@testing-library/react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

describe('ingreso con Google en la web', () => {
  it('el ingreso muestra "Continuar con Google" y conserva a dónde volver', () => {
    render(<LoginForm next="/panel/perfiles/nuevo" googleEnabled />);
    expect(screen.getByRole('link', { name: 'Continuar con Google' })).toHaveAttribute(
      'href',
      '/api/auth/google?next=%2Fpanel%2Fperfiles%2Fnuevo',
    );
  });

  it('el registro también lo ofrece', () => {
    render(<RegisterForm googleEnabled />);
    expect(screen.getByRole('link', { name: 'Continuar con Google' })).toHaveAttribute('href', '/api/auth/google?next=%2Fpanel');
  });

  it('si Google no está configurado, no aparece el botón', () => {
    render(<LoginForm googleEnabled={false} />);
    expect(screen.queryByRole('link', { name: 'Continuar con Google' })).toBeNull();
  });

  it.each([
    ['google', 'No pudimos ingresar con Google. Probá de nuevo.'],
    ['google_email', 'Tu cuenta de Google no tiene el email verificado. Verificalo en Google o ingresá con tu email.'],
    ['google_disabled', 'El ingreso con Google todavía no está disponible. Ingresá con tu email.'],
  ])('muestra el error %s que manda la API al volver', (code, text) => {
    render(<LoginForm googleEnabled error={code} />);
    expect(screen.getByRole('alert')).toHaveTextContent(text);
  });
});
