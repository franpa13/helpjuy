# Plan 1 — Fundación y cuentas: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dejar armado el monorepo y que una persona pueda registrarse con email y contraseña, verificar el email, recuperar la contraseña, aceptar el consentimiento y crear uno o varios perfiles, cada uno con su token público de QR.

**Architecture:** Monorepo pnpm con `apps/api` (NestJS + Prisma 7 + PostgreSQL), `apps/web` (Next.js App Router) y `packages/contracts` (esquemas zod compartidos). Cada app se organiza por features (`src/features/<feature>`). La web habla con la API a través de un rewrite `/api/*` de Next, así la cookie de sesión es first-party.

**Tech Stack:** Node 22, pnpm 10, NestJS 12, Next.js 16, Prisma 7.10.1 + `@prisma/adapter-pg`, PostgreSQL 17 (Docker en local, Neon en prod), zod 4, `@node-rs/argon2`, `@nestjs/throttler`, Resend, Jest + supertest (api), Vitest + Testing Library (web), Playwright (e2e).

**Spec:** `docs/superpowers/specs/2026-11-05-helpjuy-design.md`

**Planes siguientes (fuera de este plan):** 2) ficha médica y página pública del QR; 3) impresión, historial de escaneos y avisos; 4) Google OAuth, exportar/borrar cuenta, landing y despliegue.

## Global Constraints

- Todo dato médico es opcional; para que el QR quede activo alcanza con nombre y un contacto de emergencia (el contacto llega en el Plan 2).
- Consentimiento expreso: la casilla **nunca viene premarcada**; se guarda versión, fecha y hora, y perfil. Versión actual: `CONSENT_VERSION = "2026-11-05"`.
- Token público: aleatorio criptográfico de **≥128 bits** codificado en base64url (16 bytes → 22 caracteres). Nunca DNI ni correlativo.
- Contraseñas con **argon2** (`@node-rs/argon2`, argon2id). Longitud de 8 a 128 caracteres.
- Sesión: cookie `hj_session`, httpOnly, `Secure` en producción, `SameSite=Lax`, `Path=/`, duración 30 días. En la DB se guarda solo el sha256 (hex) del token.
- Emails normalizados con `trim().toLowerCase()` antes de guardar o buscar.
- Recurso ajeno o inexistente → **404** (nunca 403, para no revelar existencia).
- Rate limit global de 100 req/min por IP; en `/auth/*`, 10 req/min por IP.
- UI en español con lenguaje simple. Tipografías **Atkinson Hyperlegible** (texto) y **Barlow Condensed** (títulos, etiquetas, números). Paleta: papel `#f7f5f0`, tinta `#141414`, rojo `#c8102e`, ámbar `#b45309`, azul `#1f4e8c`. Sin degradados, sombras, emojis ni bordes redondeados grandes (radio máximo 4px). Referencia: `docs/design/ficha-emergencia-v3.html`.
- Spec-driven: cada feature tiene `docs/specs/<feature>/spec.md` con criterios Dado/Cuando/Entonces, escrito **antes** del código de la feature.
- Secretos solo en `.env` (ignorado). Cada app tiene un `.env.example`.
- Commits con el trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Email con mayúsculas o espacios** (`" Juan@Mail.com "`): debe ser la misma cuenta que `juan@mail.com`, tanto al registrarse como al ingresar. → test en Task 3.
2. **Ver o editar un perfil de otro usuario por id**: responde 404, igual que un id inexistente. → test en Task 5.
3. **Consentimiento con `accepted: false` o versión vieja**: no se crea el perfil (400 / 409 `consent_outdated`). → test en Task 5.
4. **Después de restablecer la contraseña**, todas las sesiones anteriores dejan de servir. → test en Task 4.
5. **Link de verificación o reset reusado o vencido**: 400 `invalid_token`, sin efecto. → test en Task 4.

---

## Estructura de archivos

```
helpjuy/
  package.json                 # scripts raíz
  pnpm-workspace.yaml
  tsconfig.base.json
  docker-compose.yml           # postgres:17 en puerto 5433
  docker/init.sql              # crea helpjuy_dev y helpjuy_test
  packages/contracts/
    package.json  tsconfig.json
    src/index.ts               # re-exporta todo
    src/auth.ts  src/profiles.ts  src/consent.ts
  apps/api/
    .env.example  prisma.config.ts  prisma/schema.prisma
    src/main.ts  src/app.module.ts
    src/shared/prisma/prisma.service.ts  prisma.module.ts
    src/shared/zod-validation.pipe.ts
    src/shared/crypto/tokens.ts           # randomToken, sha256Hex
    src/features/health/health.controller.ts
    src/features/auth/{auth.module,auth.controller,auth.service,session.service,session.guard,current-user.decorator}.ts
    src/features/mail/{mail.module,mailer,console.mailer,resend.mailer}.ts
    src/features/consent/{consent.module,consent.controller,consent.service,consent-text}.ts
    src/features/profiles/{profiles.module,profiles.controller,profiles.service}.ts
    test/helpers/{app.ts,db.ts,fake-mailer.ts}
    test/*.e2e-spec.ts
  apps/web/
    .env.example  next.config.ts  vitest.config.ts  playwright.config.ts
    src/app/layout.tsx  src/app/globals.css
    src/app/(auth)/{registro,ingresar,verificar,recuperar,restablecer}/page.tsx
    src/app/panel/page.tsx  src/app/panel/perfiles/nuevo/page.tsx
    src/middleware.ts
    src/shared/ui/{Button,Field,Section,Alert}.tsx
    src/shared/api/{client.ts,server.ts}
    src/features/auth/components/*.tsx
    src/features/profiles/components/*.tsx
    e2e/registro-y-perfil.spec.ts
  docs/specs/{auth,consent,profiles}/spec.md
```

