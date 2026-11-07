import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/shared/prisma/prisma.service.js';
import { createTestApp } from './helpers/app.js';
import { resetDb } from './helpers/db.js';
import { FakeMailer } from './helpers/fake-mailer.js';

type Agent = ReturnType<typeof request.agent>;
const consent = { version: '2026-11-07', accepted: true };
const own = { firstName: 'Ana', lastName: 'Paredes', relationship: 'SELF', isMinor: false, consent };
const MIN = 60 * 1000;

describe('escaneos de la ficha (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let mailer: FakeMailer;
  let server: any;
  let ana: Agent;
  let card: { id: string; publicToken: string };

  const scan = (token = card.publicToken) => request(server).post(`/public/cards/${token}/scan`);
  const ageScans = (minutes: number) =>
    prisma.cardScan.updateMany({ data: { createdAt: new Date(Date.now() - minutes * MIN) } });

  beforeEach(async () => {
    mailer = new FakeMailer();
    app = await createTestApp({ mailer });
    prisma = app.get(PrismaService);
    await resetDb(prisma);
    server = app.getHttpServer();
    ana = request.agent(server);
    await ana.post('/auth/register').send({ email: 'ana@mail.com', password: 'claveSegura1' }).expect(201);
    await prisma.user.update({ where: { email: 'ana@mail.com' }, data: { emailVerifiedAt: new Date() } });
    card = (await ana.post('/profiles').send(own).expect(201)).body;
    mailer.sent = [];
  });

  afterEach(async () => {
    await app.close();
  });

  it('registra el escaneo y le avisa al titular por email', async () => {
    await scan().expect(204);
    expect(await prisma.cardScan.count()).toBe(1);
    expect(mailer.sent).toHaveLength(1);
    expect(mailer.sent[0].to).toBe('ana@mail.com');
    expect(mailer.sent[0].subject).toBe('Alguien abrió la ficha de Ana Paredes');
    expect(mailer.sent[0].text).toContain('QR nuevo');
  });

  it('no guarda IP ni nada de quien escaneó', async () => {
    await scan().set('x-forwarded-for', '200.1.2.3').expect(204);
    const row = await prisma.cardScan.findFirstOrThrow();
    expect(Object.keys(row).sort()).toEqual(['createdAt', 'id', 'profileId']);
  });

  it('si la abre el propio titular (con su sesión) no cuenta', async () => {
    await ana.post(`/public/cards/${card.publicToken}/scan`).expect(204);
    expect(await prisma.cardScan.count()).toBe(0);
    expect(mailer.sent).toHaveLength(0);
  });

  it('varios escaneos seguidos cuentan como uno', async () => {
    await scan().expect(204);
    await scan().expect(204);
    expect(await prisma.cardScan.count()).toBe(1);
  });

  it('como mucho un email por hora por ficha', async () => {
    await scan().expect(204);
    await ageScans(15);
    await scan().expect(204);
    expect(await prisma.cardScan.count()).toBe(2);
    expect(mailer.sent).toHaveLength(1);
    await prisma.profile.update({ where: { id: card.id }, data: { lastScanEmailAt: new Date(Date.now() - 61 * MIN) } });
    await ageScans(15);
    await scan().expect(204);
    expect(mailer.sent).toHaveLength(2);
  });

  it('sin email confirmado se registra pero no se manda email', async () => {
    await prisma.user.update({ where: { email: 'ana@mail.com' }, data: { emailVerifiedAt: null } });
    await scan().expect(204);
    expect(await prisma.cardScan.count()).toBe(1);
    expect(mailer.sent).toHaveLength(0);
  });

  it('un token que no existe responde 404', async () => {
    await scan('AAAAAAAAAAAAAAAAAAAAAA').expect(404);
    await scan('no-valido').expect(404);
  });

  it('el titular ve el historial de escaneos de sus fichas', async () => {
    await scan().expect(204);
    const r = await ana.get('/scans').expect(200);
    expect(r.body).toEqual([{ id: expect.any(String), at: expect.any(String), profileName: 'Ana Paredes' }]);
    const beto = request.agent(server);
    await beto.post('/auth/register').send({ email: 'beto@mail.com', password: 'claveSegura1' }).expect(201);
    expect((await beto.get('/scans')).body).toEqual([]);
  });

  it('el historial muestra solo los últimos 90 días (la limpieza diaria los borra)', async () => {
    await scan().expect(204);
    await ageScans(91 * 24 * 60);
    expect((await ana.get('/scans')).body).toEqual([]);
  });
});
