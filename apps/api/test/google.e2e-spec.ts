import { INestApplication } from '@nestjs/common';
import { createHash } from 'node:crypto';
import request from 'supertest';
import { PrismaService } from '../src/shared/prisma/prisma.service.js';
import { createTestApp } from './helpers/app.js';
import { resetDb } from './helpers/db.js';
import { FakeGoogleOAuth } from './helpers/fake-google.js';
import { FakeMailer } from './helpers/fake-mailer.js';

const cookieValue = (res: request.Response, name: string) =>
  ([] as string[]).concat(res.headers['set-cookie'] ?? []).find((c) => c.startsWith(`${name}=`));

describe('ingreso con Google (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let google: FakeGoogleOAuth;
  let mailer: FakeMailer;

  beforeEach(async () => {
    google = new FakeGoogleOAuth();
    mailer = new FakeMailer();
    app = await createTestApp({ google, mailer });
    prisma = app.get(PrismaService);
    await resetDb(prisma);
    google.identities.set('code-juan', { sub: 'g-123', email: 'Juan@Gmail.com', emailVerified: true });
  });

  afterEach(async () => {
    await app.close();
  });

  /** Hace el ida y vuelta completo con un agente (que guarda cookies) y devuelve la respuesta del callback. */
  async function roundTrip(agent: ReturnType<typeof request.agent>, code: string, next?: string) {
    const start = await agent.get(`/auth/google${next ? `?next=${encodeURIComponent(next)}` : ''}`).expect(302);
    const state = new URL(start.headers.location).searchParams.get('state')!;
    return agent.get(`/auth/google/callback?code=${code}&state=${state}`);
  }

  it('redirige a Google con state y PKCE, y guarda el verificador en una cookie temporal', async () => {
    const res = await request(app.getHttpServer()).get('/auth/google').expect(302);
    const url = new URL(res.headers.location);
    expect(url.hostname).toBe('accounts.google.test');
    expect(url.searchParams.get('state')).toMatch(/^[A-Za-z0-9_-]{20,}$/);
    expect(url.searchParams.get('redirect_uri')).toBe('http://localhost:3000/api/auth/google/callback');
    expect(cookieValue(res, 'hj_oauth')).toMatch(/HttpOnly/i);
    expect(google.lastChallenge).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('usuario nuevo: crea la cuenta verificada, abre sesión y va al panel', async () => {
    const agent = request.agent(app.getHttpServer());
    const res = await roundTrip(agent, 'code-juan');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/panel');
    expect(cookieValue(res, 'hj_session')).toBeDefined();
    const me = await agent.get('/auth/me').expect(200);
    expect(me.body).toMatchObject({ email: 'juan@gmail.com', emailVerified: true });
    const user = await prisma.user.findUniqueOrThrow({ where: { email: 'juan@gmail.com' } });
    expect(user.googleId).toBe('g-123');
    expect(user.passwordHash).toBeNull();
  });

  it('el verificador PKCE que se usa al canjear corresponde al challenge enviado', async () => {
    await roundTrip(request.agent(app.getHttpServer()), 'code-juan');
    const challenge = createHash('sha256').update(google.lastVerifier!).digest('base64url');
    expect(challenge).toBe(google.lastChallenge);
  });

  it('state distinto (posible ataque) → vuelve a ingresar con error y sin sesión', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent.get('/auth/google').expect(302);
    const res = await agent.get('/auth/google/callback?code=code-juan&state=otro-state-que-no-es').expect(302);
    expect(res.headers.location).toBe('/ingresar?error=google');
    expect(cookieValue(res, 'hj_session')).toBeUndefined();
    expect(await prisma.user.count()).toBe(0);
  });

  it('sin la cookie temporal (callback directo) → error', async () => {
    const res = await request(app.getHttpServer()).get('/auth/google/callback?code=code-juan&state=x').expect(302);
    expect(res.headers.location).toBe('/ingresar?error=google');
  });

  it('Google con email no verificado → error específico', async () => {
    google.identities.set('code-sin-verificar', { sub: 'g-9', email: 'x@gmail.com', emailVerified: false });
    const res = await roundTrip(request.agent(app.getHttpServer()), 'code-sin-verificar');
    expect(res.headers.location).toBe('/ingresar?error=google_email');
    expect(await prisma.user.count()).toBe(0);
  });

  it('cuenta existente con email verificado: se vincula y la contraseña sigue sirviendo', async () => {
    const server = app.getHttpServer();
    await request(server).post('/auth/register').send({ email: 'juan@gmail.com', password: 'claveSegura1' });
    await prisma.user.update({ where: { email: 'juan@gmail.com' }, data: { emailVerifiedAt: new Date() } });
    await roundTrip(request.agent(server), 'code-juan');
    expect(await prisma.user.count()).toBe(1);
    const user = await prisma.user.findUniqueOrThrow({ where: { email: 'juan@gmail.com' } });
    expect(user.googleId).toBe('g-123');
    await request(server).post('/auth/login').send({ email: 'juan@gmail.com', password: 'claveSegura1' }).expect(200);
  });

  it('cuenta existente SIN verificar: al vincular se borra esa contraseña y se cierran sus sesiones', async () => {
    const server = app.getHttpServer();
    const intruder = request.agent(server);
    await intruder.post('/auth/register').send({ email: 'juan@gmail.com', password: 'claveDelIntruso' }).expect(201);
    await roundTrip(request.agent(server), 'code-juan');
    await intruder.get('/auth/me').expect(401);
    await request(server).post('/auth/login').send({ email: 'juan@gmail.com', password: 'claveDelIntruso' }).expect(401);
    const user = await prisma.user.findUniqueOrThrow({ where: { email: 'juan@gmail.com' } });
    expect(user.emailVerifiedAt).not.toBeNull();
  });

  it('respeta next interno y descarta uno externo', async () => {
    let res = await roundTrip(request.agent(app.getHttpServer()), 'code-juan', '/panel/perfiles/nuevo');
    expect(res.headers.location).toBe('/panel/perfiles/nuevo');
    res = await roundTrip(request.agent(app.getHttpServer()), 'code-juan', '//evil.com');
    expect(res.headers.location).toBe('/panel');
  });

  it('un código inválido → error y sin sesión', async () => {
    const res = await roundTrip(request.agent(app.getHttpServer()), 'code-que-no-existe');
    expect(res.headers.location).toBe('/ingresar?error=google');
  });

  it('el usuario nuevo por Google no recibe email de verificación', async () => {
    await roundTrip(request.agent(app.getHttpServer()), 'code-juan');
    expect(mailer.sent).toHaveLength(0);
  });

  it('guarda la foto de la cuenta de Google (solo si es de Google)', async () => {
    google.identities.set('code-foto', { sub: 'g-foto', email: 'foto@gmail.com', emailVerified: true, picture: 'https://lh3.googleusercontent.com/a/xyz=s96-c' });
    google.identities.set('code-rara', { sub: 'g-rara', email: 'rara@gmail.com', emailVerified: true, picture: 'https://evil.example/x.png' });
    await roundTrip(request.agent(app.getHttpServer()), 'code-foto');
    await roundTrip(request.agent(app.getHttpServer()), 'code-rara');
    expect((await prisma.user.findUniqueOrThrow({ where: { email: 'foto@gmail.com' } })).googlePictureUrl).toBe('https://lh3.googleusercontent.com/a/xyz=s96-c');
    expect((await prisma.user.findUniqueOrThrow({ where: { email: 'rara@gmail.com' } })).googlePictureUrl).toBeNull();
  });
});

describe('Google sin configurar (e2e)', () => {
  it('GET /auth/google vuelve a ingresar con aviso', async () => {
    const app = await createTestApp({ google: null });
    const res = await request(app.getHttpServer()).get('/auth/google').expect(302);
    expect(res.headers.location).toBe('/ingresar?error=google_disabled');
    await app.close();
  });

});