---

### Task 1: Monorepo, contracts, Docker y health check

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `docker-compose.yml`, `docker/init.sql`
- Create: `packages/contracts/{package.json,tsconfig.json,src/index.ts}`
- Create: `apps/api/` (vía `nest new`), `apps/web/` (vía `create-next-app`)
- Create: `apps/api/src/features/health/health.controller.ts`
- Test: `apps/api/test/health.e2e-spec.ts`

**Interfaces:**
- Produces: `GET /health` → `200 {"status":"ok"}`. Paquete `@helpjuy/contracts` (CommonJS, compila a `dist/` con `tsc`, `"main": "dist/index.js"`, `"types": "dist/index.d.ts"`). Scripts raíz: `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm db:up`.

- [ ] **Step 1: Workspace raíz**

`pnpm-workspace.yaml` con `apps/*` y `packages/*`. `tsconfig.base.json` con `strict: true`, `target: ES2022`. Scripts raíz: `"build": "pnpm -r build"`, `"test": "pnpm -r test"`, `"db:up": "docker compose up -d db"`, `"dev": "pnpm --parallel -r dev"`.

- [ ] **Step 2: Postgres local**

`docker-compose.yml`: servicio `db`, imagen `postgres:17`, puerto `5433:5432`, usuario y contraseña `helpjuy`, monta `docker/init.sql` en `/docker-entrypoint-initdb.d/`. `init.sql` crea las bases `helpjuy_dev` y `helpjuy_test`.

Run: `pnpm db:up && docker compose exec db psql -U helpjuy -lqt | cut -d'|' -f1`
Expected: aparecen `helpjuy_dev` y `helpjuy_test`.

- [ ] **Step 3: Paquete contracts**

`packages/contracts` con dependencia `zod@^4`, script `build: tsc -p tsconfig.json`, `module: commonjs`, `declaration: true`. `src/index.ts` exporta `healthResponseSchema = z.object({ status: z.literal("ok") })`.

Run: `pnpm --filter @helpjuy/contracts build`
Expected: existe `packages/contracts/dist/index.js`.

- [ ] **Step 4: Scaffold de las apps**

`pnpm dlx @nestjs/cli new api --directory apps/api --package-manager pnpm --skip-git` y `pnpm dlx create-next-app@latest apps/web --ts --app --src-dir --eslint --no-tailwind --import-alias "@/*" --use-pnpm`. Las dos dependen de `"@helpjuy/contracts": "workspace:*"`. Borrar el `AppController` y el `AppService` de ejemplo de Nest. El script `dev` de la api en el puerto `4000`, el de la web en `3000`. La api conserva `test` (Jest unit) y `test:e2e` (Jest con `test/jest-e2e.json`).

- [ ] **Step 5: Test e2e del health (falla)**

```ts
// apps/api/test/health.e2e-spec.ts
it('GET /health responde ok', async () => {
  await request(app.getHttpServer()).get('/health').expect(200).expect({ status: 'ok' });
});
```

Run: `pnpm --filter api test:e2e -- health`
Expected: FAIL con 404.

- [ ] **Step 6: Implementar `HealthController` (`@Get('health')`) y registrarlo en `AppModule`**

- [ ] **Step 7: Correr el test**

