import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/shared/prisma/prisma.service.js';
import { createTestApp } from './helpers/app.js';
import { resetDb } from './helpers/db.js';

const base = {
  firstName: 'Juan',
  lastName: 'Pérez',
  relationship: 'SELF',
  isMinor: false,
  consent: { version: '2026-11-05', accepted: true },
};

describe('consentimiento y perfiles (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: any;
  let alice: ReturnType<typeof request.agent>;
  let bob: ReturnType<typeof request.agent>;

  beforeEach(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    await resetDb(prisma);
    server = app.getHttpServer();
    alice = request.agent(server);
    bob = request.agent(server);
    await alice.post('/auth/register').send({ email: 'alice@mail.com', password: 'claveSegura1' }).expect(201);
    await bob.post('/auth/register').send({ email: 'bob@mail.com', password: 'claveSegura1' }).expect(201);
  });

  afterEach(async () => {
    await app.close();
  });

  it('crea perfil con token y registra consentimiento', async () => {
    const r = await alice.post('/profiles').send(base).expect(201);
    expect(r.body).toMatchObject({ firstName: 'Juan', lastName: 'Pérez', relationship: 'SELF', isMinor: false });
    expect(r.body.publicToken).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(
      await prisma.consentRecord.count({ where: { profileId: r.body.id, version: '2026-11-05' } }),
    ).toBe(1);
  });

  it('accepted:false → 400 y no crea nada', async () => {
    await alice
      .post('/profiles')
      .send({ ...base, consent: { version: '2026-11-05', accepted: false } })
      .expect(400);
    expect(await prisma.profile.count()).toBe(0);
  });

  it('sin consentimiento → 400', async () => {
    const { consent: _omit, ...sinConsentimiento } = base;
    await alice.post('/profiles').send(sinConsentimiento).expect(400);
  });

  it('versión vieja → 409 consent_outdated', async () => {
    await alice
      .post('/profiles')
      .send({ ...base, consent: { version: '2020-01-01', accepted: true } })
      .expect(409, { error: 'consent_outdated', currentVersion: '2026-11-05' });
    expect(await prisma.profile.count()).toBe(0);
  });

  it('menor sin declaración de tutor → 400 guardian_required', async () => {
    await alice
      .post('/profiles')
      .send({ ...base, relationship: 'CHILD', isMinor: true })
      .expect(400, { error: 'guardian_required' });
  });

  it('menor con declaración de tutor → la guarda en el consentimiento', async () => {
    const r = await alice
      .post('/profiles')
      .send({ ...base, relationship: 'CHILD', isMinor: true, consent: { ...base.consent, guardianDeclared: true } })
      .expect(201);
    const rec = await prisma.consentRecord.findFirstOrThrow({ where: { profileId: r.body.id } });
    expect(rec.guardianDeclared).toBe(true);
  });

  it('perfil ajeno → 404 en GET, PATCH, DELETE y rotate', async () => {
    const { body } = await alice.post('/profiles').send(base);
    await bob.get(`/profiles/${body.id}`).expect(404, { error: 'not_found' });
    await bob.patch(`/profiles/${body.id}`).send({ firstName: 'X' }).expect(404, { error: 'not_found' });
    await bob.delete(`/profiles/${body.id}`).expect(404, { error: 'not_found' });
    await bob.post(`/profiles/${body.id}/rotate-token`).expect(404, { error: 'not_found' });
    expect((await prisma.profile.findUniqueOrThrow({ where: { id: body.id } })).firstName).toBe('Juan');
  });

  it('id inexistente → 404', async () => {
    await alice.get('/profiles/00000000-0000-0000-0000-000000000000').expect(404, { error: 'not_found' });
    await alice.get('/profiles/no-es-un-uuid').expect(404, { error: 'not_found' });
  });

  it('editar y borrar el propio perfil', async () => {
    const { body } = await alice.post('/profiles').send(base);
    const r = await alice.patch(`/profiles/${body.id}`).send({ firstName: 'Juan Carlos' }).expect(200);
    expect(r.body.firstName).toBe('Juan Carlos');
    await alice.delete(`/profiles/${body.id}`).expect(204);
    await alice.get(`/profiles/${body.id}`).expect(404);
  });

  it('rotar token cambia el token', async () => {
    const { body } = await alice.post('/profiles').send(base);
    const r = await alice.post(`/profiles/${body.id}/rotate-token`).expect(200);
    expect(r.body.publicToken).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(r.body.publicToken).not.toBe(body.publicToken);
    expect(await prisma.profile.count({ where: { publicToken: body.publicToken } })).toBe(0);
  });

  it('varios perfiles por cuenta, solo ve los suyos', async () => {
    await alice.post('/profiles').send(base);
    await alice.post('/profiles').send({
      ...base,
      firstName: 'Sofía',
      relationship: 'CHILD',
      isMinor: true,
      consent: { ...base.consent, guardianDeclared: true },
    });
    await bob.post('/profiles').send({ ...base, firstName: 'Roberto' });
    const list = (await alice.get('/profiles').expect(200)).body;
    expect(list.map((p: { firstName: string }) => p.firstName)).toEqual(['Juan', 'Sofía']);
  });

  it('sin sesión → 401', async () => {
    await request(server).get('/profiles').expect(401);
    await request(server).post('/profiles').send(base).expect(401);
  });

  it('GET /consent/current es público', async () => {
    const r = await request(server).get('/consent/current').expect(200);
    expect(r.body.version).toBe('2026-11-05');
    expect(r.body.text).toContain('Frankfurt');
    expect(r.body.text).toContain('25.326');
  });
});
