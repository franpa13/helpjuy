import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DEFAULT_VISIBILITY } from '@helpjuy/contracts';
import { PrismaService } from '../src/shared/prisma/prisma.service.js';
import { createTestApp } from './helpers/app.js';
import { resetDb } from './helpers/db.js';

const profileBody = {
  firstName: 'Lucía',
  lastName: 'Mamani',
  relationship: 'SELF',
  isMinor: false,
  consent: { version: '2026-11-07', accepted: true },
};

const data = {
  sex: 'F',
  birthDate: '1985-06-20',
  weightKg: 64,
  heightCm: 158,
  bloodType: 'A+',
  allergies: [{ substance: 'Penicilina', reaction: 'anafilaxia' }],
  medicationsNone: true,
  conditions: [{ name: 'Epilepsia' }],
  contacts: [{ name: 'Jorge', relation: 'hermano', phone: '3884123456' }],
  insurance: { name: 'ISJ', number: '1234567' },
};

describe('ficha pública (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let alice: ReturnType<typeof request.agent>;
  let profile: { id: string; publicToken: string };

  beforeEach(async () => {
    app = await createTestApp();
    await resetDb(app.get(PrismaService));
    server = app.getHttpServer();
    alice = request.agent(server);
    await alice.post('/auth/register').send({ email: 'alice@mail.com', password: 'claveSegura1' });
    profile = (await alice.post('/profiles').send(profileBody)).body;
  });

  afterEach(async () => {
    await app.close();
  });

  const save = (visibility = DEFAULT_VISIBILITY) =>
    alice.put(`/profiles/${profile.id}/record`).send({ data, visibility }).expect(200);

  it('muestra las secciones públicas', async () => {
    await save();
    const r = await request(server).get(`/public/cards/${profile.publicToken}`).expect(200);
    expect(r.body).toMatchObject({
      firstName: 'Lucía',
      lastName: 'Mamani',
      active: true,
      vitals: { bloodType: 'A+', weightKg: 64, heightCm: 158 },
      allergies: { items: [{ substance: 'Penicilina', reaction: 'anafilaxia' }], none: false },
      medications: { items: [], none: true },
      contacts: [{ name: 'Jorge', relation: 'hermano', phone: '3884123456' }],
    });
    expect(r.body.identity.age).toBeGreaterThanOrEqual(40);
  });

  it('la obra social es privada por defecto y no aparece', async () => {
    await save();
    const r = await request(server).get(`/public/cards/${profile.publicToken}`).expect(200);
    expect(r.body).not.toHaveProperty('insurance');
    expect(r.body).not.toHaveProperty('doctor');
    expect(r.body).not.toHaveProperty('notes');
  });

  it('una sección clínica marcada privada no aparece', async () => {
    await save({ ...DEFAULT_VISIBILITY, allergies: false });
    const r = await request(server).get(`/public/cards/${profile.publicToken}`).expect(200);
    expect(r.body).not.toHaveProperty('allergies');
    expect(JSON.stringify(r.body)).not.toContain('Penicilina');
  });

  it('nunca expone fecha de nacimiento, email ni ids', async () => {
    await save({ ...DEFAULT_VISIBILITY, insurance: true });
    const r = await request(server).get(`/public/cards/${profile.publicToken}`).expect(200);
    const json = JSON.stringify(r.body);
    for (const leak of ['1985-06-20', 'birthDate', 'alice@mail.com', profile.id, 'ownerId', profile.publicToken]) {
      expect(json).not.toContain(leak);
    }
  });

  it('perfil sin ficha → solo el nombre y active:false', async () => {
    const r = await request(server).get(`/public/cards/${profile.publicToken}`).expect(200);
    expect(r.body).toEqual({ firstName: 'Lucía', lastName: 'Mamani', active: false, updatedAt: null });
  });

  it('token inexistente → 404', async () => {
    await request(server).get('/public/cards/AAAAAAAAAAAAAAAAAAAAAA').expect(404, { error: 'not_found' });
  });

  it('manda noindex y no-store', async () => {
    const r = await request(server).get(`/public/cards/${profile.publicToken}`).expect(200);
    expect(r.headers['x-robots-tag']).toBe('noindex, nofollow');
    expect(r.headers['cache-control']).toBe('no-store');
  });

  it('token rotado: el viejo deja de funcionar', async () => {
    await save();
    const old = profile.publicToken;
    await alice.post(`/profiles/${profile.id}/rotate-token`).expect(200);
    await request(server).get(`/public/cards/${old}`).expect(404);
  });
});