Run: `pnpm --filter api test:e2e -- health`
Expected: PASS. Además `pnpm build` termina sin errores.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "chore: monorepo con api Nest, web Next, contracts y postgres local"
```

---

### Task 2: Prisma, esquema base y helpers de test

**Files:**
- Create: `apps/api/prisma.config.ts`, `apps/api/prisma/schema.prisma`, `apps/api/.env.example`
- Create: `apps/api/src/shared/prisma/{prisma.service.ts,prisma.module.ts}`
- Create: `apps/api/src/shared/crypto/tokens.ts`
- Create: `apps/api/test/helpers/{app.ts,db.ts}`
- Test: `apps/api/src/shared/crypto/tokens.spec.ts`, `apps/api/test/db.e2e-spec.ts`

**Interfaces:**
- Produces:
  - `PrismaService extends PrismaClient` (global, en `PrismaModule`), construido con `new PrismaPg({ connectionString: process.env.DATABASE_URL })`.
  - `randomToken(bytes = 32): string` (base64url) y `sha256Hex(value: string): string` en `shared/crypto/tokens.ts`.
  - `createTestApp(overrides?: { mailer?: Mailer }): Promise<INestApplication>` en `test/helpers/app.ts`. Aplica los mismos `cookie-parser`, pipes y throttler que `main.ts` a través de `configureApp(app)`, exportado desde `src/main.ts`.
  - `resetDb(prisma): Promise<void>`: hace `TRUNCATE ... RESTART IDENTITY CASCADE` de todas las tablas del modelo.

- [ ] **Step 1: Schema**

`generator client { provider = "prisma-client", output = "../src/generated/prisma" }`; la URL va en `prisma.config.ts` (`env("DATABASE_URL")`). Modelos (ids `String @id @default(uuid())`, `createdAt DateTime @default(now())`):

| Modelo | Campos |
|---|---|
| `User` | `email String @unique`, `passwordHash String?`, `emailVerifiedAt DateTime?`, `googleId String? @unique` |
| `Session` | `tokenHash String @unique`, `userId` → User (onDelete Cascade), `expiresAt DateTime` |
| `EmailToken` | `tokenHash String @unique`, `userId` → User (Cascade), `type EmailTokenType` (`VERIFY_EMAIL`, `RESET_PASSWORD`), `expiresAt DateTime`, `usedAt DateTime?` |
| `Profile` | `ownerId` → User (Cascade), `firstName String`, `lastName String`, `relationship Relationship` (`SELF`, `CHILD`, `PARENT`, `PARTNER`, `OTHER`), `isMinor Boolean @default(false)`, `publicToken String @unique`, `tokenRotatedAt DateTime @default(now())`, `updatedAt DateTime @updatedAt` |
| `ConsentRecord` | `profileId` → Profile (Cascade), `userId` → User (Cascade), `version String`, `guardianDeclared Boolean @default(false)`, `acceptedAt DateTime @default(now())` |

`.env.example`: `DATABASE_URL=postgresql://helpjuy:helpjuy@localhost:5433/helpjuy_dev`, `DATABASE_URL_TEST=postgresql://helpjuy:helpjuy@localhost:5433/helpjuy_test`, `WEB_URL=http://localhost:3000`, `RESEND_API_KEY=`, `MAIL_FROM=HelpJuy <no-reply@helpjuy.app>`, `NODE_ENV=development`.

- [ ] **Step 2: Migración**

Run: `pnpm --filter api exec prisma migrate dev --name init`
Expected: crea `prisma/migrations/*_init` y genera el cliente.

Agregar el script `"test:e2e:prepare": "dotenv -v DATABASE_URL=$DATABASE_URL_TEST -- prisma migrate deploy"` o equivalente, para que el e2e use `helpjuy_test`. En los e2e, `DATABASE_URL` apunta a `DATABASE_URL_TEST`.

- [ ] **Step 3: Tests de tokens (fallan)**

```ts
it('randomToken(16) da 22 caracteres base64url', () => {
  expect(randomToken(16)).toMatch(/^[A-Za-z0-9_-]{22}$/);
});
it('randomToken no se repite', () => {
  expect(new Set(Array.from({ length: 1000 }, () => randomToken(16))).size).toBe(1000);
});
it('sha256Hex es determinístico y de 64 hex', () => {
  expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});
```

- [ ] **Step 4: Implementar `tokens.ts` con `crypto.randomBytes(...).toString('base64url')` y `createHash('sha256')`**

- [ ] **Step 5: Test e2e de DB (falla y luego pasa)**

```ts
it('resetDb deja las tablas vacías', async () => {
  await prisma.user.create({ data: { email: 'a@a.com' } });
  await resetDb(prisma);
  expect(await prisma.user.count()).toBe(0);
});
```

Implementar `PrismaService`, `PrismaModule` (`@Global`), `configureApp`, `createTestApp` y `resetDb`.

