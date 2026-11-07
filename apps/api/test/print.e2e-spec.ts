import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createHash } from 'node:crypto';
import { DEFAULT_VISIBILITY, printFingerprintInput, printableData, type MedicalRecordResponse } from '@helpjuy/contracts';
import { PrismaService } from '../src/shared/prisma/prisma.service.js';
import { createTestApp } from './helpers/app.js';
import { resetDb } from './helpers/db.js';

const consent = { version: '2026-11-07', accepted: true };
const base = {
  allergies: [{ substance: 'Penicilina' }],
  bloodType: 'A+',
  contacts: [{ name: 'Jorge', phone: '3884123456' }],
};

describe('estado de impresión del QR (e2e)', () => {
  let app: INestApplication;
  let ana: ReturnType<typeof request.agent>;
  let id: string;

  const save = (data: object, visibility = DEFAULT_VISIBILITY) =>
    ana.put(`/profiles/${id}/record`).send({ data, visibility }).expect(200);
  /** La huella de lo que la página está mostrando (la web la calcula igual). */
  const shown = async () => {
    const p = (await ana.get(`/profiles/${id}`)).body;
    const r = (await ana.get(`/profiles/${id}/record`)).body as MedicalRecordResponse;
    return createHash('sha256').update(printFingerprintInput(p.publicToken, printableData(p, r.data, r.visibility))).digest('hex');
  };
  const markPrinted = async () => {
    const fingerprint = await shown();
    const res = await ana.post(`/profiles/${id}/printed`).send({ fingerprint });
    return { status: res.status, body: res.body };
  };
  const status = async () => (await ana.get(`/profiles/${id}`).expect(200)).body.printStatus;

  beforeEach(async () => {
    app = await createTestApp();
    await resetDb(app.get(PrismaService));
    ana = request.agent(app.getHttpServer());
    await ana.post('/auth/register').send({ email: 'ana@mail.com', password: 'claveSegura1' });
    id = (await ana.post('/profiles').send({ firstName: 'Ana', lastName: 'P', relationship: 'SELF', isMinor: false, consent })).body.id;
    await save(base);
  });

  afterEach(async () => {
    await app.close();
  });

  it('nunca impreso → never; al marcar impreso → ok', async () => {
    expect(await status()).toBe('never');
    const r = await markPrinted();
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ printStatus: 'ok', printedAt: expect.any(String) });
    expect(await status()).toBe('ok');
  });

  it('cambiar una alergia impresa → outdated', async () => {
    expect((await markPrinted()).status).toBe(200);
    await save({ ...base, allergies: [{ substance: 'Penicilina' }, { substance: 'Látex' }] });
    expect(await status()).toBe('outdated');
  });

  it('rotar el QR → outdated', async () => {
    expect((await markPrinted()).status).toBe(200);
    await ana.post(`/profiles/${id}/rotate-token`).expect(200);
    expect(await status()).toBe('outdated');
  });

  it('un cambio que no va impreso (obra social) no pide reimprimir', async () => {
    expect((await markPrinted()).status).toBe(200);
    await save({ ...base, insurance: { name: 'ISJ' } });
    expect(await status()).toBe('ok');
  });

  it('ocultar una sección impresa → outdated', async () => {
    expect((await markPrinted()).status).toBe(200);
    await save(base, { ...DEFAULT_VISIBILITY, allergies: false });
    expect(await status()).toBe('outdated');
  });

  it('perfil ajeno → 404', async () => {
    const bob = request.agent(app.getHttpServer());
    await bob.post('/auth/register').send({ email: 'bob@mail.com', password: 'claveSegura1' });
    await bob.post(`/profiles/${id}/printed`).send({ fingerprint: '0'.repeat(64) }).expect(404);
  });

  it("si los datos cambiaron mientras se imprimía → 409 y no se marca", async () => {
    const stale = await shown();
    await save({ ...base, allergies: [{ substance: "Látex" }] });
    await ana.post(`/profiles/${id}/printed`).send({ fingerprint: stale }).expect(409, { error: "print_outdated" });
    expect(await status()).toBe("never");
  });

  it("sin huella → 400", async () => {
    await ana.post(`/profiles/${id}/printed`).send({}).expect(400);
  });

  it("cambiar el nombre → outdated; cambiar el segundo contacto → sigue ok", async () => {
    await save({ ...base, contacts: [...base.contacts, { name: "Rosa", phone: "3884000000" }] });
    expect((await markPrinted()).status).toBe(200);
    await save({ ...base, contacts: [...base.contacts, { name: "Rosa", phone: "3884999999" }] });
    expect(await status()).toBe("ok");
    await ana.patch(`/profiles/${id}`).send({ firstName: "Anabel" }).expect(200);
    expect(await status()).toBe("outdated");
  });
});
