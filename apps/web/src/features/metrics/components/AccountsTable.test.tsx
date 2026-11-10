import type { AdminAccountRow, AdminAccountsDto } from '@helpjuy/contracts';
import { render, screen, within } from '@testing-library/react';
import { AccountsTable } from './AccountsTable';

const row = (over: Partial<AdminAccountRow> = {}): AdminAccountRow => ({
  id: 'u1',
  email: 'ana@mail.com',
  createdAt: '2026-11-08T15:30:00.000Z',
  emailVerified: true,
  google: false,
  password: true,
  profiles: 2,
  activeQr: true,
  printed: false,
  inFamily: true,
  lastLoginAt: '2026-11-09T12:00:00.000Z',
  ...over,
});

const dto = (over: Partial<AdminAccountsDto> = {}): AdminAccountsDto => ({
  total: 1,
  page: 1,
  pageSize: 25,
  q: '',
  items: [row()],
  ...over,
});

describe('AccountsTable', () => {
  it('muestra cada cuenta con su avance, con texto (no solo íconos)', () => {
    render(<AccountsTable data={dto()} />);
    const r = screen.getByRole('row', { name: /ana@mail\.com/ });
    expect(within(r).getByText('8/11/2026')).toBeInTheDocument();
    expect(within(r).getByText('Email')).toBeInTheDocument();
    expect(within(r).getByText('2')).toBeInTheDocument();
    expect(within(r).getAllByText('Sí')).toHaveLength(3); // confirmado, QR activo, familia
    expect(within(r).getByText('No')).toBeInTheDocument(); // impreso
  });

  it('dice cómo entra: Google, email o los dos; y "—" si no hay ingreso registrado', () => {
    render(
      <AccountsTable
        data={dto({
          total: 2,
          items: [row({ id: 'a', email: 'g@mail.com', google: true, password: false, lastLoginAt: null }), row({ id: 'b', email: 'b@mail.com', google: true })],
        })}
      />,
    );
    const g = screen.getByRole('row', { name: /g@mail\.com/ });
    expect(within(g).getByText('Google')).toBeInTheDocument();
    expect(within(g).getByText('—')).toBeInTheDocument();
    expect(within(screen.getByRole('row', { name: /b@mail\.com/ })).getByText('Google y email')).toBeInTheDocument();
  });

  it('busca por email (formulario GET que conserva lo buscado)', () => {
    render(<AccountsTable data={dto({ q: 'ana' })} />);
    const search = screen.getByRole('searchbox', { name: 'Buscar por email' });
    expect(search).toHaveValue('ana');
    expect(search.closest('form')).toHaveAttribute('method', 'get');
  });

  it('pagina conservando la búsqueda', () => {
    render(<AccountsTable data={dto({ total: 60, page: 2, q: 'mail' })} />);
    expect(screen.getByText('Página 2 de 3')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Anteriores/ })).toHaveAttribute('href', '/panel/metricas?q=mail&pagina=1#cuentas');
    expect(screen.getByRole('link', { name: /Siguientes/ })).toHaveAttribute('href', '/panel/metricas?q=mail&pagina=3#cuentas');
  });

  it('sin resultados lo dice', () => {
    render(<AccountsTable data={dto({ total: 0, items: [], q: 'nadie' })} />);
    expect(screen.getByText('No hay cuentas con "nadie" en el email.')).toBeInTheDocument();
  });
});