Run: `pnpm --filter api test -- tokens && pnpm --filter api test:e2e -- db`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(api): prisma 7 con esquema base, tokens y helpers de test"
```

---

### Task 3: Auth — registro, ingreso, sesión

**Files:**
- Create: `docs/specs/auth/spec.md`
- Create: `packages/contracts/src/auth.ts`
- Create: `apps/api/src/shared/zod-validation.pipe.ts`
- Create: `apps/api/src/features/auth/{auth.module,auth.controller,auth.service,session.service,session.guard,current-user.decorator}.ts`
- Test: `apps/api/test/auth.e2e-spec.ts`

**Interfaces:**
- Consumes: `PrismaService`, `randomToken`, `sha256Hex`, `createTestApp`, `resetDb` (Task 2).
- Produces:
  - contracts: `emailSchema = z.string().trim().toLowerCase().pipe(z.email())`; `registerSchema = z.object({ email: emailSchema, password: z.string().min(8).max(128) })`; `loginSchema` (igual, con `password: z.string().min(1).max(128)`); `type MeResponse = { id: string; email: string; emailVerified: boolean }`.
  - `ZodValidationPipe(schema)`: un error responde `400 { error: 'validation', issues }`.
  - `SessionService.create(userId): Promise<string>` (token plano), `SessionService.resolve(token): Promise<User | null>`, `SessionService.revokeAll(userId): Promise<void>`.
  - `SessionGuard` (lee la cookie `hj_session`; sin sesión válida → 401 `{ error: 'unauthenticated' }`) y el decorador `@CurrentUser()`.
  - Endpoints: `POST /auth/register` → 201 `MeResponse` + cookie; `POST /auth/login` → 200 `MeResponse` + cookie; `POST /auth/logout` → 204 y borra la cookie; `GET /auth/me` → 200 `MeResponse`.

- [ ] **Step 1: Escribir `docs/specs/auth/spec.md`**

Objetivo, alcance (email/contraseña; Google en el Plan 4), reglas de los Global Constraints y estos criterios:
- Dado un email nuevo, cuando se registra, entonces se crea el usuario, queda con sesión iniciada y se le envía un email de verificación.
- Dado un email ya registrado (con cualquier combinación de mayúsculas o espacios), cuando se registra, entonces recibe 409 `email_taken`.
- Dado un usuario sin email verificado, cuando ingresa, entonces puede usar la app; `emailVerified` es `false`.
- Dadas credenciales incorrectas, cuando ingresa, entonces recibe 401 `invalid_credentials`, sin distinguir email inexistente de contraseña errónea.
- Dada una sesión vencida o cerrada, cuando llama a `/auth/me`, entonces recibe 401.
- Dadas 11 solicitudes en un minuto a `/auth/login` desde la misma IP, entonces la 11ª recibe 429.

- [ ] **Step 2: Tests e2e (fallan)**

```ts
it('registra y deja sesión', async () => {
  const res = await agent.post('/auth/register').send({ email: 'juan@mail.com', password: 'claveSegura1' }).expect(201);
  expect(res.body).toEqual({ id: expect.any(String), email: 'juan@mail.com', emailVerified: false });
  expect(res.headers['set-cookie'][0]).toMatch(/hj_session=.+; .*HttpOnly/i);
  await agent.get('/auth/me').expect(200);
});
it('normaliza el email: " Juan@Mail.com " es la misma cuenta', async () => {
  await agent.post('/auth/register').send({ email: 'juan@mail.com', password: 'claveSegura1' });
  await request(server).post('/auth/register').send({ email: ' Juan@Mail.com ', password: 'otraClave12' }).expect(409, { error: 'email_taken' });
  await request(server).post('/auth/login').send({ email: ' JUAN@mail.com', password: 'claveSegura1' }).expect(200);
});
it('credenciales inválidas → 401 genérico', async () => {
  await request(server).post('/auth/login').send({ email: 'nadie@mail.com', password: 'x' }).expect(401, { error: 'invalid_credentials' });
});
it('contraseña de 7 caracteres → 400 validation', async () => {
  const r = await request(server).post('/auth/register').send({ email: 'a@b.com', password: '1234567' }).expect(400);
  expect(r.body.error).toBe('validation');
});
it('logout invalida la sesión', async () => {
  await agent.post('/auth/register').send({ email: 'x@x.com', password: 'claveSegura1' });
  await agent.post('/auth/logout').expect(204);
  await agent.get('/auth/me').expect(401);
});
it('sesión vencida → 401', async () => {
  // registrar, luego prisma.session.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } })
});
it('rate limit: la 11ª solicitud de login en un minuto → 429', async () => { /* 11 POST /auth/login */ });
```

Run: `pnpm --filter api test:e2e -- auth`
Expected: FAIL (404).

- [ ] **Step 3: Implementar contracts `auth.ts`, `ZodValidationPipe`, `SessionService`, `SessionGuard`, `@CurrentUser`, `AuthService.register/login` y `AuthController`**

Sesión de 30 días; cookie según los Global Constraints (`secure: process.env.NODE_ENV === 'production'`). El registro envía el email de verificación a través de `Mailer` (Task 4). Hasta entonces, `AuthService` llama a un método `onRegistered(user)` vacío que la Task 4 completa. Throttler: `ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }])` global y `@Throttle({ default: { limit: 10, ttl: 60_000 } })` en `AuthController`.

- [ ] **Step 4: Correr los tests**

Run: `pnpm --filter @helpjuy/contracts build && pnpm --filter api test:e2e -- auth`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(auth): registro, ingreso y sesión por cookie"
```

---

### Task 4: Auth — verificación de email y recuperación de contraseña

**Files:**
- Create: `apps/api/src/features/mail/{mail.module,mailer,console.mailer,resend.mailer}.ts`
- Create: `apps/api/test/helpers/fake-mailer.ts`
- Modify: `apps/api/src/features/auth/{auth.service,auth.controller}.ts`, `docs/specs/auth/spec.md`
- Modify: `packages/contracts/src/auth.ts`
- Test: `apps/api/test/auth-email.e2e-spec.ts`

