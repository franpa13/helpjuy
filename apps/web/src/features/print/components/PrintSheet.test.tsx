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
  const ok = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  const FP = 'a'.repeat(64);

  it('abre la impresión y solo marca como impreso cuando la persona confirma', async () => {
    const user = userEvent.setup();
    const print = vi.fn();
    window.print = print;
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(ok(200, { printStatus: 'ok', printedAt: '2026-11-06T00:00:00Z' }));
    render(<PrintActions profileId="p1" fingerprint={FP} />);
    await user.click(screen.getByRole('button', { name: 'Imprimir' }));
    expect(print).toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Sí, ya lo tengo impreso' }));
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/profiles/p1/printed');
    expect(JSON.parse(String(fetchSpy.mock.calls[0][1]?.body))).toEqual({ fingerprint: FP });
    expect(await screen.findByText(/Listo/)).toBeInTheDocument();
  });

  it('si dice que no se imprimió, no marca nada y deja reintentar', async () => {
    const user = userEvent.setup();
    window.print = vi.fn();
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    render(<PrintActions profileId="p1" fingerprint={FP} />);
    await user.click(screen.getByRole('button', { name: 'Imprimir' }));
    await user.click(screen.getByRole('button', { name: 'No, lo intento de nuevo' }));
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(window.print).toHaveBeenCalledTimes(2);
  });

  it('si los datos cambiaron mientras imprimía, avisa que hay que reimprimir', async () => {
    const user = userEvent.setup();
    window.print = vi.fn();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(ok(409, { error: 'print_outdated' }));
    render(<PrintActions profileId="p1" fingerprint={FP} />);
    await user.click(screen.getByRole('button', { name: 'Imprimir' }));
    await user.click(screen.getByRole('button', { name: 'Sí, ya lo tengo impreso' }));
    expect(await screen.findByText(/cambiaron mientras imprimías/)).toBeInTheDocument();
  });
});
