import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewProfileForm } from './NewProfileForm';

const consent = { version: '2026-11-05', text: 'Texto' };
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

async function fillAndAccept(user: ReturnType<typeof userEvent.setup>, minor = false) {
  await user.type(screen.getByLabelText('Nombre'), 'Lucía');
  await user.type(screen.getByLabelText('Apellido'), 'Mamani');
  await user.click(screen.getByRole('button', { name: 'Seguir' }));
  await user.click(screen.getByRole('checkbox', { name: /Leí y acepto/ }));
  if (minor) await user.click(screen.getByRole('checkbox', { name: /Soy padre, madre o tutor/ }));
  await user.click(screen.getByRole('button', { name: 'Aceptar y crear perfil' }));
}

describe('NewProfileForm', () => {
  it('sin ficha propia, la primera es la tuya: no pregunta para quién es', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(201, { id: 'p1' }));
    render(<NewProfileForm consent={consent} hasOwn={false} />);
    expect(screen.getByText(/Empezá por la tuya/)).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    await fillAndAccept(user);
    const body = JSON.parse(String(fetchSpy.mock.calls[0][1]?.body));
    expect(body).toMatchObject({ firstName: 'Lucía', relationship: 'SELF', isMinor: false });
  });

  it('con ficha propia, elegís para quién es (sin la opción "Yo")', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(201, { id: 'p2' }));
    render(<NewProfileForm consent={consent} hasOwn />);
    const who = screen.getByRole('radiogroup', { name: '¿Para quién es?' });
    expect(within(who).queryByRole('radio', { name: /^Yo/ })).not.toBeInTheDocument();
    expect(within(who).getByRole('radio', { name: /Hijo\/a/ })).toBeChecked();
    await user.click(within(who).getByRole('radio', { name: /Madre\/Padre/ }));
    await fillAndAccept(user);
    const body = JSON.parse(String(fetchSpy.mock.calls[0][1]?.body));
    expect(body).toMatchObject({ relationship: 'PARENT' });
  });

  it('si la API dice que falta la ficha propia, lo explica', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json(409, { error: 'self_profile_required' }));
    render(<NewProfileForm consent={consent} hasOwn />);
    await fillAndAccept(user);
    expect(await screen.findByText(/Primero creá tu propia ficha/)).toBeInTheDocument();
  });
});
