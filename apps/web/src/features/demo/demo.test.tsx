import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmergencyCard } from '@/features/emergency-card/components/EmergencyCard';
import { DEMO_CARD } from './demo-card';

describe('Ficha de ejemplo (/demo)', () => {
  afterEach(() => vi.restoreAllMocks());

  it('se ve igual que una ficha real, con un aviso claro de que es de ejemplo', () => {
    render(<EmergencyCard card={DEMO_CARD} demo />);
    expect(screen.getByRole('heading', { level: 1, name: /Lucía Mamani/ })).toBeInTheDocument();
    expect(screen.getByText('Penicilina')).toBeInTheDocument();
    expect(screen.getByRole('note', { name: 'Ficha de ejemplo' })).toHaveTextContent(/no llaman ni avisan a nadie/);
  });

  it('ningún botón marca un número: ni el 107 ni el contacto (nadie llama a emergencias probando)', () => {
    const { container } = render(<EmergencyCard card={DEMO_CARD} demo />);
    expect(container.querySelector('a[href^="tel:"]')).toBeNull();
    expect(container.querySelector('a[href*="wa.me"]')).toBeNull();
  });

  it('"Es una emergencia" muestra cómo funciona, sin mandar nada ni pedir la ubicación', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const geo = vi.fn();
    Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition: geo }, configurable: true });
    render(<EmergencyCard card={DEMO_CARD} demo />);
    await user.click(screen.getByRole('button', { name: /Es una emergencia/ }));
    await user.click(screen.getByRole('button', { name: /Sí, avisar a la familia de Lucía/ }));
    expect(await screen.findByText(/En una ficha real/)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(geo).not.toHaveBeenCalled();
  });
});
