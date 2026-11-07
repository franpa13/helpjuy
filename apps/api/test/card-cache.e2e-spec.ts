import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DEFAULT_VISIBILITY } from '@helpjuy/contracts';
import { PrismaService } from '../src/shared/prisma/prisma.service.js';
import { createTestApp } from './helpers/app.js';
import { resetDb } from './helpers/db.js';
import { FakeCardCache } from './helpers/fake-card-cache.js';

const profileBody = {
  firstName: 'Juan',
  lastName: 'Pérez',
  relationship: 'SELF',
  isMinor: false,
  consent: { version: '2026-11-07', accepted: true },
};
const record = { data: { allergies: [{ substance: 'Penicilina' }] }, visibility: DEFAULT_VISIBILITY };

describe('invalidación de la ficha pública (e2e)', () => {
  let app: INestApplication;
  let cache: FakeCardCache;
  let alice: ReturnType<typeof request.agent>;
  let profile: { id: string; publicToken: string };

  beforeEach(async () => {
    cache = new FakeCardCache();
    app = await createTestApp({ cardCache: cache });
    await resetDb(app.get(PrismaService));
    alice = request.agent(app.getHttpServer());
    await alice.post('/auth/register').send({ email: 'alice@mail.com', password: 'claveSegura1' });
    profile = (await alice.post('/profiles').send(profileBody)).body;
    cache.calls = [];
  });

  afterEach(async () => {
    await app.close();
  });

  it('guardar la ficha invalida su token', async () => {
    await alice.put(`/profiles/${profile.id}/record`).send(record).expect(200);
    expect(cache.calls).toEqual([[profile.publicToken]]);
  });

  it('editar el nombre invalida su token', async () => {
    await alice.patch(`/profiles/${profile.id}`).send({ firstName: 'Juan Carlos' }).expect(200);
    expect(cache.calls).toEqual([[profile.publicToken]]);
  });

  it('rotar invalida el token viejo y el nuevo', async () => {
    const r = await alice.post(`/profiles/${profile.id}/rotate-token`).expect(200);
    expect(cache.calls).toEqual([[profile.publicToken, r.body.publicToken]]);
  });

  it('borrar el perfil invalida su token', async () => {
    await alice.delete(`/profiles/${profile.id}`).expect(204);
    expect(cache.calls).toEqual([[profile.publicToken]]);
  });

  it('si la invalidación falla, guardar igual responde 200', async () => {
    cache.failWith = new Error('web caída');
    await alice.put(`/profiles/${profile.id}/record`).send(record).expect(200);
    await alice.patch(`/profiles/${profile.id}`).send({ firstName: 'X' }).expect(200);
  });
});
