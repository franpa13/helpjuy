import { INestApplication } from '@nestjs/common';
import sharp from 'sharp';
import request from 'supertest';
import { PrismaService } from '../src/shared/prisma/prisma.service.js';
import { createTestApp } from './helpers/app.js';
import { resetDb } from './helpers/db.js';
import { FakeImageFetcher } from './helpers/fake-image-fetcher.js';

type Agent = ReturnType<typeof request.agent>;
const consent = { version: '2026-11-05', accepted: true };
const own = { firstName: 'Lucía', lastName: 'Mamani', relationship: 'SELF', isMinor: false, consent };
const kid = { ...own, firstName: 'Mateo', relationship: 'CHILD', isMinor: true, consent: { ...consent, guardianDeclared: true } };

/** Una foto "de celular": grande y con datos ocultos (EXIF), como las que trae la galería. */
async function phonePhoto(): Promise<string> {
  const buf = await sharp({ create: { width: 1200, height: 900, channels: 3, background: { r: 200, g: 120, b: 80 } } })
    .jpeg()
    .withExif({ IFD0: { Make: 'TelefonoX', Model: 'Modelo 1' } })
    .toBuffer();
  return buf.toString('base64');
}

const binary = (res: request.Response, cb: (err: Error | null, body: Buffer) => void) => {
  const chunks: Buffer[] = [];
  res.on('data', (c: Buffer) => chunks.push(c));
  res.on('end', () => cb(null, Buffer.concat(chunks)));
};

