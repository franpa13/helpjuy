import type { ProfileDto } from '@helpjuy/contracts';
import { render, screen, within } from '@testing-library/react';
import { NextSteps, nextSteps } from './NextSteps';
import { ProfileCards } from './ProfileCards';

const p = (over: Partial<ProfileDto> = {}): ProfileDto => ({
  id: 'p1',
  firstName: 'Francisco',
  lastName: 'Paredes',
  relationship: 'SELF',
  isMinor: false,
  publicToken: 'AAAAAAAAAAAAAAAAAAAAAA',
  createdAt: '2026-11-05T00:00:00.000Z',
  completion: 75,
  active: true,
  printStatus: 'ok',
  printedAt: '2026-11-06T00:00:00.000Z',
  ...over,
});

describe('ProfileCards', () => {
  it('cada ficha muestra progreso y sus tres acciones', () => {
    render(<ProfileCards profiles={[p()]} />);
    const card = screen.getByRole('article', { name: 'Francisco Paredes' });
    expect(within(card).getByRole('progressbar', { name: 'Ficha completa' })).toHaveAttribute('aria-valuenow', '75');
    expect(within(card).getByRole('link', { name: /Editar ficha/ })).toHaveAttribute('href', '/panel/perfiles/p1');
    expect(within(card).getByRole('link', { name: /Imprimir QR/ })).toHaveAttribute('href', '/panel/perfiles/p1/imprimir');
    expect(within(card).getByRole('link', { name: /Ver como el paramédico/ })).toHaveAttribute('href', '/e/AAAAAAAAAAAAAAAAAAAAAA');
  });

  it('avisa si falta contacto o si hay que reimprimir', () => {
    render(<ProfileCards profiles={[p({ active: false, printStatus: 'outdated' })]} />);
    expect(screen.getByText('Falta un contacto de emergencia')).toBeInTheDocument();
    expect(screen.getByText('Cambiaron datos de tu QR impreso: reimprimilo.')).toBeInTheDocument();
  });

  it('ofrece agregar otra persona', () => {
    render(<ProfileCards profiles={[p()]} />);
    expect(screen.getByRole('link', { name: /Agregar otra persona/ })).toHaveAttribute('href', '/panel/perfiles/nuevo');
  });
});

describe('NextSteps', () => {
  it('calcula qué falta hacer', () => {
    const steps = nextSteps({ emailVerified: false, profiles: [p({ completion: 50, printStatus: 'never' })], familyMembers: 0 });
    expect(steps.map((s) => [s.key, s.done])).toEqual([
      ['email', false],
      ['complete', false],
      ['print', false],
      ['family', false],
    ]);
  });

  it('muestra el avance y tilda lo hecho', () => {
    render(<NextSteps emailVerified profiles={[p({ completion: 100 })]} familyMembers={2} />);
    expect(screen.getByText('4 de 4 listos')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Tus próximos pasos' })).toBeInTheDocument();
  });
});
