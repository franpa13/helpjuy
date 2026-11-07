import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfilePhoto } from './ProfilePhoto';

const json = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const base = { profileId: 'p1', name: 'Lucía Mamani', relationship: 'SELF' as const, isMinor: false, visible: false };

describe('ProfilePhoto', () => {
  it('sin foto ofrece subir una y muestra las iniciales', () => {
    render(<ProfilePhoto {...base} photoVersion={null} googlePhoto={false} />);
    expect(screen.getByRole('button', { name: /Subir foto/ })).toBeInTheDocument();
    expect(screen.getByText('LM')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Quitar/ })).not.toBeInTheDocument();
  });

  it('en tu propia ficha, si entraste con Google, ofrece usar esa foto', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(200, { photoVersion: '123' }));
    render(<ProfilePhoto {...base} photoVersion={null} googlePhoto />);
    await user.click(screen.getByRole('button', { name: /Usar mi foto de Google/ }));
    expect(fetchSpy).toHaveBeenCalledWith('/api/profiles/p1/photo/google', expect.objectContaining({ method: 'POST' }));
    expect(await screen.findByRole('button', { name: /Cambiar foto/ })).toBeInTheDocument();
  });

  it('la foto de Google no se ofrece en la ficha de otra persona', () => {
    render(<ProfilePhoto {...base} relationship="CHILD" photoVersion={null} googlePhoto />);
    expect(screen.queryByRole('button', { name: /Usar mi foto de Google/ })).not.toBeInTheDocument();
  });

  it('quitar la foto la borra', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(204));
    render(<ProfilePhoto {...base} photoVersion="1" googlePhoto={false} />);
    await user.click(screen.getByRole('button', { name: /Quitar foto/ }));
    expect(fetchSpy).toHaveBeenCalledWith('/api/profiles/p1/photo', expect.objectContaining({ method: 'DELETE' }));
    expect(await screen.findByRole('button', { name: /Subir foto/ })).toBeInTheDocument();
  });

  it('si es de un menor y se va a ver en el QR, avisa', () => {
    render(<ProfilePhoto {...base} relationship="CHILD" isMinor visible photoVersion="1" googlePhoto={false} />);
    expect(screen.getByText(/foto de un menor/i)).toBeInTheDocument();
  });
});