describe('foto de la ficha (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let fetcher: FakeImageFetcher;
  let server: any;
  let ana: Agent;
  let beto: Agent;
  let profile: { id: string; publicToken: string };

  beforeEach(async () => {
    fetcher = new FakeImageFetcher();
    app = await createTestApp({ imageFetcher: fetcher });
    prisma = app.get(PrismaService);
    await resetDb(prisma);
    server = app.getHttpServer();
    ana = request.agent(server);
    beto = request.agent(server);
    await ana.post('/auth/register').send({ email: 'ana@mail.com', password: 'claveSegura1' }).expect(201);
    await beto.post('/auth/register').send({ email: 'beto@mail.com', password: 'claveSegura1' }).expect(201);
    profile = (await ana.post('/profiles').send(own).expect(201)).body;
  });

  afterEach(async () => {
    await app.close();
  });

  it('sube la foto: queda cuadrada, chica, en webp y sin datos ocultos', async () => {
    const r = await ana.put(`/profiles/${profile.id}/photo`).send({ image: await phonePhoto() }).expect(200);
    expect(r.body.photoVersion).toEqual(expect.any(String));

    const img = await ana.get(`/profiles/${profile.id}/photo`).buffer(true).parse(binary).expect(200);
    expect(img.headers['content-type']).toBe('image/webp');
    expect(img.headers['cache-control']).toContain('no-store');
    const meta = await sharp(img.body as Buffer).metadata();
    expect(meta).toMatchObject({ format: 'webp', width: 320, height: 320 });
    expect(meta.exif).toBeUndefined();
  });

  it('se guarda cifrada en la base', async () => {
    await ana.put(`/profiles/${profile.id}/photo`).send({ image: await phonePhoto() }).expect(200);
    const row = await prisma.profile.findUniqueOrThrow({ where: { id: profile.id } });
    expect(row.photoCipher).toMatch(/^v1\./);
  });

  it('rechaza lo que no es una imagen', async () => {
    await ana
      .put(`/profiles/${profile.id}/photo`)
      .send({ image: Buffer.from('esto no es una foto').toString('base64') })
      .expect(400, { error: 'photo_invalid' });
  });

  it('nadie más puede ver ni cambiar la foto', async () => {
    await ana.put(`/profiles/${profile.id}/photo`).send({ image: await phonePhoto() }).expect(200);
    await beto.get(`/profiles/${profile.id}/photo`).expect(404);
    await beto.put(`/profiles/${profile.id}/photo`).send({ image: await phonePhoto() }).expect(404);
    await beto.delete(`/profiles/${profile.id}/photo`).expect(404);
  });

  it('en la ficha pública no se ve hasta que el titular la hace visible', async () => {
    await ana.put(`/profiles/${profile.id}/photo`).send({ image: await phonePhoto() }).expect(200);
    const card = await request(server).get(`/public/cards/${profile.publicToken}`).expect(200);
    expect(card.body).not.toHaveProperty('photoVersion');
    await request(server).get(`/public/cards/${profile.publicToken}/photo`).expect(404);

    const record = (await ana.get(`/profiles/${profile.id}/record`)).body;
    await ana.put(`/profiles/${profile.id}/record`).send({ data: record.data, visibility: { ...record.visibility, photo: true } }).expect(200);
    const visible = await request(server).get(`/public/cards/${profile.publicToken}`).expect(200);
    expect(visible.body.photoVersion).toEqual(expect.any(String));
    const img = await request(server).get(`/public/cards/${profile.publicToken}/photo`).expect(200);
    expect(img.headers['content-type']).toBe('image/webp');
    expect(img.headers['x-robots-tag']).toBe('noindex, nofollow');
  });

  it('quitar la foto la borra también de la ficha pública', async () => {
    await ana.put(`/profiles/${profile.id}/photo`).send({ image: await phonePhoto() }).expect(200);
    const record = (await ana.get(`/profiles/${profile.id}/record`)).body;
    await ana.put(`/profiles/${profile.id}/record`).send({ data: record.data, visibility: { ...record.visibility, photo: true } });
    await ana.delete(`/profiles/${profile.id}/photo`).expect(204);
    expect((await ana.get(`/profiles/${profile.id}`)).body.photoVersion).toBeNull();
    await request(server).get(`/public/cards/${profile.publicToken}/photo`).expect(404);
  });

  describe('foto de Google', () => {
    it('la copia a tu propia ficha (no queda un link a Google)', async () => {
      await prisma.user.update({ where: { email: 'ana@mail.com' }, data: { googlePictureUrl: 'https://lh3.googleusercontent.com/a/foto=s96-c' } });
      fetcher.image = Buffer.from(await phonePhoto(), 'base64');
      expect((await ana.get('/auth/me')).body.googlePhoto).toBe(true);
      const r = await ana.post(`/profiles/${profile.id}/photo/google`).expect(200);
      expect(r.body.photoVersion).toEqual(expect.any(String));
      // Pedimos la versión grande, no la miniatura de 96px.
      expect(fetcher.requested).toEqual(['https://lh3.googleusercontent.com/a/foto=s400-c']);
    });

    it('solo para tu propia ficha', async () => {
      await prisma.user.update({ where: { email: 'ana@mail.com' }, data: { googlePictureUrl: 'https://lh3.googleusercontent.com/a/foto=s96-c' } });
      const child = (await ana.post('/profiles').send(kid).expect(201)).body;
      await ana.post(`/profiles/${child.id}/photo/google`).expect(409, { error: 'photo_self_only' });
    });

    it('sin cuenta de Google no hay foto para copiar', async () => {
      expect((await ana.get('/auth/me')).body.googlePhoto).toBe(false);
      await ana.post(`/profiles/${profile.id}/photo/google`).expect(409, { error: 'google_photo_unavailable' });
    });

    it('nunca pide imágenes fuera de Google', async () => {
      await prisma.user.update({ where: { email: 'ana@mail.com' }, data: { googlePictureUrl: 'http://169.254.169.254/latest' } });
      await ana.post(`/profiles/${profile.id}/photo/google`).expect(409, { error: 'google_photo_unavailable' });
      expect(fetcher.requested).toEqual([]);
    });
  });

  it('una cuenta tiene un máximo de 10 fichas', async () => {
    for (let i = 0; i < 9; i++) await ana.post('/profiles').send({ ...kid, firstName: `Hijo ${i}` }).expect(201);
    await ana.post('/profiles').send({ ...kid, firstName: 'Uno más' }).expect(409, { error: 'profile_limit' });
  });
});