**Interfaces:**
- Consumes: `SessionService.revokeAll`, `randomToken`, `sha256Hex`.
- Produces:
  - `abstract class Mailer { abstract send(msg: { to: string; subject: string; text: string; html: string }): Promise<void> }`. `MailModule` usa `ResendMailer` si existe `RESEND_API_KEY` y `ConsoleMailer` si no.
  - `FakeMailer` (tests): guarda `sent: Msg[]` y tiene `lastLinkTo(email): string`, que extrae la URL del texto.
  - contracts: `tokenSchema = z.object({ token: z.string().min(10) })`, `forgotPasswordSchema = z.object({ email: emailSchema })`, `resetPasswordSchema = z.object({ token, password: z.string().min(8).max(128) })`.
  - Endpoints: `POST /auth/verify-email {token}` → 204; `POST /auth/resend-verification` (con sesión) → 204; `POST /auth/forgot-password {email}` → 204 **siempre**; `POST /auth/reset-password {token,password}` → 204. Si el token es inválido, vencido o ya usado → 400 `{ error: 'invalid_token' }`.
  - Links: `${WEB_URL}/verificar?token=…` (vence en 24 h) y `${WEB_URL}/restablecer?token=…` (vence en 1 h).

- [ ] **Step 1: Sumar criterios a `docs/specs/auth/spec.md`**

- Dado un registro, cuando abre el link de verificación, entonces `emailVerified` pasa a `true`.
- Dado un link ya usado o vencido, cuando se usa, entonces recibe 400 `invalid_token` y nada cambia.
- Dado un email existente o inexistente, cuando pide recuperar la contraseña, entonces recibe 204 en los dos casos (solo el existente recibe email).
- Dado un reset exitoso, entonces todas las sesiones anteriores quedan cerradas y puede ingresar con la contraseña nueva.

- [ ] **Step 2: Tests e2e (fallan)**

```ts
it('verifica el email con el link enviado', async () => {
  await agent.post('/auth/register').send({ email: 'v@v.com', password: 'claveSegura1' });
  const token = new URL(mailer.lastLinkTo('v@v.com')).searchParams.get('token');
  await request(server).post('/auth/verify-email').send({ token }).expect(204);
  expect((await agent.get('/auth/me')).body.emailVerified).toBe(true);
});
it('link de verificación reusado → 400 invalid_token', async () => { /* usar dos veces */ });
it('link vencido → 400 invalid_token', async () => { /* updateMany expiresAt al pasado */ });
it('forgot-password responde 204 aunque el email no exista y no manda mail', async () => {
  await request(server).post('/auth/forgot-password').send({ email: 'nadie@x.com' }).expect(204);
  expect(mailer.sent).toHaveLength(0);
});
it('reset cambia la contraseña y cierra todas las sesiones', async () => {
  await agent.post('/auth/register').send({ email: 'r@r.com', password: 'claveSegura1' });
  await request(server).post('/auth/forgot-password').send({ email: 'r@r.com' });
  const token = new URL(mailer.lastLinkTo('r@r.com')).searchParams.get('token');
  await request(server).post('/auth/reset-password').send({ token, password: 'nuevaClave99' }).expect(204);
  await agent.get('/auth/me').expect(401);
  await request(server).post('/auth/login').send({ email: 'r@r.com', password: 'nuevaClave99' }).expect(200);
});
```

Run: `pnpm --filter api test:e2e -- auth-email`
Expected: FAIL.

- [ ] **Step 3: Implementar `Mailer`, `ConsoleMailer`, `ResendMailer` (SDK `resend`, `from: MAIL_FROM`), `MailModule` y los endpoints**

Cada token se guarda como `sha256Hex` en `EmailToken`; al usarse se marca `usedAt`. Textos de los emails en español simple: "Confirmá tu email para HelpJuy" y "Restablecé tu contraseña de HelpJuy", con el link y la frase "Si no fuiste vos, ignorá este mensaje".

- [ ] **Step 4: Correr los tests**

