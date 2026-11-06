import type { PrintableData } from '@helpjuy/contracts';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrintActions } from './PrintActions';
import { PrintSheet } from './PrintSheet';

const data: PrintableData = {
  name: 'Lucía Mamani',
  allergies: ['Penicilina', 'Ibuprofeno', 'Látex'],
  moreAllergies: 1,
  noAllergies: false,
  bloodType: 'A+',
  anticoagulant: true,
  contact: { name: 'Jorge Mamani', phone: '388 412-3456' },
};
const svg = '<svg data-qr="1" viewBox="0 0 10 10"></svg>';

describe('PrintSheet', () => {
  it('arma tarjeta (frente y dorso), stickers y versión grande', () => {
    render(<PrintSheet data={data} qrSvg={svg} url="http://localhost:3000/e/abc" />);
    expect(screen.getByLabelText('Tarjeta de billetera (frente)')).toBeInTheDocument();
    expect(screen.getByLabelText('Tarjeta de billetera (dorso)')).toBeInTheDocument();
    expect(screen.getAllByLabelText('Sticker para casco o moto')).toHaveLength(2);
    expect(screen.getByLabelText('Versión grande para la heladera')).toBeInTheDocument();
  });

  it('imprime lo crítico para cuando no hay señal', () => {
    render(<PrintSheet data={data} qrSvg={svg} url="http://localhost:3000/e/abc" />);
    const front = screen.getByLabelText('Tarjeta de billetera (frente)');
    expect(front).toHaveTextContent('Penicilina');
    expect(front).toHaveTextContent('+1');
    expect(front).toHaveTextContent('A+');
    expect(front).toHaveTextContent('ANTICOAGULADO');
    expect(front).toHaveTextContent('388 412-3456');
    expect(front.querySelector('[data-qr]')).not.toBeNull();
  });

  it('sin datos visibles imprime solo nombre, QR y 107', () => {
    render(
      <PrintSheet
        data={{ name: 'Lucía Mamani', allergies: [], moreAllergies: 0, noAllergies: false, anticoagulant: false }}
        qrSvg={svg}
        url="http://localhost:3000/e/abc"
      />,
    );
    const front = screen.getByLabelText('Tarjeta de billetera (frente)');
    expect(front).toHaveTextContent('Lucía Mamani');
    expect(front).not.toHaveTextContent('Alergias');
    expect(front).not.toHaveTextContent('ANTICOAGULADO');
    expect(screen.getByLabelText('Tarjeta de billetera (dorso)')).toHaveTextContent('107');
  });

  it('"Sin alergias conocidas" cuando la persona lo indicó', () => {
    render(<PrintSheet data={{ ...data, allergies: [], moreAllergies: 0, noAllergies: true }} qrSvg={svg} url="x" />);
    expect(screen.getByLabelText('Tarjeta de billetera (frente)')).toHaveTextContent('Sin alergias conocidas');
  });
});

describe('PrintActions', () => {
  it('marca como impreso y abre el diálogo de impresión', async () => {
    const user = userEvent.setup();
    const print = vi.fn();
    window.print = print;
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ printStatus: 'ok', printedAt: '2026-11-06T00:00:00Z' }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    render(<PrintActions profileId="p1" />);
    await user.click(screen.getByRole('button', { name: 'Imprimir' }));
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/profiles/p1/printed');
    await vi.waitFor(() => expect(print).toHaveBeenCalled());
  });
});
