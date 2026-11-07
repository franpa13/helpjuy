import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { routerPush } from '../../../../vitest.setup';
import { AccountSettings } from './AccountSettings';

describe('AccountSettings', () => {
  it('descargar mis datos baja el archivo desde la API', () => {
    render(<AccountSettings email="ana@mail.com" emailVerified />);
    const link = screen.getByRole('link', { name: /Descargar mis datos/ });
    expect(link).toHaveAttribute('href', '/api/account/export');
    expect(link).toHaveAttribute('download');
  });

  it('borrar la cuenta pide escribir BORRAR antes de habilitar el botón', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));
    render(<AccountSettings email="ana@mail.com" emailVerified />);
    await user.click(screen.getByRole('button', { name: 'Borrar mi cuenta' }));
    const dialog = screen.getByRole('alertdialog');
    const confirm = within(dialog).getByRole('button', { name: 'Borrar todo' });
    expect(confirm).toBeDisabled();
    await user.type(within(dialog).getByLabelText(/Escribí BORRAR/), 'BORRAR');
    expect(confirm).toBeEnabled();
    await user.click(confirm);
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/account',
      expect.objectContaining({ method: 'DELETE', body: JSON.stringify({ confirm: 'BORRAR' }) }),
    );
    await vi.waitFor(() => expect(routerPush).toHaveBeenCalledWith('/?cuenta=borrada'));
  });
});
