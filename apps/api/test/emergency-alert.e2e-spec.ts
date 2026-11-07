import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { MaintenanceService } from '../src/features/maintenance/maintenance.service.js';
import { PrismaService } from '../src/shared/prisma/prisma.service.js';
import { createTestApp } from './helpers/app.js';
import { resetDb } from './helpers/db.js';
import { FakeMailer } from './helpers/fake-mailer.js';

type Agent = ReturnType<typeof request.agent>;
const consent = { version: '2026-11-07', accepted: true };
const tokenOf = (url: string) => url.split('/unirme/')[1];

describe('avisos de emergencia a la familia (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let mailer: FakeMailer;
  let server: any;
  let ana: Agent;
  let beto: Agent;
  let caro: Agent;
  let anaCard: string;
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
    request(server).post(`/public/cards/${token}/emergency`).send(body);
  const recipients = () => mailer.sent.map((m) => m.to).sort();

  beforeEach(async () => {
    mailer = new FakeMailer();
    app = await createTestApp({ mailer });
    prisma = app.get(PrismaService);
    await resetDb(prisma);
    server = app.getHttpServer();
    const a = await signup('ana@mail.com', 'Ana');
    ana = a.agent;
    anaCard = a.token;
    beto = (await signup('beto@mail.com', 'Beto')).agent;
    caro = (await signup('caro@mail.com', 'Caro')).agent;
    groupId = (await ana.post('/family-groups').send({ name: 'Familia Paredes' })).body.id;
    await join(ana, groupId, beto);
    await join(ana, groupId, caro);
    mailer.sent = [];
  });

  afterEach(async () => {
    await app.close();
  });

  it('avisa al dueño y a los miembros no silenciados', async () => {
    await caro.patch(`/family-groups/${groupId}/me`).send({ muted: true }).expect(200);
    const r = await emergency(anaCard).expect(201);
    expect(r.body).toEqual({ notified: 2, family: 1 });
    expect(recipients()).toEqual(['ana@mail.com', 'beto@mail.com']);
    expect(mailer.sent[0].subject).toBe('Posible emergencia: Ana Paredes');
    expect(mailer.sent[0].text).toContain('Puede no ser real');
    expect(mailer.sent[0].text).toContain('107');
  });

  it('un segundo toque dentro de 10 minutos no vuelve a mandar', async () => {
    await emergency(anaCard).expect(201);
    mailer.sent = [];
    const r = await emergency(anaCard).expect(201);
    expect(r.body).toEqual({ notified: 3, family: 2 });
    expect(mailer.sent).toHaveLength(0);
    expect(await prisma.emergencyAlert.count({ where: { suppressed: true } })).toBe(1);
  });

  it('pasados los 10 minutos se puede volver a avisar', async () => {
    await emergency(anaCard).expect(201);
    await prisma.emergencyAlert.updateMany({ data: { createdAt: new Date(Date.now() - 11 * 60 * 1000) } });
    mailer.sent = [];
    await emergency(anaCard).expect(201);
    expect(mailer.sent).toHaveLength(3);
  });

  it('alguien en dos grupos con la misma persona recibe un solo email', async () => {
    const g2 = (await ana.post('/family-groups').send({ name: 'Amigos' })).body.id;
    await join(ana, g2, beto);
    mailer.sent = [];
    await emergency(anaCard).expect(201);
    expect(recipients()).toEqual(['ana@mail.com', 'beto@mail.com', 'caro@mail.com']);
  });

  it('guarda la ubicación redondeada (~100 m) y la manda como link de mapa', async () => {
    await emergency(anaCard, { lat: -24.185786, lng: -65.299476 }).expect(201);
    const alert = await prisma.emergencyAlert.findFirstOrThrow();
    expect(alert.lat).toBe(-24.186);
    expect(alert.lng).toBe(-65.299);
    expect(mailer.sent[0].text).toContain('https://www.google.com/maps?q=-24.186,-65.299');
  });

  it('la ficha de un hijo avisa a los grupos del adulto que la administra', async () => {
    const kid = await ana.post('/profiles').send({
      firstName: 'Sofía',
      lastName: 'Paredes',
      relationship: 'CHILD',
      isMinor: true,
      consent: { ...consent, guardianDeclared: true },
    });
    mailer.sent = [];
    await emergency(kid.body.publicToken).expect(201);
    expect(recipients()).toEqual(['ana@mail.com', 'beto@mail.com', 'caro@mail.com']);
    expect(mailer.sent[0].subject).toBe('Posible emergencia: Sofía Paredes');
  });

  it('sin grupo igual avisa al dueño', async () => {
    const solo = await (async () => {
      const a = request.agent(server);
      await a.post('/auth/register').send({ email: 'solo@mail.com', password: 'claveSegura1' });
      await prisma.user.update({ where: { email: 'solo@mail.com' }, data: { emailVerifiedAt: new Date() } });
      return (await a.post('/profiles').send({ firstName: 'Solo', lastName: 'X', relationship: 'SELF', isMinor: false, consent })).body
        .publicToken;
    })();
    mailer.sent = [];
    expect((await emergency(solo).expect(201)).body).toEqual({ notified: 1, family: 0 });
  });

  it('token inexistente → 404 y ubicación inválida → 400', async () => {
    await emergency('AAAAAAAAAAAAAAAAAAAAAA').expect(404);
    await emergency(anaCard, { lat: 999, lng: 0 }).expect(400);
  });

  it('"Probar aviso": solo el admin, con prefijo [PRUEBA], y no bloquea un aviso real', async () => {
    await beto.post(`/family-groups/${groupId}/test-alert`).expect(403);
    const r = await ana.post(`/family-groups/${groupId}/test-alert`).expect(201);
    expect(r.body).toEqual({ notified: 3, family: 2 });
    expect(mailer.sent.every((m) => m.subject.startsWith('[PRUEBA]'))).toBe(true);
    expect(mailer.sent[0].text).toContain('Esto es una prueba, no pasó nada');
    mailer.sent = [];
    await emergency(anaCard).expect(201);
    expect(mailer.sent).toHaveLength(3);
  });

  it("dos toques simultáneos mandan una sola tanda de emails", async () => {
    const [r1, r2] = await Promise.all([emergency(anaCard), emergency(anaCard)]);
    expect([r1.status, r2.status]).toEqual([201, 201]);
    expect(mailer.sent).toHaveLength(3);
  });

  it("los miembros con email sin verificar no reciben avisos", async () => {
    await prisma.user.update({ where: { email: "caro@mail.com" }, data: { emailVerifiedAt: null } });
    await emergency(anaCard).expect(201);
    expect(recipients()).toEqual(["ana@mail.com", "beto@mail.com"]);
  });

  it("\"Probar aviso\" tiene una espera de 10 minutos por grupo", async () => {
    await ana.post(`/family-groups/${groupId}/test-alert`).expect(201);
    await ana.post(`/family-groups/${groupId}/test-alert`).expect(429, { error: "test_alert_cooldown" });
  });

  it("las ubicaciones de más de 30 días se borran (limpieza diaria)", async () => {
    await emergency(anaCard, { lat: -24.1, lng: -65.3 }).expect(201);
    await prisma.emergencyAlert.updateMany({ data: { createdAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000) } });
    await app.get(MaintenanceService).run();
    const old = await prisma.emergencyAlert.findFirstOrThrow({ where: { createdAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } });
    expect(old.lat).toBeNull();
    expect(old.lng).toBeNull();
  });
});

describe("aviso cuando falla el envío (e2e)", () => {
  it("si no se pudo mandar ningún email responde 503 y no bloquea el reintento", async () => {
    const broken = { send: async () => { throw new Error("Resend caído"); } };
    const app = await createTestApp({ mailer: broken });
    const prisma = app.get(PrismaService);
    await resetDb(prisma);
    const a = request.agent(app.getHttpServer());
    await a.post("/auth/register").send({ email: "x@mail.com", password: "claveSegura1" });
    await prisma.user.update({ where: { email: "x@mail.com" }, data: { emailVerifiedAt: new Date() } });
    const p = (await a.post("/profiles").send({ firstName: "X", lastName: "Y", relationship: "SELF", isMinor: false, consent })).body;
    await request(app.getHttpServer()).post(`/public/cards/${p.publicToken}/emergency`).send({}).expect(503, { error: "send_failed" });
    expect(await prisma.emergencyAlert.count()).toBe(0);
    await app.close();
  });
});
