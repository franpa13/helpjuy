import { render, screen } from '@testing-library/react';
import { PanelPage } from './PanelPage';

describe('PanelPage', () => {
  it('arma el mismo encabezado en todas las pantallas', () => {
    render(
      <PanelPage title="Mi familia" subtitle="Las personas que se enteran si te pasa algo." back={{ href: '/panel', label: 'Mis fichas' }}>
        <p>contenido</p>
      </PanelPage>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Mi familia' })).toBeInTheDocument();
    expect(screen.getByText('Las personas que se enteran si te pasa algo.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Mis fichas/ })).toHaveAttribute('href', '/panel');
    expect(screen.getByText('contenido')).toBeInTheDocument();
  });

  it('con columna lateral la muestra como complementaria con su nombre', () => {
    render(
      <PanelPage title="Imprimí tu QR" aside={<p>acciones</p>} asideLabel="Imprimir">
        <p>hoja</p>
      </PanelPage>,
    );
    expect(screen.getByRole('complementary', { name: 'Imprimir' })).toHaveTextContent('acciones');
  });
});
