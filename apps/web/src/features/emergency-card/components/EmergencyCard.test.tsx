import type { PublicCardDto } from '@helpjuy/contracts';
import { render, screen, within } from '@testing-library/react';
import { EmergencyCard } from './EmergencyCard';

const full: PublicCardDto = {
  firstName: 'Lucía',
  lastName: 'Mamani',
  active: true,
  updatedAt: '2026-11-02T15:00:00.000Z',
  identity: { age: 41, sex: 'F', language: 'Español' },
  vitals: { bloodType: 'A+', weightKg: 64, heightCm: 158 },
  allergies: { items: [{ substance: 'Penicilina', reaction: 'anafilaxia' }], none: false },
  conditions: { items: [{ name: 'Epilepsia' }], none: false },
  medications: { items: [{ name: 'Warfarina', dose: '5 mg', anticoagulant: true }], none: false },
  contacts: [{ name: 'Jorge Mamani', relation: 'hermano', phone: '+54 388 412-3456' }],
  care: { transfusion: 'ACCEPTS', organDonor: 'YES', communication: 'Hablar despacio' },
};

describe('EmergencyCard', () => {
  it('muestra las alergias en el bloque de alergias', () => {
    render(<EmergencyCard card={full} />);
    const block = screen.getByRole('region', { name: 'Alergias' });
    expect(within(block).getByText('Penicilina')).toBeInTheDocument();
    expect(within(block).getByText('anafilaxia')).toBeInTheDocument();
  });

  it('"Sin alergias conocidas" cuando la persona respondió que no tiene', () => {
    render(<EmergencyCard card={{ ...full, allergies: { items: [], none: true } }} />);
    expect(screen.getByText('Sin alergias conocidas')).toBeInTheDocument();
  });

  it('marca los anticoagulantes', () => {
    render(<EmergencyCard card={full} />);
    expect(screen.getByText('ANTICOAG.')).toBeInTheDocument();
  });

  it('siempre tiene el botón para llamar al 107', () => {
    render(<EmergencyCard card={full} />);
    const links = screen.getAllByRole('link', { name: /107/ });
    expect(links.length).toBeGreaterThan(0);
    for (const a of links) expect(a).toHaveAttribute('href', 'tel:107');
  });

  it('el contacto se llama con un toque (tel: sin espacios)', () => {
    render(<EmergencyCard card={full} />);
    const links = screen.getAllByRole('link', { name: /Jorge/ });
    expect(links[0]).toHaveAttribute('href', 'tel:+543884123456');
  });

  it('muestra la edad y nunca una fecha de nacimiento', () => {
    render(<EmergencyCard card={full} />);
    expect(screen.getByText('41')).toBeInTheDocument();
    expect(screen.queryByText(/\d{4}-\d{2}-\d{2}/)).toBeNull();
  });

  it('una sección ausente no se dibuja', () => {
    render(<EmergencyCard card={full} />);
    expect(screen.queryByText(/Obra social/i)).toBeNull();
  });

  it('ficha sin datos: avisa y deja el 107', () => {
    render(<EmergencyCard card={{ firstName: 'Lucía', lastName: 'Mamani', active: false, updatedAt: null }} />);
    expect(screen.getByText('Esta ficha todavía no tiene datos de emergencia')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /107/ })[0]).toHaveAttribute('href', 'tel:107');
  });

  it('aclara que los datos no los verificó un médico', () => {
    render(<EmergencyCard card={full} />);
    expect(screen.getByText(/no verificados por un médico/)).toBeInTheDocument();
  });

  it("con datos médicos pero sin contacto no dice que no tiene datos", () => {
    render(<EmergencyCard card={{ ...full, active: false, contacts: [] }} />);
    expect(screen.queryByText("Esta ficha todavía no tiene datos de emergencia")).toBeNull();
    expect(screen.getByText("Sin contacto de emergencia cargado")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Alergias" })).toBeInTheDocument();
  });

  it("si la persona ocultó todo, lo dice en vez de quedar en blanco", () => {
    render(<EmergencyCard card={{ firstName: "Lucía", lastName: "Mamani", active: true, updatedAt: "2026-11-05T10:00:00.000Z" }} />);
    expect(screen.getByText("Esta persona eligió no mostrar sus datos médicos")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /107/ })[0]).toHaveAttribute("href", "tel:107");
  });
});
