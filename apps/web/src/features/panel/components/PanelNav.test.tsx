import { render, screen } from '@testing-library/react';
import { navState } from '../../../../vitest.setup';
import { PanelNav } from './PanelNav';

describe('PanelNav', () => {
  it('muestra las tres opciones del panel', () => {
    navState.pathname = '/panel';
    render(<PanelNav />);
    expect(screen.getByRole('link', { name: /Avisos/ })).toHaveAttribute('href', '/panel/avisos');
    expect(screen.getByRole('link', { name: /Mis fichas/ })).toHaveAttribute('href', '/panel');
    expect(screen.getByRole('link', { name: /Mi familia/ })).toHaveAttribute('href', '/panel/familia');
  });

  it('marca la sección actual (también dentro de una ficha)', () => {
    navState.pathname = '/panel/perfiles/abc';
    render(<PanelNav />);
    expect(screen.getByRole('link', { name: /Mis fichas/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /Mi familia/ })).not.toHaveAttribute('aria-current');
  });

  it('en Familia, la activa es Mi familia', () => {
    navState.pathname = '/panel/familia';
    render(<PanelNav />);
    expect(screen.getByRole('link', { name: /Mi familia/ })).toHaveAttribute('aria-current', 'page');
  });

  it('en Avisos, la activa es Avisos', () => {
    navState.pathname = '/panel/avisos';
    render(<PanelNav />);
    expect(screen.getByRole('link', { name: /Avisos/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /Mis fichas/ })).not.toHaveAttribute('aria-current');
  });
});
