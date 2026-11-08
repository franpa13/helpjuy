import type { PrintableData } from '@helpjuy/contracts';
import { render, screen } from '@testing-library/react';
import { Wallpaper, WALLPAPER_SIZE } from './Wallpaper';

const data: PrintableData = {
  name: 'Lucía Mamani',
  allergies: ['Penicilina', 'Látex'],
  moreAllergies: 1,
  noAllergies: false,
  bloodType: 'A+',
  anticoagulant: true,
  contact: { name: 'Jorge Mamani', phone: '388 412-3456' },
};

describe('Fondo de pantalla para el celular', () => {
  it('tiene el tamaño de una pantalla de celular (vertical)', () => {
    expect(WALLPAPER_SIZE.height).toBeGreaterThan(WALLPAPER_SIZE.width * 2);
  });

  it('muestra el QR, el nombre y lo mismo que la tarjeta impresa', () => {
    render(<Wallpaper data={data} qrDataUrl="data:image/png;base64,AAAA" />);
    expect(screen.getByRole('img')).toHaveAttribute('src', 'data:image/png;base64,AAAA');
    expect(screen.getByText('Lucía Mamani')).toBeInTheDocument();
    expect(screen.getByText('Penicilina, Látex +1')).toBeInTheDocument();
    expect(screen.getByText('A+')).toBeInTheDocument();
    expect(screen.getByText('Jorge · 388 412-3456')).toBeInTheDocument();
    expect(screen.getByText('ANTICOAGULADO')).toBeInTheDocument();
    expect(screen.getByText(/107/)).toBeInTheDocument();
  });

  it('lo que la persona eligió no mostrar no aparece', () => {
    const minimal: PrintableData = { name: 'Lucía Mamani', allergies: [], moreAllergies: 0, noAllergies: false, anticoagulant: false };
    render(<Wallpaper data={minimal} qrDataUrl="data:image/png;base64,AAAA" />);
    expect(screen.queryByText('Alergias')).not.toBeInTheDocument();
    expect(screen.queryByText('Sangre')).not.toBeInTheDocument();
    expect(screen.queryByText('Llamar')).not.toBeInTheDocument();
  });
});
