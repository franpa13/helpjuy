import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DEFAULT_VISIBILITY } from '@helpjuy/contracts';
import { PrismaService } from '../src/shared/prisma/prisma.service.js';
import { createTestApp } from './helpers/app.js';
import { resetDb } from './helpers/db.js';

type Agent = ReturnType<typeof request.agent>;
const profileBody = (firstName: string) => ({
  firstName,
  lastName: 'Paredes',
  relationship: 'SELF',
  isMinor: false,
  consent: { version: '2026-11-05', accepted: true },
});
const tokenOf = (url: string) => url.split('/unirme/')[1];

describe('grupos familiares (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: any;
  let ana: Agent;
  let beto: Agent;
  let caro: Agent;

  const signup = async (email: string, name: string) => {
    const a = request.agent(server);
    await a.post('/auth/register').send({ email, password: 'claveSegura1' }).expect(201);
    await a.post('/profiles').send(profileBody(name)).expect(201);
    return a;
  };
  const invite = async (agent: Agent, groupId: string) =>
    tokenOf((await agent.post(`/family-groups/${groupId}/invites`).expect(201)).body.url);

  beforeEach(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    await resetDb(prisma);
    server = app.getHttpServer();
    ana = await signup('ana@mail.com', 'Ana');
    beto = await signup('beto@mail.com', 'Beto');
    caro = await signup('caro@mail.com', 'Caro');
  });

  afterEach(async () => {
    await app.close();
  });

  it('crear un grupo deja al creador como ADMIN y único miembro', async () => {
    const g = (await ana.post('/family-groups').send({ name: 'Familia Paredes' }).expect(201)).body;
    expect(g).toMatchObject({ name: 'Familia Paredes', myRole: 'ADMIN', muted: false });
    expect(g.members).toEqual([expect.objectContaining({ name: 'Ana Paredes', role: 'ADMIN', isMe: true })]);
    expect((await ana.get('/family-groups').expect(200)).body).toHaveLength(1);
  });

  it('invitar → vista previa pública → aceptar', async () => {
    const g = (await ana.post('/family-groups').send({ name: 'Familia Paredes' })).body;
    const created = (await ana.post(`/family-groups/${g.id}/invites`).expect(201)).body;
    expect(created.url).toMatch(/^http:\/\/localhost:3000\/unirme\/[A-Za-z0-9_-]{43}$/);
    const token = tokenOf(created.url);
    const preview = await request(server).get(`/family-invites/${token}`).expect(200);
    expect(preview.body).toEqual({ groupName: 'Familia Paredes', inviterName: 'Ana Paredes', memberCount: 1 });
    const joined = (await beto.post(`/family-invites/${token}/accept`).expect(200)).body;
    expect(joined.members.map((m: { name: string }) => m.name)).toEqual(['Ana Paredes', 'Beto Paredes']);
    expect(joined.myRole).toBe('MEMBER');
  });

  it('invitación reusada, vencida o cancelada → 400 invalid_token', async () => {
    const g = (await ana.post('/family-groups').send({ name: 'F' })).body;
    const t1 = await invite(ana, g.id);
    await beto.post(`/family-invites/${t1}/accept`).expect(200);
    await caro.post(`/family-invites/${t1}/accept`).expect(400, { error: 'invalid_token' });

    const t2 = await invite(ana, g.id);
    await prisma.familyInvite.updateMany({ where: { usedAt: null }, data: { expiresAt: new Date(Date.now() - 1000) } });
    await caro.post(`/family-invites/${t2}/accept`).expect(400, { error: 'invalid_token' });
    await request(server).get(`/family-invites/${t2}`).expect(400, { error: 'invalid_token' });

    await invite(ana, g.id);
    const pending = (await ana.get(`/family-groups/${g.id}/invites`).expect(200)).body;
    expect(pending).toHaveLength(1);
    await ana.delete(`/family-groups/${g.id}/invites/${pending[0].id}`).expect(204);
    expect((await ana.get(`/family-groups/${g.id}/invites`)).body).toHaveLength(0);
  });

  it('aceptar estando ya en el grupo no duplica al miembro ni gasta la invitación', async () => {
    const g = (await ana.post('/family-groups').send({ name: 'F' })).body;
    await beto.post(`/family-invites/${await invite(ana, g.id)}/accept`).expect(200);
    const t = await invite(ana, g.id);
    const again = await beto.post(`/family-invites/${t}/accept`).expect(200);
    expect(again.body.members).toHaveLength(2);
    await caro.post(`/family-invites/${t}/accept`).expect(200);
  });

  it('a los demás no se les muestra el nombre de un hijo ni el email', async () => {
    const g = (await ana.post('/family-groups').send({ name: 'F' })).body;
    const sinFicha = request.agent(server);
    await sinFicha.post('/auth/register').send({ email: 'juan.perez1985@mail.com', password: 'claveSegura1' });
    // No puede tener la ficha de un hijo sin la propia: no tiene ninguna, y tampoco se muestra su email.
    await sinFicha.post('/profiles').send({ ...profileBody('Sofía'), relationship: 'CHILD', isMinor: true, consent: { version: '2026-11-05', accepted: true, guardianDeclared: true } }).expect(409);
    await sinFicha.post(`/family-invites/${await invite(ana, g.id)}/accept`).expect(200);
    const names = (await ana.get('/family-groups')).body[0].members.map((m: { name: string }) => m.name);
    expect(names).toEqual(['Ana Paredes', 'Miembro sin ficha propia']);
  });

  it('estar en el grupo NO da acceso a la ficha de otro miembro', async () => {
    const g = (await ana.post('/family-groups').send({ name: 'F' })).body;
    await beto.post(`/family-invites/${await invite(ana, g.id)}/accept`).expect(200);
    const anaProfile = (await ana.get('/profiles')).body[0];
    await ana
      .put(`/profiles/${anaProfile.id}/record`)
      .send({ data: { allergies: [{ substance: 'Penicilina' }] }, visibility: DEFAULT_VISIBILITY })
      .expect(200);
    await beto.get(`/profiles/${anaProfile.id}/record`).expect(404);
    await beto.get(`/profiles/${anaProfile.id}`).expect(404);
  });

  it('solo el admin invita, renombra, saca miembros y borra el grupo', async () => {
    const g = (await ana.post('/family-groups').send({ name: 'F' })).body;
    await beto.post(`/family-invites/${await invite(ana, g.id)}/accept`).expect(200);
    await beto.post(`/family-groups/${g.id}/invites`).expect(403, { error: 'forbidden' });
    await beto.patch(`/family-groups/${g.id}`).send({ name: 'X' }).expect(403);
    await beto.delete(`/family-groups/${g.id}`).expect(403);
    const anaId = (await ana.get('/auth/me')).body.id;
    await beto.delete(`/family-groups/${g.id}/members/${anaId}`).expect(403);
    await ana.patch(`/family-groups/${g.id}`).send({ name: 'Familia P.' }).expect(200);
  });

  it('un grupo ajeno → 404', async () => {
    const g = (await ana.post('/family-groups').send({ name: 'F' })).body;
    await caro.get(`/family-groups/${g.id}/invites`).expect(404, { error: 'not_found' });
    await caro.patch(`/family-groups/${g.id}`).send({ name: 'X' }).expect(404);
  });

  it('cualquier miembro puede salir y silenciar', async () => {
    const g = (await ana.post('/family-groups').send({ name: 'F' })).body;
    await beto.post(`/family-invites/${await invite(ana, g.id)}/accept`).expect(200);
    const muted = (await beto.patch(`/family-groups/${g.id}/me`).send({ muted: true }).expect(200)).body;
    expect(muted.muted).toBe(true);
    const betoId = (await beto.get('/auth/me')).body.id;
    await beto.delete(`/family-groups/${g.id}/members/${betoId}`).expect(204);
    expect((await beto.get('/family-groups')).body).toHaveLength(0);
  });

  it('si sale el único admin, el miembro más antiguo pasa a ser admin', async () => {
    const g = (await ana.post('/family-groups').send({ name: 'F' })).body;
    await beto.post(`/family-invites/${await invite(ana, g.id)}/accept`).expect(200);
    await caro.post(`/family-invites/${await invite(ana, g.id)}/accept`).expect(200);
    const anaId = (await ana.get('/auth/me')).body.id;
    await ana.delete(`/family-groups/${g.id}/members/${anaId}`).expect(204);
    const seen = (await beto.get('/family-groups')).body[0];
    expect(seen.myRole).toBe('ADMIN');
    expect(seen.members).toHaveLength(2);
  });

  it('si sale el último miembro, el grupo se borra', async () => {
    const g = (await ana.post('/family-groups').send({ name: 'F' })).body;
    const anaId = (await ana.get('/auth/me')).body.id;
    await ana.delete(`/family-groups/${g.id}/members/${anaId}`).expect(204);
    expect(await prisma.familyGroup.count()).toBe(0);
  });

  it('nombre vacío → 400', async () => {
    await ana.post('/family-groups').send({ name: '  ' }).expect(400);
  });
});
