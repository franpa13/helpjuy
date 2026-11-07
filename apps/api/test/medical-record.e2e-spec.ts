import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DEFAULT_VISIBILITY } from '@helpjuy/contracts';
import { PrismaService } from '../src/shared/prisma/prisma.service.js';
import { createTestApp } from './helpers/app.js';
import { resetDb } from './helpers/db.js';

const profileBody = {
  firstName: 'Juan',
  lastName: 'Pérez',
  relationship: 'SELF',
  isMinor: false,
  consent: { version: '2026-11-07', accepted: true },
};

const record = {
  data: {
    bloodType: 'O+',
    allergies: [{ substance: 'Penicilina', reaction: 'anafilaxia' }],
    medications: [{ name: 'Acenocumarol', dose: '4 mg', anticoagulant: true }],
    contacts: [{ name: 'María Gómez', relation: 'esposa', phone: '+54 388 412-3456' }],
  },
  visibility: DEFAULT_VISIBILITY,
};

describe('ficha médica privada (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let alice: ReturnType<typeof request.agent>;
  let bob: ReturnType<typeof request.agent>;
  let profileId: string;

  beforeEach(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    await resetDb(prisma);
    alice = request.agent(app.getHttpServer());
    bob = request.agent(app.getHttpServer());
    await alice.post('/auth/register').send({ email: 'alice@mail.com', password: 'claveSegura1' });
    await bob.post('/auth/register').send({ email: 'bob@mail.com', password: 'claveSegura1' });
    profileId = (await alice.post('/profiles').send(profileBody)).body.id;
  });

  afterEach(async () => {
    await app.close();
  });

  it('un perfil sin ficha devuelve la ficha vacía con visibilidad por defecto', async () => {
    const r = await alice.get(`/profiles/${profileId}/record`).expect(200);
    expect(r.body.updatedAt).toBeNull();
    expect(r.body.data.allergies).toEqual([]);
    expect(r.body.visibility).toEqual(DEFAULT_VISIBILITY);
  });

  it('guarda y lee la ficha', async () => {
    const saved = await alice.put(`/profiles/${profileId}/record`).send(record).expect(200);
    expect(saved.body.updatedAt).toEqual(expect.any(String));
    const r = await alice.get(`/profiles/${profileId}/record`).expect(200);
    expect(r.body.data.allergies).toEqual([{ substance: 'Penicilina', reaction: 'anafilaxia' }]);
    expect(r.body.data.medications[0].anticoagulant).toBe(true);
  });

  it('en la base no queda ningún dato médico en claro', async () => {
    await alice.put(`/profiles/${profileId}/record`).send(record).expect(200);
    const row = await prisma.medicalRecord.findUniqueOrThrow({ where: { profileId } });
    expect(row.ciphertext).toMatch(/^v1\./);
    for (const plain of ['Penicilina', 'Acenocumarol', 'María', '388']) expect(row.ciphertext).not.toContain(plain);
  });

  it('perfil ajeno → 404 en GET y PUT', async () => {
    await bob.get(`/profiles/${profileId}/record`).expect(404, { error: 'not_found' });
    await bob.put(`/profiles/${profileId}/record`).send(record).expect(404, { error: 'not_found' });
    expect(await prisma.medicalRecord.count()).toBe(0);
  });

  it('teléfono inválido → 400 validation', async () => {
    const bad = { ...record, data: { ...record.data, contacts: [{ name: 'X', phone: 'llamame' }] } };
    const r = await alice.put(`/profiles/${profileId}/record`).send(bad).expect(400);
    expect(r.body.error).toBe('validation');
  });

  it('GET /profiles informa completitud y si el QR está activo', async () => {
    let list = (await alice.get('/profiles').expect(200)).body;
    expect(list[0]).toMatchObject({ completion: 0, active: false });
    await alice.put(`/profiles/${profileId}/record`).send(record).expect(200);
    list = (await alice.get('/profiles').expect(200)).body;
    // contacto + sangre + alergias + medicación = 4 de 8
    expect(list[0]).toMatchObject({ completion: 50, active: true });
  });
});
