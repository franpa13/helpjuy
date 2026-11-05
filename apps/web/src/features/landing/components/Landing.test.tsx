import { render, screen } from '@testing-library/react';
import { Landing } from './Landing';

describe('Landing', () => {
  it('lleva a crear la ficha y a ingresar', () => {
    render(<Landing />);
    const crear = screen.getAllByRole('link', { name: /Crear mi ficha/ });
    expect(crear.length).toBeGreaterThanOrEqual(2);
    for (const a of crear) expect(a).toHaveAttribute('href', '/registro');
    expect(screen.getAllByRole('link', { name: /Ya tengo cuenta|Ingresar/ })[0]).toHaveAttribute('href', '/ingresar');
  });

  it('muestra el 107 como link de llamada', () => {
    render(<Landing />);
    expect(screen.getByRole('link', { name: '107' })).toHaveAttribute('href', 'tel:107');
  });

  it('explica privacidad y la ley de datos', () => {
    render(<Landing />);
    expect(screen.getByRole('heading', { name: 'Tus datos son tuyos' })).toBeInTheDocument();
    // Arranca invisible hasta entrar en pantalla (animación de scroll), por eso no usamos toBeVisible.
    expect(screen.getByText(/Ley 25\.326/)).toBeInTheDocument();
  });
});
