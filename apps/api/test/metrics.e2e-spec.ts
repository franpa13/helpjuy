import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { MetricsService } from '../src/features/metrics/metrics.service.js';
import { PrismaService } from '../src/shared/prisma/prisma.service.js';
import { createTestApp } from './helpers/app.js';
import { resetDb } from './helpers/db.js';

type Agent = ReturnType<typeof request.agent>;
const consent = { version: '2026-11-07', accepted: true };
const own = (firstName: string) => ({ firstName, lastName: 'Paredes', relationship: 'SELF', isMinor: false, consent });

describe('métricas (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: any;
  let admin: Agent;

  const signup = async (email: string) => {
    const a = request.agent(server);
    await a.post('/auth/register').send({ email, password: 'claveSegura1' }).expect(201);
    return a;
  };

  beforeEach(async () => {
    process.env.ADMIN_EMAILS = 'Admin@HelpJuy.app, otra@mail.com';
    app = await createTestApp();
    prisma = app.get(PrismaService);
    await resetDb(prisma);
    server = app.getHttpServer();
    admin = await signup('admin@helpjuy.app');
  });

  afterEach(async () => {
    await app.close();
  });

  it('solo los administradores las ven (al resto, 404: ni se enteran de que existen)', async () => {
    const ana = await signup('ana@mail.com');
    await request(server).get('/admin/metrics').expect(401);
    await ana.get('/admin/metrics').expect(404);
    await admin.get('/admin/metrics').expect(200);
    expect((await admin.get('/auth/me')).body.admin).toBe(true);
    expect((await ana.get('/auth/me')).body.admin).toBe(false);
  });

  it('cuenta el embudo: cuenta → ficha → QR activo → impresa → escaneada', async () => {
    // Ana completa todo; Beto crea la ficha y nada más; Caro solo se registra.
    const ana = await signup('ana@mail.com');
    const beto = await signup('beto@mail.com');
    await signup('caro@mail.com');
    const p = (await ana.post('/profiles').send(own('Ana')).expect(201)).body;
    await beto.post('/profiles').send(own('Beto')).expect(201);
    const rec = (await ana.get(`/profiles/${p.id}/record`)).body;
    await ana
      .put(`/profiles/${p.id}/record`)
      .send({ data: { ...rec.data, contacts: [{ name: 'Jorge', phone: '3884123456' }] }, visibility: rec.visibility })
      .expect(200);
    await prisma.profile.update({ where: { id: p.id }, data: { printedHash: 'x', printedAt: new Date() } });
    await request(server).post(`/public/cards/${p.publicToken}/scan`).expect(204);
    await request(server).post(`/public/cards/${p.publicToken}/emergency`).send({}).expect(201);

    const m = (await admin.get('/admin/metrics').expect(200)).body;
    expect(m.funnel).toEqual([
      { step: 'accounts', count: 4 },
      { step: 'withProfile', count: 2 },
      { step: 'activeQr', count: 1 },
      { step: 'printed', count: 1 },
      { step: 'scanned', count: 1 },
    ]);
    expect(m.totals).toMatchObject({ accounts: 4, profiles: 2, scans30d: 1, alerts30d: 1, familyGroups: 0 });
    expect(m.weekly).toHaveLength(8);
    expect(m.weekly.at(-1)).toMatchObject({ signups: 4, scans: 1 });
  });

  it('no trae datos de nadie: solo números', async () => {
    const ana = await signup('ana@mail.com');
    await ana.post('/profiles').send(own('Ana')).expect(201);
    const text = (await admin.get('/admin/metrics')).text;
    expect(text).not.toContain('ana@mail.com');
    expect(text).not.toContain('Ana');
    expect(text).not.toContain('Paredes');
  });

  it('guarda una foto diaria de los totales (para ver la evolución aunque se borren cosas)', async () => {
    await app.get(MetricsService).snapshot();
    await app.get(MetricsService).snapshot(); // el mismo día se pisa, no se duplica
    const rows = await prisma.metricsSnapshot.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0].data).toMatchObject({ accounts: 1, profiles: 0 });
    const m = (await admin.get('/admin/metrics')).body;
    expect(m.history).toEqual([expect.objectContaining({ day: expect.any(String), accounts: 1 })]);
  });
});
