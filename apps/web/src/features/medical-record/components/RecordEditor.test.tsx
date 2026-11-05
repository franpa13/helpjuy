import { DEFAULT_VISIBILITY, medicalRecordSchema, type ProfileDto } from '@helpjuy/contracts';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecordEditor } from './RecordEditor';

const profile: ProfileDto = {
  id: 'p1',
  firstName: 'Juan',
  lastName: 'Pérez',
  relationship: 'SELF',
  isMinor: false,
  publicToken: 'AAAAAAAAAAAAAAAAAAAAAA',
  createdAt: '2026-11-05T00:00:00.000Z',
  completion: 0,
  active: false,
};
const initial = { data: medicalRecordSchema.parse({}), visibility: DEFAULT_VISIBILITY };

const okResponse = () =>
  new Response(JSON.stringify({ ...initial, updatedAt: '2026-11-05T10:00:00.000Z' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

describe('RecordEditor', () => {
  it('agregar una alergia y guardar envía el payload limpio', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(okResponse());
    render(<RecordEditor profile={profile} initial={initial} />);
    await user.click(screen.getByRole('button', { name: 'Agregar alergia' }));
    await user.type(screen.getByLabelText('Alergia 1'), 'Penicilina');
    await user.click(screen.getByRole('button', { name: 'Guardar ficha' }));
    expect(await screen.findByText('Guardado. Tu QR ya muestra estos datos.')).toBeInTheDocument();
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('/api/profiles/p1/record');
    expect(init?.method).toBe('PUT');
    const body = JSON.parse(String(init?.body));
    expect(body.data.allergies).toEqual([{ substance: 'Penicilina' }]);
    expect(body.visibility).toEqual(DEFAULT_VISIBILITY);
  });

  it('"No tengo alergias" deshabilita la lista', async () => {
    const user = userEvent.setup();
    render(<RecordEditor profile={profile} initial={initial} />);
    await user.click(screen.getByRole('checkbox', { name: 'No tengo alergias' }));
    expect(screen.getByRole('button', { name: 'Agregar alergia' })).toBeDisabled();
  });

  it('la obra social arranca privada (no se ve en el QR)', () => {
    render(<RecordEditor profile={profile} initial={initial} />);
    expect(screen.getByRole('switch', { name: /Obra social: se ve en mi QR/ })).not.toBeChecked();
    expect(screen.getByRole('switch', { name: /Alergias: se ve en mi QR/ })).toBeChecked();
  });

  it('un teléfono inválido muestra "Revisá el teléfono" y no envía', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    render(<RecordEditor profile={profile} initial={initial} />);
    await user.click(screen.getByRole('button', { name: 'Agregar contacto' }));
    await user.type(screen.getByLabelText('Nombre del contacto 1'), 'María');
    await user.type(screen.getByLabelText('Teléfono del contacto 1'), 'llamame');
    await user.click(screen.getByRole('button', { name: 'Guardar ficha' }));
    expect(await screen.findByText('Revisá el teléfono')).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('muestra el progreso de la ficha', () => {
    render(<RecordEditor profile={profile} initial={initial} />);
    expect(screen.getByText('Ficha al 0%')).toBeInTheDocument();
  });
});
