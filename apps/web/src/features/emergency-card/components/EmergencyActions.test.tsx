import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmergencyActions, whatsappHref } from './EmergencyActions';

const T = 'AAAAAAAAAAAAAAAAAAAAAA';

describe('EmergencyActions', () => {
  it('pide confirmación antes de avisar y muestra a cuántos avisó', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ notified: 2 }), { status: 201, headers: { 'Content-Type': 'application/json' } }));
    render(<EmergencyActions token={T} firstName="Lucía" lastName="Mamani" />);
    await user.click(screen.getByRole('button', { name: 'Es una emergencia: avisar a la familia' }));
    expect(fetchSpy).not.toHaveBeenCalled();
    await user.click(screen.getByRole('checkbox', { name: /Compartir mi ubicación/ }));
    await user.click(screen.getByRole('button', { name: 'Sí, avisar a la familia de Lucía' }));
    expect(await screen.findByText('Avisamos a 2 personas de la familia de Lucía.')).toBeInTheDocument();
    expect(fetchSpy.mock.calls[0][0]).toBe(`/api/public/cards/${T}/emergency`);
  });

  it('se puede cancelar', async () => {
    const user = userEvent.setup();
    render(<EmergencyActions token={T} firstName="Lucía" lastName="Mamani" />);
    await user.click(screen.getByRole('button', { name: 'Es una emergencia: avisar a la familia' }));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByRole('button', { name: 'Es una emergencia: avisar a la familia' })).toBeInTheDocument();
  });

  it('si falla, indica llamar al 107', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('sin señal'));
    render(<EmergencyActions token={T} firstName="Lucía" lastName="Mamani" />);
    await user.click(screen.getByRole('button', { name: 'Es una emergencia: avisar a la familia' }));
    await user.click(screen.getByRole('checkbox', { name: /Compartir mi ubicación/ }));
    await user.click(screen.getByRole('button', { name: 'Sí, avisar a la familia de Lucía' }));
    expect(await screen.findByText(/No pudimos avisar.*107/)).toBeInTheDocument();
  });

  it('WhatsApp al contacto con número argentino y mensaje armado', () => {
    render(
      <EmergencyActions token={T} firstName="Lucía" lastName="Mamani" contact={{ name: 'Jorge', phone: '388 412-3456' }} />,
    );
    const link = screen.getByRole('link', { name: 'Avisar por WhatsApp a Jorge' });
    expect(link.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/5493884123456\?text=/);
    expect(decodeURIComponent(link.getAttribute('href')!)).toContain('Lucía Mamani');
  });
});

describe('whatsappHref', () => {
  it.each([
    ['+54 9 388 412-3456', '5493884123456'],
    ['+54 388 412-3456', '5493884123456'],
    ['0388 15 412-3456', '5493884123456'],
    ['3884123456', '5493884123456'],
  ])('%s → %s', (phone, digits) => {
    expect(whatsappHref(phone, 'hola')).toBe(`https://wa.me/${digits}?text=hola`);
  });
});