Run: `pnpm --filter api test:e2e`
Expected: PASS (health, db, auth, auth-email).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(auth): verificación de email y recuperación de contraseña"
```

---

### Task 5: Consentimiento y perfiles

**Files:**
- Create: `docs/specs/consent/spec.md`, `docs/specs/profiles/spec.md`
- Create: `packages/contracts/src/{consent.ts,profiles.ts}`
- Create: `apps/api/src/features/consent/{consent.module,consent.controller,consent.service,consent-text}.ts`
- Create: `apps/api/src/features/profiles/{profiles.module,profiles.controller,profiles.service}.ts`
- Test: `apps/api/test/profiles.e2e-spec.ts`

**Interfaces:**
- Consumes: `SessionGuard`, `@CurrentUser`, `randomToken`, `ZodValidationPipe`.
- Produces:
  - contracts: `CONSENT_VERSION = '2026-11-05'`; `consentAcceptanceSchema = z.object({ version: z.string(), accepted: z.literal(true), guardianDeclared: z.boolean().optional() })`; `relationshipSchema = z.enum(['SELF','CHILD','PARENT','PARTNER','OTHER'])`; `createProfileSchema = z.object({ firstName: z.string().trim().min(1).max(60), lastName: z.string().trim().min(1).max(60), relationship: relationshipSchema, isMinor: z.boolean(), consent: consentAcceptanceSchema })`; `updateProfileSchema` (firstName, lastName y relationship, opcionales); `type ProfileDto = { id; firstName; lastName; relationship; isMinor; publicToken; createdAt: string }`; `type ConsentDto = { version: string; text: string }`.
  - `ConsentService.current(): ConsentDto` y `ConsentService.record(tx, { userId, profileId, version, guardianDeclared })`. `consent-text.ts` exporta el texto en markdown.
  - Endpoints: `GET /consent/current` (público) → `ConsentDto`. Con sesión: `GET /profiles` → `ProfileDto[]` (orden por `createdAt`); `POST /profiles` → 201 `ProfileDto`; `GET /profiles/:id`; `PATCH /profiles/:id`; `DELETE /profiles/:id` → 204; `POST /profiles/:id/rotate-token` → 200 `{ publicToken }`.

- [ ] **Step 1: Escribir las dos specs**

`consent/spec.md`: el texto del consentimiento, en lenguaje simple, debe decir: qué datos se guardan; que todos son opcionales; que lo marcado como público lo ve cualquiera que escanee el QR; que los datos se alojan en Frankfurt (Unión Europea), jurisdicción adecuada según la ley argentina; que no se verifican médicamente; que se pueden ver, corregir, descargar y borrar en cualquier momento; y el marco legal (Ley 25.326, datos sensibles). Criterios:
- Dado `accepted` distinto de `true`, entonces 400 `validation` y no se crea nada.
- Dada una versión distinta de `CONSENT_VERSION`, entonces 409 `{ error: 'consent_outdated', currentVersion }`.
- Dado `isMinor: true` sin `guardianDeclared: true`, entonces 400 `{ error: 'guardian_required' }`.
- Dado un perfil creado, entonces existe un `ConsentRecord` con versión, usuario y perfil.

`profiles/spec.md`. Criterios:
- Dado un usuario con sesión, cuando crea un perfil, entonces recibe un `publicToken` de 22 caracteres base64url.
- Dado un perfil de otro usuario o un id inexistente, cuando lo lee, edita, borra o rota, entonces 404 `{ error: 'not_found' }`.
- Dado un perfil, cuando rota el token, entonces el token nuevo es distinto y el viejo ya no existe en la DB.
- Dado un usuario, puede tener varios perfiles (yo, hijo, padre).

- [ ] **Step 2: Tests e2e (fallan)**

```ts
const base = { firstName: 'Juan', lastName: 'Pérez', relationship: 'SELF', isMinor: false,
  consent: { version: '2026-11-05', accepted: true } };

it('crea perfil con token y registra consentimiento', async () => {
  const r = await alice.post('/profiles').send(base).expect(201);
  expect(r.body.publicToken).toMatch(/^[A-Za-z0-9_-]{22}$/);
  expect(await prisma.consentRecord.count({ where: { profileId: r.body.id, version: '2026-11-05' } })).toBe(1);
});
it('accepted:false → 400', async () => {
  await alice.post('/profiles').send({ ...base, consent: { version: '2026-11-05', accepted: false } }).expect(400);
  expect(await prisma.profile.count()).toBe(0);
});
it('versión vieja → 409 consent_outdated', async () => {
  await alice.post('/profiles').send({ ...base, consent: { version: '2020-01-01', accepted: true } })
    .expect(409, { error: 'consent_outdated', currentVersion: '2026-11-05' });
});
it('menor sin declaración de tutor → 400 guardian_required', async () => {
  await alice.post('/profiles').send({ ...base, relationship: 'CHILD', isMinor: true }).expect(400, { error: 'guardian_required' });
});
it('perfil ajeno → 404 en GET, PATCH, DELETE y rotate', async () => {
  const { body } = await alice.post('/profiles').send(base);
  await bob.get(`/profiles/${body.id}`).expect(404, { error: 'not_found' });
  await bob.patch(`/profiles/${body.id}`).send({ firstName: 'X' }).expect(404);
  await bob.delete(`/profiles/${body.id}`).expect(404);
  await bob.post(`/profiles/${body.id}/rotate-token`).expect(404);
});
it('rotar token cambia el token', async () => {
  const { body } = await alice.post('/profiles').send(base);
  const r = await alice.post(`/profiles/${body.id}/rotate-token`).expect(200);
  expect(r.body.publicToken).not.toBe(body.publicToken);
  expect(await prisma.profile.count({ where: { publicToken: body.publicToken } })).toBe(0);
});
it('varios perfiles por cuenta', async () => {
  await alice.post('/profiles').send(base);
  await alice.post('/profiles').send({ ...base, firstName: 'Sofía', relationship: 'CHILD', isMinor: true,
    consent: { ...base.consent, guardianDeclared: true } });
  expect((await alice.get('/profiles')).body).toHaveLength(2);
});
it('GET /consent/current es público', async () => {
  const r = await request(server).get('/consent/current').expect(200);
  expect(r.body.version).toBe('2026-11-05');
});
```

`alice` y `bob` son agentes de supertest registrados en `beforeEach`.

Run: `pnpm --filter api test:e2e -- profiles`
Expected: FAIL.

- [ ] **Step 3: Implementar contracts, `ConsentModule` y `ProfilesModule`**

La creación del perfil y del `ConsentRecord` va en una sola `prisma.$transaction`. `publicToken = randomToken(16)`. La comprobación de versión del consentimiento ocurre antes de la transacción. Todas las consultas filtran por `ownerId = user.id` y, si no encuentran nada, lanzan `NotFoundException({ error: 'not_found' })`.

- [ ] **Step 4: Correr todos los tests**

Run: `pnpm --filter @helpjuy/contracts build && pnpm --filter api test && pnpm --filter api test:e2e`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(profiles): consentimiento y perfiles múltiples con token público"
```

