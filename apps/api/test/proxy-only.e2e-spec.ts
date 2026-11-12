import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/shared/prisma/prisma.service.js';
import { createTestApp } from './helpers/app.js';
import { resetDb } from './helpers/db.js';

const SECRET = 'secreto-de-la-web';

describe('la API solo atiende a la web (e2e)', () => {
  let app: INestApplication;
  let server: any;

  beforeEach(async () => {
    process.env.REQUIRE_PROXY_SECRET = 'true';
    process.env.PROXY_SECRET = SECRET;
    process.env.MAINTENANCE_SECRET = 'secreto-del-cron';
    app = await createTestApp();
    await resetDb(app.get(PrismaService));
    server = app.getHttpServer();
  });

  afterEach(async () => {
    delete process.env.REQUIRE_PROXY_SECRET;
    delete process.env.PROXY_SECRET;
    delete process.env.MAINTENANCE_SECRET;
    await app.close();
  });

  it('directo, sin el secreto de la web: 404 (ni registro, ni login, ni fichas)', async () => {
    const res = await request(server).post('/auth/register').send({ email: 'ana@mail.com', password: 'claveSegura1' }).expect(404);
    expect(res.body).toEqual({ error: 'not_found' });
    await request(server).post('/auth/login').send({ email: 'ana@mail.com', password: 'claveSegura1' }).expect(404);
    await request(server).get('/public/cards/AAAAAAAAAAAAAAAAAAAAAA').expect(404);
    await request(server).get('/auth/google').expect(404);
    await request(server).get('/auth/me').set('x-proxy-secret', 'otro').expect(404);
  });

  it('desde la web (con el secreto) funciona normal', async () => {
    await request(server)
      .post('/auth/register')
      .set('x-proxy-secret', SECRET)
      .set('x-client-ip', '200.1.2.3')
      .send({ email: 'ana@mail.com', password: 'claveSegura1' })
      .expect(201);
  });

  it('los crons siguen entrando directo: /health y el mantenimiento (que tiene su propio secreto)', async () => {
    await request(server).get('/health').expect(200);
    await request(server).post('/internal/maintenance').expect(401);
    await request(server).post('/internal/maintenance').set('x-maintenance-secret', 'secreto-del-cron').expect(200);
  });
});

describe('sin REQUIRE_PROXY_SECRET (desarrollo y tests)', () => {
  it('atiende directo', async () => {
    const app = await createTestApp();
    await request(app.getHttpServer()).get('/consent/current').expect(200);
    await app.close();
  });
});
