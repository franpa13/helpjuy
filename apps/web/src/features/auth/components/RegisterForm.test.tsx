import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from './RegisterForm';

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('RegisterForm', () => {
  it('muestra error en español si la contraseña es corta y no envía', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    render(<RegisterForm />);
    await user.type(screen.getByLabelText('Email'), 'juan@mail.com');
    await user.type(screen.getByLabelText('Contraseña'), '1234567');
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(await screen.findByText('La contraseña tiene que tener al menos 8 caracteres')).toBeVisible();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('si el email ya existe muestra "Ya hay una cuenta con ese email"', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(409, { error: 'email_taken' }));
    render(<RegisterForm />);
    await user.type(screen.getByLabelText('Email'), 'juan@mail.com');
    await user.type(screen.getByLabelText('Contraseña'), 'claveSegura1');
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(await screen.findByText('Ya hay una cuenta con ese email')).toBeVisible();
  });

  it('si sale bien envía a /api/auth/register y va a crear el perfil', async () => {
    const user = userEvent.setup();
    const { routerPush } = await import('../../../../vitest.setup');
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse(201, { id: '1', email: 'juan@mail.com', emailVerified: false }));
    render(<RegisterForm />);
    await user.type(screen.getByLabelText('Email'), 'Juan@Mail.com');
    await user.type(screen.getByLabelText('Contraseña'), 'claveSegura1');
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));
    await vi.waitFor(() => expect(routerPush).toHaveBeenCalledWith('/panel/perfiles/nuevo'));
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/auth/register');
  });
});
