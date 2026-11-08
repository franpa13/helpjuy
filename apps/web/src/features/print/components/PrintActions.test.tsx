import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrintActions } from './PrintActions';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

describe('PrintActions', () => {
  beforeEach(() => {
    window.print = vi.fn();
  });
  afterEach(() => vi.restoreAllMocks());

  it('sin impresora: guarda el PDF y explica cómo pedirlo en la fotocopiadora (tamaño real)', async () => {
    const user = userEvent.setup();
    render(<PrintActions profileId="p1" fingerprint="f" />);
    await user.click(screen.getByRole('button', { name: /Guardar en PDF/ }));
    expect(window.print).toHaveBeenCalled();
    expect(screen.getByText(/Guardar como PDF/)).toBeInTheDocument();
    expect(screen.getByText(/tamaño real/)).toBeInTheDocument();
  });

  it('cuando ya lo imprimieron en la fotocopiadora, lo pueden marcar como impreso', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }));
    render(<PrintActions profileId="p1" fingerprint="f" />);
    await user.click(screen.getByRole('button', { name: /Guardar en PDF/ }));
    await user.click(screen.getByRole('button', { name: 'Ya lo tengo impreso' }));
    expect(fetchSpy.mock.calls[0]?.[0]).toBe('/api/profiles/p1/printed');
    expect(await screen.findByText(/Listo. Si cambiás algo/)).toBeInTheDocument();
  });
});
