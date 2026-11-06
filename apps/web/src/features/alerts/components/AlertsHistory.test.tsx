import type { ReceivedAlertDto } from '@helpjuy/contracts';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlertsHistory } from './AlertsHistory';

vi.mock('./AlertsMap', () => ({
  AlertsMap: ({ points, selectedId }: { points: { id: string }[]; selectedId: string | null }) => (
    <div data-testid="map" data-points={points.length} data-selected={selectedId ?? ''} />
  ),
}));

const alert = (over: Partial<ReceivedAlertDto> = {}): ReceivedAlertDto => ({
  id: 'a1',
  at: '2026-11-06T17:32:00.000Z',
  profileName: 'Ana Paredes',
  mine: false,
  location: { lat: -24.186, lng: -65.299 },
  ...over,
});

describe('AlertsHistory', () => {
  it('sin avisos lo dice con calma y no muestra mapa', () => {
    render(<AlertsHistory alerts={[]} />);
    expect(screen.getByText(/No hubo avisos/)).toBeInTheDocument();
    expect(screen.queryByTestId('map')).not.toBeInTheDocument();
  });

  it('lista los avisos con quién, cuándo (hora de Jujuy) y si es tuya o de tu familia', () => {
    render(<AlertsHistory alerts={[alert(), alert({ id: 'a2', profileName: 'Francisco Paredes', mine: true, location: null })]} />);
    const items = within(screen.getByRole('list', { name: 'Avisos' })).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Ana Paredes');
    expect(items[0]).toHaveTextContent('De tu familia');
    expect(items[0]).toHaveTextContent('14:32');
    expect(items[1]).toHaveTextContent('Tu ficha');
    expect(items[1]).toHaveTextContent('Sin ubicación');
  });

  it('en el mapa van solo los avisos con ubicación', () => {
    render(<AlertsHistory alerts={[alert(), alert({ id: 'a2', location: null })]} />);
    expect(screen.getByTestId('map')).toHaveAttribute('data-points', '1');
  });

  it('"Ver en el mapa" marca ese aviso y deja abrirlo en Google Maps', async () => {
    const user = userEvent.setup();
    render(<AlertsHistory alerts={[alert(), alert({ id: 'a2', profileName: 'Beto Paredes' })]} />);
    await user.click(screen.getAllByRole('button', { name: /Ver en el mapa/ })[1]);
    expect(screen.getByTestId('map')).toHaveAttribute('data-selected', 'a2');
    expect(screen.getAllByRole('link', { name: /Google Maps/ })[0]).toHaveAttribute(
      'href',
      'https://www.google.com/maps?q=-24.186,-65.299',
    );
  });
});
