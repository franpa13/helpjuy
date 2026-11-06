import type { FamilyGroupDto } from '@helpjuy/contracts';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FamilyGroups } from './FamilyGroups';

const json = (status: number, body: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const group = (over: Partial<FamilyGroupDto> = {}): FamilyGroupDto => ({
  id: 'g1',
  name: 'Familia Paredes',
  myRole: 'ADMIN',
  muted: false,
  createdAt: '2026-11-05T00:00:00.000Z',
  members: [
    { userId: 'u1', name: 'Francisco Paredes', role: 'ADMIN', isMe: true, joinedAt: '2026-11-05T00:00:00.000Z' },
    { userId: 'u2', name: 'Ana Paredes', role: 'MEMBER', isMe: false, joinedAt: '2026-11-05T01:00:00.000Z' },
  ],
  ...over,
});

describe('FamilyGroups', () => {
  it('sin grupos explica cómo funciona en 3 pasos y muestra el aviso que reciben', () => {
    render(<FamilyGroups initial={[]} />);
    expect(screen.getByText(/Todavía no tenés un grupo familiar/)).toBeInTheDocument();
    const steps = screen.getByRole('list', { name: 'Cómo funciona' });
    expect(within(steps).getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByLabelText('Ejemplo del email que recibe tu familia')).toHaveTextContent('Posible emergencia');
  });

  it('al crear el grupo aparece enseguida el link para invitar', async () => {
    const user = userEvent.setup();
    const created = group({ members: [group().members[0]] });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      const u = String(url);
      if (u === '/api/family-groups') return json(201, created);
      if (u.endsWith('/invites') && init?.method === 'POST')
        return json(201, { url: 'http://localhost:3000/unirme/nuevo', expiresAt: '2026-11-12T00:00:00.000Z' });
      return json(200, []);
    });
    render(<FamilyGroups initial={[]} />);
    await user.clear(screen.getByLabelText('Nombre del grupo'));
    await user.type(screen.getByLabelText('Nombre del grupo'), 'Familia Paredes');
    await user.click(screen.getByRole('button', { name: 'Crear grupo' }));
    expect(await screen.findByRole('heading', { name: 'Familia Paredes' })).toBeInTheDocument();
    expect(await screen.findByDisplayValue('http://localhost:3000/unirme/nuevo')).toBeInTheDocument();
    expect(fetchSpy.mock.calls[0][0]).toBe('/api/family-groups');
  });

  it('muestra miembros con su rol y quién sos vos', () => {
    render(<FamilyGroups initial={[group()]} />);
    const list = screen.getByRole('list', { name: 'Miembros de Familia Paredes' });
    expect(within(list).getByText('Francisco Paredes')).toBeInTheDocument();
    expect(within(list).getByText('Vos')).toBeInTheDocument();
    expect(within(list).getByText('Administra')).toBeInTheDocument();
  });

  it('invitar genera un link para copiar y para compartir por WhatsApp', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) =>
      String(url).endsWith('/invites') && init?.method === 'POST'
        ? json(201, { url: 'http://localhost:3000/unirme/abc', expiresAt: '2026-11-12T00:00:00.000Z' })
        : json(200, []),
    );
    render(<FamilyGroups initial={[group()]} />);
    await user.click(screen.getByRole('button', { name: 'Invitar a alguien' }));
    expect(await screen.findByDisplayValue('http://localhost:3000/unirme/abc')).toBeInTheDocument();
    const wa = screen.getByRole('link', { name: 'Compartir por WhatsApp' });
    expect(wa.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/\?text=/);
    expect(decodeURIComponent(wa.getAttribute('href')!)).toContain('http://localhost:3000/unirme/abc');
  });

  it('un miembro que no administra no ve invitar ni sacar gente', () => {
    render(<FamilyGroups initial={[group({ myRole: 'MEMBER' })]} />);
    expect(screen.queryByRole('button', { name: 'Invitar a alguien' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Sacar a/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Salir del grupo' })).toBeInTheDocument();
  });

  it('"Probar aviso" muestra a cuántas personas les llegó', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(201, { notified: 2, family: 1 }));
    render(<FamilyGroups initial={[group()]} />);
    await user.click(screen.getByRole('button', { name: 'Probar aviso' }));
    expect(await screen.findByText('Mandamos un aviso de prueba a 2 personas. Revisen su email.')).toBeInTheDocument();
  });

  it('si ya mandó una prueba hace poco, explica que espere', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(429, { error: 'test_alert_cooldown' }));
    render(<FamilyGroups initial={[group()]} />);
    await user.click(screen.getByRole('button', { name: 'Probar aviso' }));
    expect(await screen.findByText('Ya mandaste una prueba hace poco. Esperá unos minutos para mandar otra.')).toBeInTheDocument();
  });

  it('sin email confirmado avisa que no le van a llegar los avisos', () => {
    render(<FamilyGroups initial={[group()]} emailVerified={false} />);
    expect(screen.getByText(/Confirmá tu email para recibir los avisos/)).toBeInTheDocument();
  });

  it("con grupo, al costado muestra el aviso de ejemplo, cómo funciona y crear otro grupo", () => {
    render(<FamilyGroups initial={[group()]} myName="Francisco Paredes" />);
    const side = screen.getByRole("complementary", { name: "Sobre los avisos" });
    expect(within(side).getByLabelText("Ejemplo del email que recibe tu familia")).toHaveTextContent("Francisco Paredes");
    expect(within(side).getByRole("list", { name: "Cómo funciona" })).toBeInTheDocument();
    expect(within(side).getByText("Crear otro grupo")).toBeInTheDocument();
  });
});
