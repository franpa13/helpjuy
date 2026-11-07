import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/shared/prisma/prisma.service.js';
import { createTestApp } from './helpers/app.js';
import { resetDb } from './helpers/db.js';

describe('auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: any;
  let agent: ReturnType<typeof request.agent>;

  beforeEach(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    await resetDb(prisma);
    server = app.getHttpServer();
    agent = request.agent(server);
  });

  afterEach(async () => {
    await app.close();
  });

  it('registra y deja sesión', async () => {
    const res = await agent
      .post('/auth/register')
      .send({ email: 'juan@mail.com', password: 'claveSegura1' })
      .expect(201);
    expect(res.body).toEqual({ id: expect.any(String), email: 'juan@mail.com', emailVerified: false, googlePhoto: false });
    expect(res.headers['set-cookie'][0]).toMatch(/hj_session=.+;.*HttpOnly/i);
    expect(res.headers['set-cookie'][0]).toMatch(/SameSite=Lax/i);
    await agent.get('/auth/me').expect(200);
  });

  it('guarda solo el hash del token de sesión', async () => {
    const res = await agent.post('/auth/register').send({ email: 'h@h.com', password: 'claveSegura1' });
    const token = /hj_session=([^;]+)/.exec(res.headers['set-cookie'][0])![1];
    const session = await prisma.session.findFirstOrThrow();
    expect(session.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(session.tokenHash).not.toBe(token);
  });

  it('normaliza el email: " Juan@Mail.com " es la misma cuenta', async () => {
    await agent.post('/auth/register').send({ email: 'juan@mail.com', password: 'claveSegura1' }).expect(201);
    await request(server)
      .post('/auth/register')
      .send({ email: ' Juan@Mail.com ', password: 'otraClave12' })
      .expect(409, { error: 'email_taken' });
    await request(server).post('/auth/login').send({ email: ' JUAN@mail.com', password: 'claveSegura1' }).expect(200);
  });

  it('credenciales inválidas → 401 genérico', async () => {
    await request(server)
      .post('/auth/login')
      .send({ email: 'nadie@mail.com', password: 'x' })
      .expect(401, { error: 'invalid_credentials' });
    await agent.post('/auth/register').send({ email: 'j@j.com', password: 'claveSegura1' });
    await request(server)
      .post('/auth/login')
      .send({ email: 'j@j.com', password: 'incorrecta1' })
      .expect(401, { error: 'invalid_credentials' });
  });

  it('contraseña de 7 caracteres → 400 validation', async () => {
    const r = await request(server).post('/auth/register').send({ email: 'a@b.com', password: '1234567' }).expect(400);
    expect(r.body.error).toBe('validation');
  });

  it('logout invalida la sesión', async () => {
    await agent.post('/auth/register').send({ email: 'x@x.com', password: 'claveSegura1' });
    await agent.post('/auth/logout').expect(204);
    await agent.get('/auth/me').expect(401, { error: 'unauthenticated' });
  });

  it('sesión vencida → 401', async () => {
    await agent.post('/auth/register').send({ email: 'v@v.com', password: 'claveSegura1' });
    await prisma.session.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    await agent.get('/auth/me').expect(401);
  });

  it('sin cookie → 401', async () => {
    await request(server).get('/auth/me').expect(401, { error: 'unauthenticated' });
  });

  it('rate limit: la 11ª solicitud de login en un minuto → 429', async () => {
    for (let i = 0; i < 10; i++) {
      await request(server).post('/auth/login').send({ email: 'n@n.com', password: 'x' }).expect(401);
    }
    await request(server).post('/auth/login').send({ email: 'n@n.com', password: 'x' }).expect(429);
  });
});
