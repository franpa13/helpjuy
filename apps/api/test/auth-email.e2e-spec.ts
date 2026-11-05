import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/shared/prisma/prisma.service.js';
import { createTestApp } from './helpers/app.js';
import { resetDb } from './helpers/db.js';
import { FakeMailer } from './helpers/fake-mailer.js';

const tokenFrom = (link: string) => new URL(link).searchParams.get('token');

describe('auth: verificación y recuperación (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: any;
  let agent: ReturnType<typeof request.agent>;
  let mailer: FakeMailer;

  beforeEach(async () => {
    mailer = new FakeMailer();
    app = await createTestApp({ mailer });
    prisma = app.get(PrismaService);
    await resetDb(prisma);
    server = app.getHttpServer();
    agent = request.agent(server);
  });

  afterEach(async () => {
    await app.close();
  });

  it('al registrarse se envía un link de verificación a /verificar', async () => {
    await agent.post('/auth/register').send({ email: 'v@v.com', password: 'claveSegura1' }).expect(201);
    expect(mailer.lastLinkTo('v@v.com')).toMatch(/^http:\/\/localhost:3000\/verificar\?token=/);
  });

  it('verifica el email con el link enviado', async () => {
    await agent.post('/auth/register').send({ email: 'v@v.com', password: 'claveSegura1' });
    const token = tokenFrom(mailer.lastLinkTo('v@v.com'));
    await request(server).post('/auth/verify-email').send({ token }).expect(204);
    expect((await agent.get('/auth/me')).body.emailVerified).toBe(true);
  });

  it('link de verificación reusado → 400 invalid_token', async () => {
    await agent.post('/auth/register').send({ email: 'v@v.com', password: 'claveSegura1' });
    const token = tokenFrom(mailer.lastLinkTo('v@v.com'));
    await request(server).post('/auth/verify-email').send({ token }).expect(204);
    await request(server).post('/auth/verify-email').send({ token }).expect(400, { error: 'invalid_token' });
  });

  it('link vencido → 400 invalid_token y el email sigue sin verificar', async () => {
    await agent.post('/auth/register').send({ email: 'v@v.com', password: 'claveSegura1' });
    const token = tokenFrom(mailer.lastLinkTo('v@v.com'));
    await prisma.emailToken.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    await request(server).post('/auth/verify-email').send({ token }).expect(400, { error: 'invalid_token' });
    expect((await agent.get('/auth/me')).body.emailVerified).toBe(false);
  });

  it('un token de reset no sirve para verificar el email', async () => {
    await agent.post('/auth/register').send({ email: 'v@v.com', password: 'claveSegura1' });
    await request(server).post('/auth/forgot-password').send({ email: 'v@v.com' });
    const token = tokenFrom(mailer.lastLinkTo('v@v.com'));
    await request(server).post('/auth/verify-email').send({ token }).expect(400, { error: 'invalid_token' });
  });

  it('resend-verification manda otro link (requiere sesión)', async () => {
    await request(server).post('/auth/resend-verification').expect(401);
    await agent.post('/auth/register').send({ email: 'v@v.com', password: 'claveSegura1' });
    await agent.post('/auth/resend-verification').expect(204);
    expect(mailer.sent.filter((m) => m.to === 'v@v.com')).toHaveLength(2);
  });

  it('forgot-password responde 204 aunque el email no exista y no manda mail', async () => {
    await request(server).post('/auth/forgot-password').send({ email: 'nadie@x.com' }).expect(204);
    expect(mailer.sent).toHaveLength(0);
  });

  it('reset cambia la contraseña y cierra todas las sesiones', async () => {
    await agent.post('/auth/register').send({ email: 'r@r.com', password: 'claveSegura1' });
    await request(server).post('/auth/forgot-password').send({ email: ' R@r.com' }).expect(204);
    const link = mailer.lastLinkTo('r@r.com');
    expect(link).toMatch(/\/restablecer\?token=/);
    await request(server)
      .post('/auth/reset-password')
      .send({ token: tokenFrom(link), password: 'nuevaClave99' })
      .expect(204);
    await agent.get('/auth/me').expect(401);
    await request(server).post('/auth/login').send({ email: 'r@r.com', password: 'claveSegura1' }).expect(401);
    await request(server).post('/auth/login').send({ email: 'r@r.com', password: 'nuevaClave99' }).expect(200);
  });

  it('link de reset reusado → 400 invalid_token', async () => {
    await agent.post('/auth/register').send({ email: 'r@r.com', password: 'claveSegura1' });
    await request(server).post('/auth/forgot-password').send({ email: 'r@r.com' });
    const token = tokenFrom(mailer.lastLinkTo('r@r.com'));
    await request(server).post('/auth/reset-password').send({ token, password: 'nuevaClave99' }).expect(204);
    await request(server)
      .post('/auth/reset-password')
      .send({ token, password: 'otraMas1234' })
      .expect(400, { error: 'invalid_token' });
  });
});
