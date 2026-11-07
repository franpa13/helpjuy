import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/shared/prisma/prisma.service.js';
import { createTestApp } from './helpers/app.js';
import { resetDb } from './helpers/db.js';
import { FakeMailer } from './helpers/fake-mailer.js';

describe('endurecimiento (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let mailer: FakeMailer;
  let server: any;

  beforeEach(async () => {
    mailer = new FakeMailer();
    app = await createTestApp({ mailer });
    prisma = app.get(PrismaService);
    await resetDb(prisma);
    server = app.getHttpServer();
  });

  afterEach(async () => {
    await app.close();
  });

  it('las respuestas traen headers de seguridad y no dicen qué servidor es', async () => {
    const r = await request(server).get('/health').expect(200);
    expect(r.headers['x-content-type-options']).toBe('nosniff');
    expect(r.headers['x-frame-options']).toBe('DENY');
    expect(r.headers['referrer-policy']).toBe('no-referrer');
    expect(r.headers['x-powered-by']).toBeUndefined();
  });

  it('un JSON grande se rechaza en las rutas comunes (413)', async () => {
    const big = 'x'.repeat(200 * 1024);
    await request(server).post('/auth/login').send({ email: 'a@a.com', password: big }).expect(413);
  });

  it('la foto sí puede pesar más (hasta 3 MB)', async () => {
    const agent = request.agent(server);
    await agent.post('/auth/register').send({ email: 'ana@mail.com', password: 'claveSegura1' }).expect(201);
    const p = (
      await agent.post('/profiles').send({ firstName: 'Ana', lastName: 'P', relationship: 'SELF', isMinor: false, consent: { version: '2026-11-07', accepted: true } })
    ).body;
    // ~1 MB de base64 que no es una imagen: tiene que llegar al servidor (400 photo_invalid), no cortarse por tamaño.
    await agent.put(`/profiles/${p.id}/photo`).send({ image: Buffer.alloc(750 * 1024, 1).toString('base64') }).expect(400, { error: 'photo_invalid' });
  });

  describe('registro con un email que ya tiene cuenta', () => {
    beforeEach(async () => {
      await request(server).post('/auth/register').send({ email: 'ana@mail.com', password: 'claveSegura1' }).expect(201);
      mailer.sent = [];
    });

    it('responde que ya existe y le avisa por email al dueño real', async () => {
      await request(server).post('/auth/register').send({ email: 'ana@mail.com', password: 'otraClave123' }).expect(409, { error: 'email_taken' });
      expect(mailer.sent).toHaveLength(1);
      expect(mailer.sent[0].to).toBe('ana@mail.com');
      expect(mailer.sent[0].subject).toBe('Alguien intentó crear una cuenta con tu email');
      expect(mailer.sent[0].text).toContain('/recuperar');
    });

    it('como mucho un aviso por hora (no se puede usar para llenarle el correo a alguien)', async () => {
      await request(server).post('/auth/register').send({ email: 'ana@mail.com', password: 'otraClave123' }).expect(409);
      await request(server).post('/auth/register').send({ email: 'ana@mail.com', password: 'otraClave123' }).expect(409);
      expect(mailer.sent).toHaveLength(1);
    });
  });
});
