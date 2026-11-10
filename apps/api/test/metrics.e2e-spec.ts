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

  describe('lista de cuentas', () => {
    it('solo los administradores la ven', async () => {
      const ana = await signup('ana@mail.com');
      await request(server).get('/admin/accounts').expect(401);
      await ana.get('/admin/accounts').expect(404);
      const res = await admin.get('/admin/accounts').expect(200);
      expect(res.headers['cache-control']).toContain('no-store');
    });

    it('muestra cada cuenta, la más nueva primero, con su avance (sin datos médicos ni nombres de fichas)', async () => {
      const ana = await signup('ana@mail.com');
      const p = (await ana.post('/profiles').send(own('Anabel')).expect(201)).body;
      const rec = (await ana.get(`/profiles/${p.id}/record`)).body;
      await ana
        .put(`/profiles/${p.id}/record`)
        .send({ data: { ...rec.data, allergies: [{ substance: 'Penicilina' }], contacts: [{ name: 'Jorge', phone: '3884123456' }] }, visibility: rec.visibility })
        .expect(200);
      await prisma.profile.update({ where: { id: p.id }, data: { printedHash: 'x', printedAt: new Date() } });
      await prisma.user.update({ where: { email: 'ana@mail.com' }, data: { createdAt: new Date(Date.now() + 1000) } });

      const res = await admin.get('/admin/accounts').expect(200);
      expect(res.body).toMatchObject({ total: 2, page: 1, pageSize: 25, q: '' });
      expect(res.body.items[0]).toEqual({
        id: expect.any(String),
        email: 'ana@mail.com',
        createdAt: expect.any(String),
        emailVerified: false,
        google: false,
        password: true,
        profiles: 1,
        activeQr: true,
        printed: true,
        inFamily: false,
        lastLoginAt: expect.any(String),
      });
      expect(res.body.items[1]).toMatchObject({ email: 'admin@helpjuy.app', profiles: 0, activeQr: false });
      expect(res.text).not.toContain('Penicilina');
      expect(res.text).not.toContain('Anabel');
      expect(res.text).not.toContain('Jorge');
      expect(res.text).not.toContain('passwordHash');
    });

    it('busca por email y pagina de a 25', async () => {
      for (let i = 0; i < 26; i++) await prisma.user.create({ data: { email: `persona${i}@mail.com` } });
      await signup('beto@otro.com');

      const found = (await admin.get('/admin/accounts?q=OTRO.com').expect(200)).body;
      expect(found.total).toBe(1);
      expect(found.items.map((a: { email: string }) => a.email)).toEqual(['beto@otro.com']);

      const p1 = (await admin.get('/admin/accounts').expect(200)).body;
      const p2 = (await admin.get('/admin/accounts?page=2').expect(200)).body;
      expect(p1.total).toBe(28);
      expect(p1.items).toHaveLength(25);
      expect(p2.items).toHaveLength(3);
      await admin.get('/admin/accounts?page=0').expect(400);
      await admin.get(`/admin/accounts?q=${'x'.repeat(101)}`).expect(400);
    });
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
