import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordField } from './PasswordField';

describe('PasswordField', () => {
  it('arranca oculta y se puede mostrar y volver a ocultar', async () => {
    const user = userEvent.setup();
    render(<PasswordField label="Contraseña" name="password" />);
    const input = screen.getByLabelText('Contraseña');
    expect(input).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Ocultar contraseña' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Ocultar contraseña' }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('con requisito mínimo, avisa en vivo cuando se cumple', async () => {
    const user = userEvent.setup();
    render(<PasswordField label="Contraseña" name="password" minLength={8} />);
    expect(screen.getByText('Al menos 8 caracteres')).toHaveAttribute('data-ok', 'false');
    await user.type(screen.getByLabelText('Contraseña'), 'claveSegura');
    expect(screen.getByText('Al menos 8 caracteres')).toHaveAttribute('data-ok', 'true');
  });

  it('muestra el error del formulario', () => {
    render(<PasswordField label="Contraseña" name="password" error="La contraseña tiene que tener al menos 8 caracteres" />);
    expect(screen.getByText('La contraseña tiene que tener al menos 8 caracteres')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('aria-invalid', 'true');
  });
});