---

### Task 6: Web — base visual, proxy a la API y pantallas de auth

**Files:**
- Modify: `apps/web/next.config.ts`, `apps/web/src/app/layout.tsx`, `apps/web/src/app/globals.css`
- Create: `apps/web/.env.example` (`API_URL=http://localhost:4000`)
- Create: `apps/web/src/shared/ui/{Button,Field,Section,Alert}.tsx`
- Create: `apps/web/src/shared/api/{client.ts,server.ts}`
- Create: `apps/web/src/features/auth/components/{RegisterForm,LoginForm,ForgotForm,ResetForm,VerifyEmail}.tsx`
- Create: `apps/web/src/app/(auth)/{registro,ingresar,verificar,recuperar,restablecer}/page.tsx`
- Create: `apps/web/src/middleware.ts`, `apps/web/vitest.config.ts`
- Test: `apps/web/src/features/auth/components/RegisterForm.test.tsx`

**Interfaces:**
- Consumes: endpoints `/auth/*` (Tasks 3 y 4), schemas de `@helpjuy/contracts`.
- Produces:
  - `next.config.ts`: `rewrites: [{ source: '/api/:path*', destination: \`${process.env.API_URL}/:path*\` }]`, `transpilePackages: ['@helpjuy/contracts']`.
  - `apiFetch<T>(path: string, init?: RequestInit): Promise<T>` (cliente, prefija `/api`, `credentials: 'include'`). Si la respuesta no es ok, lanza `ApiError { status: number; code: string }`.
  - `apiServer<T>(path: string): Promise<T | null>` (server components): llama a `API_URL` reenviando la cookie `hj_session` de `cookies()`; con 401 devuelve `null`.
  - `middleware.ts`: si `/panel/:path*` no tiene la cookie `hj_session`, redirige a `/ingresar?next=…`.
  - Variables CSS en `globals.css`: `--paper --ink --muted --line --red --red-tint --amber --amber-tint --blue --blue-tint`, con los valores de los Global Constraints. Fuentes con `next/font/google` (`Atkinson_Hyperlegible` 400/700 y `Barlow_Condensed` 600/700/800) como `--font-body` y `--font-head`.

- [ ] **Step 1: Test del formulario de registro (falla)**

```tsx
it('muestra error en español si la contraseña es corta y no envía', async () => {
  const fetchSpy = vi.spyOn(global, 'fetch');
  render(<RegisterForm />);
  await user.type(screen.getByLabelText('Email'), 'juan@mail.com');
  await user.type(screen.getByLabelText('Contraseña'), '1234567');
  await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));
  expect(await screen.findByText('La contraseña tiene que tener al menos 8 caracteres')).toBeVisible();
  expect(fetchSpy).not.toHaveBeenCalled();
});
it('si el email ya existe muestra "Ya hay una cuenta con ese email"', async () => { /* mock fetch 409 email_taken */ });
```

Run: `pnpm --filter web test`
Expected: FAIL.

- [ ] **Step 2: Implementar la base visual, las primitivas de UI, `apiFetch`/`apiServer`, el rewrite y el middleware**

Primitivas con el lenguaje de `docs/design/ficha-emergencia-v3.html`: etiquetas en Barlow Condensed mayúscula con `letter-spacing: .12em`, bordes de 1px `--line`, reglas de 3px `--ink`, botón primario `--ink` sólido y botón de peligro `--red`, radio ≤ 4px y foco visible de 3px. Mobile-first con un ancho máximo de contenido de 480px en las pantallas de auth.

- [ ] **Step 3: Implementar los formularios y las páginas**

Textos:
- `/registro`: título "Creá tu ficha de emergencia", subtítulo "Tarda menos de 3 minutos. Es gratis.", botón "Crear cuenta", link "¿Ya tenés cuenta? Ingresá". Al terminar, va a `/panel/perfiles/nuevo`.
- `/ingresar`: "Ingresá", botón "Ingresar", link "Me olvidé la contraseña". El error 401 se muestra como "Email o contraseña incorrectos". Al terminar, va a `next` o a `/panel`.
- `/verificar?token=`: llama a verify-email al montar. Si sale bien muestra "Listo, tu email quedó confirmado"; si da 400, "El link venció o ya se usó" y un botón "Mandarme otro".
- `/recuperar`: después de enviar siempre muestra "Si hay una cuenta con ese email, te mandamos un link".
- `/restablecer?token=`: nueva contraseña; al terminar, "Contraseña cambiada. Ingresá de nuevo." y va a `/ingresar`.
- Validación en el cliente con los mismos schemas de contracts y mensajes en español.

