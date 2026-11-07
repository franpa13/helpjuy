import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/shared/prisma/prisma.service.js';
import { createTestApp } from './helpers/app.js';
import { resetDb } from './helpers/db.js';
import { FakeCardCache } from './helpers/fake-card-cache.js';

type Agent = ReturnType<typeof request.agent>;
const consent = { version: '2026-11-07', accepted: true };
const own = { firstName: 'Ana', lastName: 'Paredes', relationship: 'SELF', isMinor: false, consent };
const kid = { ...own, firstName: 'Sofía', relationship: 'CHILD', isMinor: true, consent: { ...consent, guardianDeclared: true } };
const tokenOf = (url: string) => url.split('/unirme/')[1];

describe('tu cuenta: descargar datos y borrar (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cache: FakeCardCache;
  let server: any;
  let ana: Agent;
  let beto: Agent;

  const signup = async (email: string) => {
    const a = request.agent(server);
    await a.post('/auth/register').send({ email, password: 'claveSegura1' }).expect(201);
    await prisma.user.update({ where: { email }, data: { emailVerifiedAt: new Date() } });
    return a;
  };

  beforeEach(async () => {
    cache = new FakeCardCache();
    app = await createTestApp({ cardCache: cache });
    prisma = app.get(PrismaService);
    await resetDb(prisma);
    server = app.getHttpServer();
    ana = await signup('ana@mail.com');
    beto = await signup('beto@mail.com');
  });

  afterEach(async () => {
    await app.close();
  });

  describe('descargar mis datos', () => {
    it('pide sesión', async () => {
      await request(server).get('/account/export').expect(401);
    });

    it('trae la cuenta, las fichas descifradas, consentimientos, avisos y grupos', async () => {
      const p = (await ana.post('/profiles').send(own).expect(201)).body;
      const record = (await ana.get(`/profiles/${p.id}/record`)).body;
      await ana
        .put(`/profiles/${p.id}/record`)
        .send({ data: { ...record.data, allergies: [{ substance: 'Penicilina' }] }, visibility: record.visibility })
        .expect(200);
      const g = (await ana.post('/family-groups').send({ name: 'Familia Paredes' })).body;
      await request(server).post(`/public/cards/${p.publicToken}/emergency`).send({}).expect(201);

      const r = await ana.get('/account/export').expect(200);
      expect(r.headers['content-type']).toContain('application/json');
      expect(r.headers['content-disposition']).toMatch(/attachment; filename="helpjuy-mis-datos-\d{4}-\d{2}-\d{2}\.json"/);
      expect(r.headers['cache-control']).toContain('no-store');
      const data = JSON.parse(r.text);
      expect(data.account).toMatchObject({ email: 'ana@mail.com', emailVerified: true });
      expect(data.account).not.toHaveProperty('passwordHash');
      expect(data.profiles).toHaveLength(1);
      expect(data.profiles[0]).toMatchObject({ firstName: 'Ana', relationship: 'SELF' });
      expect(data.profiles[0].record.allergies).toEqual([expect.objectContaining({ substance: 'Penicilina' })]);
      expect(data.profiles[0].consents).toEqual([expect.objectContaining({ version: '2026-11-07' })]);
      expect(data.profiles[0].emergencyAlerts).toHaveLength(1);
      expect(data.familyGroups).toEqual([expect.objectContaining({ name: 'Familia Paredes', role: 'ADMIN' })]);
      expect(g.id).toBeDefined();
    });

    it('no incluye datos de otras personas', async () => {
      await beto.post('/profiles').send({ ...own, firstName: 'Beto' }).expect(201);
      const data = JSON.parse((await ana.get('/account/export')).text);
      expect(JSON.stringify(data)).not.toContain('Beto');
      expect(JSON.stringify(data)).not.toContain('beto@mail.com');
    });
  });

  describe('borrar la cuenta', () => {
    it('pide confirmación escrita', async () => {
      await ana.delete('/account').send({}).expect(400);
      await ana.delete('/account').send({ confirm: 'borrar' }).expect(400);
    });

    it('borra todo: cuenta, fichas, sesiones; la ficha pública deja de existir', async () => {
      const p = (await ana.post('/profiles').send(own).expect(201)).body;
      await ana.post('/profiles').send(kid).expect(201);
      const r = await ana.delete('/account').send({ confirm: 'BORRAR' }).expect(204);
      expect(r.headers['set-cookie']?.[0]).toMatch(/hj_session=;/);

      expect(await prisma.user.count({ where: { email: 'ana@mail.com' } })).toBe(0);
      expect(await prisma.profile.count()).toBe(0);
      expect(await prisma.session.count({ where: { user: { email: 'ana@mail.com' } } })).toBe(0);
      await request(server).get(`/public/cards/${p.publicToken}`).expect(404);
      expect(cache.calls.flat()).toContain(p.publicToken);
      await ana.get('/auth/me').expect(401);
    });

    it('en un grupo con más gente deja otro administrador; si quedaba sola, borra el grupo', async () => {
      const shared = (await ana.post('/family-groups').send({ name: 'Compartido' })).body;
      const alone = (await ana.post('/family-groups').send({ name: 'Sola' })).body;
      const url = (await ana.post(`/family-groups/${shared.id}/invites`).expect(201)).body.url;
      await beto.post(`/family-invites/${tokenOf(url)}/accept`).expect(200);

      await ana.delete('/account').send({ confirm: 'BORRAR' }).expect(204);

      const groups = (await beto.get('/family-groups')).body;
      expect(groups).toHaveLength(1);
      expect(groups[0]).toMatchObject({ name: 'Compartido', myRole: 'ADMIN' });
      expect(await prisma.familyGroup.count({ where: { id: alone.id } })).toBe(0);
    });
  });
});
