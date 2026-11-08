import { DEFAULT_VISIBILITY, medicalRecordSchema, type ProfileDto } from '@helpjuy/contracts';
import { render, screen, within } from '@testing-library/react';
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
  printStatus: 'never',
  printedAt: null,
  photoVersion: null,
};
const initial = { data: medicalRecordSchema.parse({}), visibility: DEFAULT_VISIBILITY };

const okResponse = () =>
  new Response(JSON.stringify({ ...initial, updatedAt: '2026-11-05T10:00:00.000Z' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

const optionalToggle = () => screen.getByRole('button', { name: /Completá cuando puedas/ });
const openOptional = () => userEvent.setup().click(optionalToggle());

describe('RecordEditor: primero lo vital', () => {
  afterEach(() => vi.restoreAllMocks());

  it('arranca por lo que salva vidas (contacto primero) y deja lo demás plegado', () => {
    render(<RecordEditor profile={profile} initial={initial} />);
    const titles = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(titles.slice(0, 5)).toEqual(['Contactos de emergencia', 'Alergias', 'Enfermedades', 'Medicación', 'Datos básicos']);
    expect(optionalToggle()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByLabelText('Obra social o prepaga')).not.toBeInTheDocument();
  });

  it('si ya cargó algo de lo opcional, aparece abierto', () => {
    const data = medicalRecordSchema.parse({ insurance: { name: 'ISJ' } });
    render(<RecordEditor profile={profile} initial={{ data, visibility: DEFAULT_VISIBILITY }} />);
    expect(optionalToggle()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByLabelText('Obra social o prepaga')).toHaveValue('ISJ');
  });

  it('si hay un error en lo opcional y estaba cerrado, se abre para mostrarlo', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch');
    render(<RecordEditor profile={profile} initial={initial} />);
    await user.click(optionalToggle());
    await user.type(screen.getByLabelText('Nombre del médico'), 'Dra. Cruz');
    await user.type(screen.getByLabelText('Teléfono del médico'), 'llamame');
    await user.click(optionalToggle());
    await user.click(screen.getByRole('button', { name: 'Guardar ficha' }));
    expect(optionalToggle()).toHaveAttribute('aria-expanded', 'true');
    expect(await screen.findByText('Revisá el teléfono')).toBeInTheDocument();
  });

  it('avisa que hay cambios sin guardar, y deja de avisar al guardar', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(okResponse());
    render(<RecordEditor profile={profile} initial={initial} />);
    expect(screen.queryByText('Tenés cambios sin guardar')).not.toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: 'No tengo alergias' }));
    expect(screen.getByText('Tenés cambios sin guardar')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Guardar ficha' }));
    await screen.findByText('Guardado. Tu QR ya muestra estos datos.');
    expect(screen.queryByText('Tenés cambios sin guardar')).not.toBeInTheDocument();
  });

  it('al guardar con un contacto, el siguiente paso es imprimir o descargar el QR', async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(okResponse());
    render(<RecordEditor profile={profile} initial={initial} />);
    await user.click(screen.getByRole('button', { name: 'Agregar contacto' }));
    await user.type(screen.getByLabelText('Nombre del contacto 1'), 'Jorge');
    await user.type(screen.getByLabelText('Teléfono del contacto 1'), '3884123456');
    await user.click(screen.getByRole('button', { name: 'Guardar ficha' }));
    expect(await screen.findByRole('link', { name: /imprimilo o guardalo en el celular/i })).toHaveAttribute(
      'href',
      '/panel/perfiles/p1/imprimir',
    );
  });
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

  it('la obra social arranca en "Solo yo" y las alergias en "Se ve en el QR"', async () => {
    render(<RecordEditor profile={profile} initial={initial} />);
    await openOptional();
    const insurance = screen.getByRole('radiogroup', { name: /Obra social: ¿quién lo ve?/ });
    expect(within(insurance).getByRole('radio', { name: /Solo yo/ })).toBeChecked();
    const allergies = screen.getByRole('radiogroup', { name: /Alergias: ¿quién lo ve?/ });
    expect(within(allergies).getByRole('radio', { name: /Se ve en el QR/ })).toBeChecked();
  });

  it('elegir "Solo yo" oculta la sección y lo refleja en el resumen', async () => {
    const user = userEvent.setup();
    render(<RecordEditor profile={profile} initial={initial} />);
    const allergies = screen.getByRole('radiogroup', { name: /Alergias: ¿quién lo ve?/ });
    await user.click(within(allergies).getByRole('radio', { name: /Solo yo/ }));
    expect(within(allergies).getByRole('radio', { name: /Solo yo/ })).toBeChecked();
    expect(within(allergies).getByRole('radio', { name: /Se ve en el QR/ })).not.toBeChecked();
    expect(screen.getByText(/Quien escanee tu QR va a ver:/).closest('p')).not.toHaveTextContent('Alergias');
  });

  it('resume qué va a ver quien escanee el QR', () => {
    render(<RecordEditor profile={profile} initial={initial} />);
    expect(screen.getByText(/Quien escanee tu QR va a ver:/).closest('p')).toHaveTextContent('Alergias');
  });

  it('si todo está oculto, avisa que solo se va a ver el nombre', () => {
    const hidden = Object.fromEntries(Object.keys(initial.visibility).map((k) => [k, false])) as typeof initial.visibility;
    render(<RecordEditor profile={profile} initial={{ ...initial, visibility: hidden }} />);
    expect(screen.getByText('Quien escanee tu QR solo va a ver tu nombre. Activá al menos alergias, medicación y contactos.')).toBeInTheDocument();
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

  it("cada campo de texto tiene el mismo largo máximo que acepta la API", async () => {
    const user = userEvent.setup();
    render(<RecordEditor profile={profile} initial={initial} />);
    await user.click(screen.getByRole("button", { name: "Agregar alergia" }));
    await user.click(screen.getByRole("button", { name: "Agregar remedio" }));
    await user.click(screen.getByRole("button", { name: "Agregar contacto" }));
    await openOptional();
    const max = (label: string) => (screen.getByLabelText(label) as HTMLInputElement).maxLength;
    expect(max("Alergia 1")).toBe(80);
    expect(max("Reacción 1")).toBe(80);
    expect(max("Dosis 1")).toBe(60);
    expect(max("Relación 1")).toBe(40);
    expect(max("Algo más que quieras dejar anotado")).toBe(500);
  });
});
