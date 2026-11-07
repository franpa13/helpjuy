import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { MaintenanceService } from '../src/features/maintenance/maintenance.service.js';
import { PrismaService } from '../src/shared/prisma/prisma.service.js';
import { createTestApp } from './helpers/app.js';
import { resetDb } from './helpers/db.js';

const DAY = 24 * 60 * 60 * 1000;
const ago = (days: number) => new Date(Date.now() - days * DAY);
const consent = { version: '2026-11-07', accepted: true };

describe('limpieza diaria (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: any;
  let userId: string;
  let profileId: string;

  beforeEach(async () => {
    process.env.MAINTENANCE_SECRET = 'mant-secret';
    app = await createTestApp();
    prisma = app.get(PrismaService);
    await resetDb(prisma);
    server = app.getHttpServer();
    const ana = request.agent(server);
    await ana.post('/auth/register').send({ email: 'ana@mail.com', password: 'claveSegura1' }).expect(201);
    userId = (await prisma.user.findUniqueOrThrow({ where: { email: 'ana@mail.com' } })).id;
    profileId = (await ana.post('/profiles').send({ firstName: 'Ana', lastName: 'P', relationship: 'SELF', isMinor: false, consent }).expect(201)).body.id;
  });

  afterEach(async () => {
    await app.close();
  });

  it('borra sesiones vencidas y deja las vigentes', async () => {
    await prisma.session.create({ data: { userId, tokenHash: 'vieja', expiresAt: ago(1) } });
    const before = await prisma.session.count();
    const r = await app.get(MaintenanceService).run();
    expect(r.sessions).toBe(1);
    expect(await prisma.session.count()).toBe(before - 1);
    expect(await prisma.session.count({ where: { tokenHash: 'vieja' } })).toBe(0);
  });

  it('borra tokens de email vencidos o ya usados hace más de un día', async () => {
    await prisma.emailToken.deleteMany();
    await prisma.emailToken.createMany({
      data: [
        { userId, tokenHash: 't-vencido', type: 'VERIFY_EMAIL', expiresAt: ago(1) },
        { userId, tokenHash: 't-usado', type: 'VERIFY_EMAIL', expiresAt: ago(-1), usedAt: ago(2) },
        { userId, tokenHash: 't-vigente', type: 'VERIFY_EMAIL', expiresAt: ago(-1) },
      ],
    });
    const r = await app.get(MaintenanceService).run();
    expect(r.emailTokens).toBe(2);
    expect((await prisma.emailToken.findMany()).map((t) => t.tokenHash)).toEqual(['t-vigente']);
  });

  it('borra invitaciones vencidas, usadas o canceladas', async () => {
    const group = await prisma.familyGroup.create({ data: { name: 'F', members: { create: { userId, role: 'ADMIN' } } } });
    await prisma.familyInvite.createMany({
      data: [
        { groupId: group.id, invitedById: userId, tokenHash: 'i-vencida', expiresAt: ago(1) },
        { groupId: group.id, invitedById: userId, tokenHash: 'i-usada', expiresAt: ago(-5), usedAt: ago(1) },
        { groupId: group.id, invitedById: userId, tokenHash: 'i-cancelada', expiresAt: ago(-5), revokedAt: ago(1) },
        { groupId: group.id, invitedById: userId, tokenHash: 'i-vigente', expiresAt: ago(-5) },
      ],
    });
    const r = await app.get(MaintenanceService).run();
    expect(r.invites).toBe(3);
    expect((await prisma.familyInvite.findMany()).map((i) => i.tokenHash)).toEqual(['i-vigente']);
  });

  it('borra la ubicación de los avisos de más de 30 días (el aviso queda)', async () => {
    await prisma.emergencyAlert.createMany({
      data: [
        { profileId, lat: -24.1, lng: -65.3, createdAt: ago(31) },
        { profileId, lat: -24.2, lng: -65.4, createdAt: ago(5) },
      ],
    });
    const r = await app.get(MaintenanceService).run();
    expect(r.locations).toBe(1);
    const rows = await prisma.emergencyAlert.findMany({ orderBy: { createdAt: 'asc' } });
    expect(rows.map((a) => a.lat)).toEqual([null, -24.2]);
  });

  it('borra los escaneos de más de 90 días', async () => {
    await prisma.cardScan.createMany({ data: [{ profileId, createdAt: ago(91) }, { profileId, createdAt: ago(10) }] });
    const r = await app.get(MaintenanceService).run();
    expect(r.scans).toBe(1);
    expect(await prisma.cardScan.count()).toBe(1);
  });

  it('se puede disparar desde afuera solo con el secreto', async () => {
    await request(server).post('/internal/maintenance').expect(401);
    await request(server).post('/internal/maintenance').set('x-maintenance-secret', 'otro').expect(401);
    const r = await request(server).post('/internal/maintenance').set('x-maintenance-secret', 'mant-secret').expect(200);
    expect(r.body).toEqual({ sessions: 0, emailTokens: 0, invites: 0, locations: 0, scans: 0 });
  });
});
