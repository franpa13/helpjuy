import { render, screen, within } from '@testing-library/react';
import { Landing } from './Landing';

describe('Landing', () => {
  it('lleva a crear la ficha y a ingresar', () => {
    render(<Landing />);
    const crear = screen.getAllByRole('link', { name: /Crear mi ficha/ });
    expect(crear.length).toBeGreaterThanOrEqual(2);
    for (const a of crear) expect(a).toHaveAttribute('href', '/registro');
    expect(screen.getAllByRole('link', { name: /Ya tengo cuenta|Ingresar/ })[0]).toHaveAttribute('href', '/ingresar');
  });

  it('explica por qué en Jujuy, con datos oficiales y la fuente de cada uno', () => {
    render(<Landing />);
    const section = screen.getByRole('region', { name: 'En Jujuy mueren más personas en el tránsito que en el resto del país' });
    expect(section).toHaveTextContent('98');
    expect(section).toHaveTextContent('12,2');
    expect(section).toHaveTextContent('8,8');
    expect(section).toHaveTextContent('65 %');
    expect(section).toHaveTextContent('6 de cada 10');
    const sources = within(section).getAllByRole('link');
    expect(sources.length).toBeGreaterThanOrEqual(2);
    for (const a of sources) expect(a.getAttribute('href')).toMatch(/^https:\/\//);
    // No prometemos lo que no hace: no evita accidentes.
    expect(section).not.toHaveTextContent(/salva vidas|evita accidentes/i);
  });

  it('muestra el 107 como link de llamada', () => {
    render(<Landing />);
    expect(screen.getByRole('link', { name: '107' })).toHaveAttribute('href', 'tel:107');
  });

  it('explica privacidad y la ley de datos', () => {
    render(<Landing />);
    expect(screen.getByRole('heading', { name: 'Tus datos son tuyos' })).toBeInTheDocument();
    // Arranca invisible hasta entrar en pantalla (animación de scroll), por eso no usamos toBeVisible.
    // Aparece en la franja de datos clave y en la sección de privacidad.
    expect(screen.getAllByText(/Ley 25\.326/)).toHaveLength(2);
  });

  it("muestra los objetos que la gente lleva o tiene", () => {
    render(<Landing />);
    for (const name of ["Billetera", "Celular", "Llavero", "Moto y casco", "Auto", "Heladera"]) {
      expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    }
  });

  it("dice dónde poner cada cosa, con los lugares que buscan los rescatistas", () => {
    render(<Landing />);
    expect(screen.getByRole("heading", { name: "Dónde ponerlo para que lo encuentren" })).toBeInTheDocument();
    expect(screen.getByText(/Afuera del casco, del lado derecho/)).toBeInTheDocument();
    expect(screen.getByText(/detrás del parasol del conductor/)).toBeInTheDocument();
    expect(screen.getByText(/Pegada al DNI/)).toBeInTheDocument();
    expect(screen.getByText(/lado de adentro de la puerta de entrada/)).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Tres reglas" })).toBeInTheDocument();
  });
});
