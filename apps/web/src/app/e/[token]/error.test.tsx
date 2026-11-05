import { render, screen } from '@testing-library/react';
import CardError from './error';

describe('error de la ficha pública', () => {
  it('si la ficha no carga, igual queda el botón para llamar al 107', () => {
    render(<CardError error={new Error('API caída')} reset={vi.fn()} />);
    expect(screen.getByRole('link', { name: /107/ })).toHaveAttribute('href', 'tel:107');
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });
});
