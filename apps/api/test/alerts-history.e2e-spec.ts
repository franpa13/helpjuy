import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/shared/prisma/prisma.service.js';
import { createTestApp } from './helpers/app.js';
import { resetDb } from './helpers/db.js';
import { FakeMailer } from './helpers/fake-mailer.js';

type Agent = ReturnType<typeof request.agent>;
const consent = { version: '2026-11-07', accepted: true };
const tokenOf = (url: string) => url.split('/unirme/')[1];
const DAY = 24 * 60 * 60 * 1000;

describe('avisos recibidos (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: any;
  let ana: Agent;
  let beto: Agent;
  let dani: Agent;
  let anaCard: string;
  let betoCard: string;
  let daniCard: string;
  let groupId: string;

  const signup = async (email: string, name: string) => {
    const a = request.agent(server);
    await a.post('/auth/register').send({ email, password: 'claveSegura1' }).expect(201);
    await prisma.user.update({ where: { email }, data: { emailVerifiedAt: new Date() } });
    const p = await a.post('/profiles').send({ firstName: name, lastName: 'Paredes', relationship: 'SELF', isMinor: false, consent });
    return { agent: a, token: p.body.publicToken as string };
  };
  const join = async (admin: Agent, gid: string, who: Agent) => {
    const url = (await admin.post(`/family-groups/${gid}/invites`).expect(201)).body.url;
    await who.post(`/family-invites/${tokenOf(url)}/accept`).expect(200);
  };
  const emergency = (token: string, body: object = {}) =>
    request(server).post(`/public/cards/${token}/emergency`).send(body).expect(201);

  beforeEach(async () => {
    app = await createTestApp({ mailer: new FakeMailer() });
    prisma = app.get(PrismaService);
    await resetDb(prisma);
    server = app.getHttpServer();
    ({ agent: ana, token: anaCard } = await signup('ana@mail.com', 'Ana'));
    ({ agent: beto, token: betoCard } = await signup('beto@mail.com', 'Beto'));
    ({ agent: dani, token: daniCard } = await signup('dani@mail.com', 'Dani'));
    groupId = (await ana.post('/family-groups').send({ name: 'Familia Paredes' })).body.id;
    await join(ana, groupId, beto);
  });

  afterEach(async () => {
    await app.close();
  });

  it('pide sesión', async () => {
    await request(server).get('/alerts').expect(401);
  });

  it('muestra los avisos de mis fichas y los de mi familia, con la ubicación aproximada', async () => {
    await emergency(anaCard, { lat: -24.18571, lng: -65.29944 });
    await emergency(betoCard);
    await emergency(daniCard); // Dani no está en el grupo

    const r = await ana.get('/alerts').expect(200);
    expect(r.body).toHaveLength(2);
    const [beto0, ana0] = r.body; // más nuevo primero
    expect(beto0).toMatchObject({ profileName: 'Beto Paredes', mine: false, location: null });
    expect(ana0).toMatchObject({ profileName: 'Ana Paredes', mine: true, location: { lat: -24.186, lng: -65.299 } });
    expect(typeof ana0.at).toBe('string');
    expect(ana0).not.toHaveProperty('profileId');
  });

  it('no repite los toques suprimidos ni muestra pruebas', async () => {
    await emergency(anaCard);
    await emergency(anaCard); // suprimido (dentro de 10 minutos)
    await ana.post(`/family-groups/${groupId}/test-alert`).expect(201);
    expect((await ana.get('/alerts')).body).toHaveLength(1);
  });

  it('quien entra a un grupo no ve avisos de antes de entrar', async () => {
    await emergency(anaCard, { lat: -24.1, lng: -65.3 });
    await prisma.emergencyAlert.updateMany({ data: { createdAt: new Date(Date.now() - 60_000) } });
    await join(ana, groupId, dani);
    expect((await dani.get('/alerts')).body).toHaveLength(0);

    await prisma.emergencyAlert.deleteMany();
    await emergency(anaCard);
    expect((await dani.get('/alerts')).body).toHaveLength(1);
  });

  it('si salgo del grupo dejo de ver los avisos de la familia', async () => {
    await emergency(anaCard);
    expect((await beto.get('/alerts')).body).toHaveLength(1);
    const betoId = (await prisma.user.findUniqueOrThrow({ where: { email: 'beto@mail.com' } })).id;
    await ana.delete(`/family-groups/${groupId}/members/${betoId}`).expect(204);
    expect((await beto.get('/alerts')).body).toHaveLength(0);
  });

  it('solo los últimos 30 días (la limpieza diaria borra la ubicación)', async () => {
    await emergency(anaCard, { lat: -24.1, lng: -65.3 });
    await prisma.emergencyAlert.updateMany({ data: { createdAt: new Date(Date.now() - 31 * DAY) } });
    expect((await ana.get('/alerts')).body).toHaveLength(0);
  });
});
