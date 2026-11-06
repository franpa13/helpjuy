import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DEFAULT_VISIBILITY } from '@helpjuy/contracts';
import { PrismaService } from '../src/shared/prisma/prisma.service.js';
import { createTestApp } from './helpers/app.js';
import { resetDb } from './helpers/db.js';

const consent = { version: '2026-11-05', accepted: true };
const base = {
  allergies: [{ substance: 'Penicilina' }],
  bloodType: 'A+',
  contacts: [{ name: 'Jorge', phone: '3884123456' }],
};

describe('estado de impresión del QR (e2e)', () => {
  let app: INestApplication;
  let ana: ReturnType<typeof request.agent>;
  let id: string;

  const save = (data: object, visibility = DEFAULT_VISIBILITY) =>
    ana.put(`/profiles/${id}/record`).send({ data, visibility }).expect(200);
  const status = async () => (await ana.get(`/profiles/${id}`).expect(200)).body.printStatus;

  beforeEach(async () => {
    app = await createTestApp();
    await resetDb(app.get(PrismaService));
    ana = request.agent(app.getHttpServer());
    await ana.post('/auth/register').send({ email: 'ana@mail.com', password: 'claveSegura1' });
    id = (await ana.post('/profiles').send({ firstName: 'Ana', lastName: 'P', relationship: 'SELF', isMinor: false, consent })).body.id;
    await save(base);
  });

  afterEach(async () => {
    await app.close();
  });

  it('nunca impreso → never; al marcar impreso → ok', async () => {
    expect(await status()).toBe('never');
    const r = await ana.post(`/profiles/${id}/printed`).expect(200);
    expect(r.body).toMatchObject({ printStatus: 'ok', printedAt: expect.any(String) });
    expect(await status()).toBe('ok');
  });

  it('cambiar una alergia impresa → outdated', async () => {
    await ana.post(`/profiles/${id}/printed`).expect(200);
    await save({ ...base, allergies: [{ substance: 'Penicilina' }, { substance: 'Látex' }] });
    expect(await status()).toBe('outdated');
  });

  it('rotar el QR → outdated', async () => {
    await ana.post(`/profiles/${id}/printed`).expect(200);
    await ana.post(`/profiles/${id}/rotate-token`).expect(200);
    expect(await status()).toBe('outdated');
  });

  it('un cambio que no va impreso (obra social) no pide reimprimir', async () => {
    await ana.post(`/profiles/${id}/printed`).expect(200);
    await save({ ...base, insurance: { name: 'ISJ' } });
    expect(await status()).toBe('ok');
  });

  it('ocultar una sección impresa → outdated', async () => {
    await ana.post(`/profiles/${id}/printed`).expect(200);
    await save(base, { ...DEFAULT_VISIBILITY, allergies: false });
    expect(await status()).toBe('outdated');
  });

  it('perfil ajeno → 404', async () => {
    const bob = request.agent(app.getHttpServer());
    await bob.post('/auth/register').send({ email: 'bob@mail.com', password: 'claveSegura1' });
    await bob.post(`/profiles/${id}/printed`).expect(404);
  });
});
