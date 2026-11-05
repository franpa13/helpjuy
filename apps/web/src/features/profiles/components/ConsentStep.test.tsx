import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConsentStep } from './ConsentStep';

describe('ConsentStep', () => {
  it('la casilla arranca sin marcar y el botón está deshabilitado', () => {
    render(<ConsentStep consent={{ version: '2026-11-05', text: '# Texto' }} isMinor={false} onAccept={vi.fn()} />);
    expect(screen.getByRole('checkbox', { name: /Leí y acepto/ })).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Aceptar y crear perfil' })).toBeDisabled();
  });

  it('al marcar la casilla se habilita y envía versión y aceptación', async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn();
    render(<ConsentStep consent={{ version: '2026-11-05', text: 'x' }} isMinor={false} onAccept={onAccept} />);
    await user.click(screen.getByRole('checkbox', { name: /Leí y acepto/ }));
    await user.click(screen.getByRole('button', { name: 'Aceptar y crear perfil' }));
    expect(onAccept).toHaveBeenCalledWith({ version: '2026-11-05', accepted: true, guardianDeclared: false });
  });

  it('si es menor pide además la declaración de tutor', async () => {
    const user = userEvent.setup();
    render(<ConsentStep consent={{ version: '2026-11-05', text: 'x' }} isMinor onAccept={vi.fn()} />);
    await user.click(screen.getByRole('checkbox', { name: /Leí y acepto/ }));
    expect(screen.getByRole('button', { name: 'Aceptar y crear perfil' })).toBeDisabled();
    await user.click(screen.getByRole('checkbox', { name: /Soy padre, madre o tutor/ }));
    expect(screen.getByRole('button', { name: 'Aceptar y crear perfil' })).toBeEnabled();
  });

  it('muestra el texto del consentimiento', () => {
    render(
      <ConsentStep
        consent={{ version: '2026-11-05', text: '**Todo es opcional.** Ley 25.326' }}
        isMinor={false}
        onAccept={vi.fn()}
      />,
    );
    expect(screen.getByText('Todo es opcional.')).toBeVisible();
  });
});