- [ ] **Step 4: Correr los tests y el build**

Run: `pnpm --filter web test && pnpm --filter web build`
Expected: PASS y build OK.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(web): base visual, proxy a la api y pantallas de auth"
```

---

### Task 7: Web — panel, alta de perfil con consentimiento y e2e

**Files:**
- Create: `apps/web/src/app/panel/page.tsx`, `apps/web/src/app/panel/perfiles/nuevo/page.tsx`
- Create: `apps/web/src/features/profiles/components/{ProfileList,NewProfileForm,ConsentStep}.tsx`
- Create: `apps/web/playwright.config.ts`, `apps/web/e2e/registro-y-perfil.spec.ts`
- Test: `apps/web/src/features/profiles/components/ConsentStep.test.tsx`, `apps/web/e2e/registro-y-perfil.spec.ts`

**Interfaces:**
- Consumes: `apiFetch`, `apiServer`, primitivas de UI (Task 6); `/profiles`, `/consent/current`, `/auth/me` (Tasks 3 a 5); `CONSENT_VERSION`, `createProfileSchema`.
- Produces: el panel en `/panel` lista los perfiles. El alta va en dos pasos: datos y consentimiento.

- [ ] **Step 1: Test del paso de consentimiento (falla)**

```tsx
it('la casilla arranca sin marcar y el botón está deshabilitado', () => {
  render(<ConsentStep consent={{ version: '2026-11-05', text: '# Texto' }} isMinor={false} onAccept={vi.fn()} />);
  expect(screen.getByRole('checkbox', { name: /Leí y acepto/ })).not.toBeChecked();
  expect(screen.getByRole('button', { name: 'Aceptar y crear perfil' })).toBeDisabled();
});
it('si es menor pide además la declaración de tutor', async () => {
  render(<ConsentStep consent={{ version: '2026-11-05', text: 'x' }} isMinor onAccept={vi.fn()} />);
  await user.click(screen.getByRole('checkbox', { name: /Leí y acepto/ }));
  expect(screen.getByRole('button', { name: 'Aceptar y crear perfil' })).toBeDisabled();
  await user.click(screen.getByRole('checkbox', { name: /Soy padre, madre o tutor/ }));
  expect(screen.getByRole('button', { name: 'Aceptar y crear perfil' })).toBeEnabled();
});
```

Run: `pnpm --filter web test`
Expected: FAIL.

- [ ] **Step 2: Implementar `ConsentStep`, `NewProfileForm` y `ProfileList`, y las dos páginas**

- `/panel`: título "Tus fichas". Si el email no está verificado, aviso ámbar "Confirmá tu email para recibir avisos" con el botón "Reenviar". Cada perfil muestra nombre, relación ("Yo", "Hijo/a", "Madre/Padre", "Pareja", "Otro") y el estado "Ficha al 10%" (placeholder fijo hasta el Plan 2). Botón "Agregar otra persona". Si no hay perfiles, redirige a `/panel/perfiles/nuevo`.
- `/panel/perfiles/nuevo`: paso 1 "¿Para quién es esta ficha?" con nombre, apellido, relación y "¿Es menor de 18?". Paso 2: el consentimiento renderizado (markdown) en un bloque con scroll, la casilla "Leí y acepto que estos datos se guarden y que lo que marque como público se muestre al escanear mi QR" y, si es menor, "Soy padre, madre o tutor de esta persona". Si da 409 `consent_outdated`, vuelve a pedir el consentimiento con el texto nuevo.

- [ ] **Step 3: Test e2e de punta a punta (falla y luego pasa)**

```ts
test('registro → alta de perfil → aparece en el panel', async ({ page }) => {
  await page.goto('/registro');
  await page.getByLabel('Email').fill(`e2e+${Date.now()}@mail.com`);
  await page.getByLabel('Contraseña').fill('claveSegura1');
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page).toHaveURL(/\/panel\/perfiles\/nuevo/);
  await page.getByLabel('Nombre').fill('Juan');
  await page.getByLabel('Apellido').fill('Pérez');
  await page.getByRole('button', { name: 'Seguir' }).click();
  await page.getByRole('checkbox', { name: /Leí y acepto/ }).check();
  await page.getByRole('button', { name: 'Aceptar y crear perfil' }).click();
  await expect(page).toHaveURL(/\/panel$/);
  await expect(page.getByText('Juan Pérez')).toBeVisible();
});
```

`playwright.config.ts` levanta `webServer` con api y web (`pnpm --filter api start:dev` contra `helpjuy_test` y `pnpm --filter web dev`), con `baseURL: http://localhost:3000`.

Run: `pnpm --filter web exec playwright install chromium && pnpm --filter web test:e2e`
Expected: PASS.

- [ ] **Step 4: Verificación final del plan**

Run: `pnpm build && pnpm test && pnpm --filter api test:e2e && pnpm --filter web test:e2e`
Expected: todo PASS.

- [ ] **Step 5: Commit y push**

```bash
git add -A && git commit -m "feat(web): panel y alta de perfil con consentimiento"
git push origin main
```
