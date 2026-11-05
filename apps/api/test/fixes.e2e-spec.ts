import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { MailMessage, Mailer } from '../src/features/mail/mailer.js';
import { PrismaService } from '../src/shared/prisma/prisma.service.js';
import { createTestApp } from './helpers/app.js';
import { resetDb } from './helpers/db.js';

class BrokenMailer implements Mailer {
  async send(_msg: MailMessage): Promise<void> {
    throw new Error('Resend caído');
  }
}

const SECRET = 'test-proxy-secret';

describe('rate limit por cliente real detrás del proxy de la web (e2e)', () => {
  let app: INestApplication;
  let server: any;

  beforeEach(async () => {
    app = await createTestApp();
    await resetDb(app.get(PrismaService));
    server = app.getHttpServer();
  });

  afterEach(async () => {
    await app.close();
  });

  const login = (clientIp: string) =>
    request(server)
      .post('/auth/login')
      .set('x-proxy-secret', SECRET)
      .set('x-client-ip', clientIp)
      .send({ email: 'n@n.com', password: 'x' });

  it('dos usuarios distintos que llegan por la web no comparten el límite', async () => {
    for (let i = 0; i < 10; i++) await login('1.1.1.1').expect(401);
    await login('2.2.2.2').expect(401);
    await login('1.1.1.1').expect(429);
  });

  it('sin el secreto correcto se ignora x-client-ip (no se puede falsificar)', async () => {
    for (let i = 0; i < 10; i++) {
      await request(server)
        .post('/auth/login')
        .set('x-proxy-secret', 'otro')
        .set('x-client-ip', `9.9.9.${i}`)
        .send({ email: 'n@n.com', password: 'x' })
        .expect(401);
    }
    await request(server)
      .post('/auth/login')
      .set('x-client-ip', '8.8.8.8')
      .send({ email: 'n@n.com', password: 'x' })
      .expect(429);
  });

  it('GET /auth/me no tiene el límite estricto de 10 por minuto', async () => {
    const agent = request.agent(server);
    await agent.post('/auth/register').send({ email: 'm@m.com', password: 'claveSegura1' }).expect(201);
    for (let i = 0; i < 15; i++) await agent.get('/auth/me').expect(200);
  });
});

describe('si falla el envío de emails (e2e)', () => {
  let app: INestApplication;
  let server: any;

  beforeEach(async () => {
    app = await createTestApp({ mailer: new BrokenMailer() });
    await resetDb(app.get(PrismaService));
    server = app.getHttpServer();
  });

  afterEach(async () => {
    await app.close();
  });

  it('el registro igual termina bien y deja sesión', async () => {
    const agent = request.agent(server);
    await agent.post('/auth/register').send({ email: 'x@x.com', password: 'claveSegura1' }).expect(201);
    await agent.get('/auth/me').expect(200);
  });

  it('forgot-password sigue respondiendo 204 para un email existente', async () => {
    await request(server).post('/auth/register').send({ email: 'y@y.com', password: 'claveSegura1' });
    await request(server).post('/auth/forgot-password').send({ email: 'y@y.com' }).expect(204);
  });
});
