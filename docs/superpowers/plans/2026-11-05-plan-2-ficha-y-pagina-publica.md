# Plan 2 — Ficha médica y página pública del QR: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que cada perfil tenga su ficha médica, cifrada, con visibilidad por sección, editable desde el panel, y que el QR abra una página pública `/e/{token}` que carga al instante aunque la API esté dormida.

**Architecture:** La API guarda la ficha como JSON cifrado (AES-256-GCM) en `MedicalRecord`, con la visibilidad en claro. `GET /public/cards/:token` devuelve solo lo público. La web renderiza `/e/[token]` con ISR (fetch con tag `card:{token}`). Cada vez que la ficha cambia, la API llama a `POST /internal/revalidate` de la web (con secreto) e inmediatamente pide la página una vez (warm-up).

**Tech Stack:** el del Plan 1. No se agregan dependencias.

**Spec:** `docs/superpowers/specs/2026-11-05-helpjuy-design.md` (§4, §5, §6.4, §7). Mockup aprobado: `docs/design/ficha-emergencia-v3.html`.

## Global Constraints

- Todo dato médico es **opcional**. El QR se considera **activo** con nombre y al menos **un contacto de emergencia**.
- Orden de la ficha pública (§4): identidad → signos (edad, sangre, peso, altura) → **alergias** → condiciones → medicación (con etiqueta de anticoagulante) → para tener en cuenta → más información (plegado) → botones de llamada (107 y contacto) → pie con aviso de "no verificado" y fecha.
- **Nunca** se muestran en público: fecha de nacimiento (solo la edad), DNI, domicilio, email, ids internos.
- Visibilidad por sección. Por defecto son **públicas** `identity, vitals, allergies, conditions, medications, contacts, care, history` y **privadas** `insurance, doctor, notes`.
- Cifrado de la ficha: AES-256-GCM, clave `MEDICAL_DATA_KEY` (32 bytes en base64). El formato guardado es `v1.<iv b64url>.<tag b64url>.<data b64url>`.
- Ficha pública: `noindex, nofollow` (metadata y header `X-Robots-Tag`), sin login, rate limit de 60 req/min por IP, token inválido → 404 genérico.
- Revalidación: `revalidateTag('card:'+token, { expire: 0 })` y después un warm-up `GET {WEB_URL}/e/{token}`. Rotar el token invalida el viejo y el nuevo. Un fallo de revalidación **no rompe** el guardado: se loguea.
- Estilo §5: papel, tinta, rojo solo para lo crítico, Barlow Condensed y Atkinson Hyperlegible, radio ≤ 4px. Azul noche (`--night`) para barras oscuras.
- Texto en español simple: "¿Tomás algún remedio todos los días?", no "medicación crónica".

## Review Focus

1. **Sección privada nunca se filtra**: una sección marcada privada no aparece ni en la respuesta de `/public/cards` ni en el HTML. → test en Task 3.
2. **Lista vacía o "no tengo"**: "Sin alergias conocidas" es un dato útil, distinto de "no cargado". → `allergiesNone` y sus pares, en Tasks 1, 3 y 5.
3. **Token rotado**: el link viejo deja de mostrar la ficha (404) tras rotar. → test en Task 4.
4. **API caída al revalidar**: guardar la ficha igual responde 200. → test en Task 4.
5. **Fecha de nacimiento futura o edad absurda**: se rechaza (400). La edad se calcula en la zona horaria de Argentina. → tests en Tasks 1 y 3.

---

### Task 1: Contrato de la ficha, cifrado y modelo

**Files:** `packages/contracts/src/medical.ts`, `apps/api/src/shared/crypto/field-cipher.ts` (+ `.spec.ts`), `apps/api/prisma/schema.prisma`, migración, `apps/api/.env.example`, `apps/api/vitest.config.e2e.ts`.

**Interfaces (Produces):**
- `BLOOD_TYPES = ['A+','A-','B+','B-','AB+','AB-','O+','O-'] as const`.
- `SECTIONS = ['identity','vitals','allergies','conditions','medications','contacts','care','history','insurance','doctor','notes'] as const`, `DEFAULT_VISIBILITY: Record<Section, boolean>`.
- `medicalRecordSchema` (zod) con estos campos, todos opcionales salvo las listas (default `[]`) y los booleanos (default `false`):
  `sex: 'F'|'M'|'X'`, `birthDate: 'YYYY-MM-DD'` (no futura, no anterior a 1900), `language` ≤40, `weightKg` 1–400, `heightCm` 30–250, `bloodType`,
  `allergies[] {substance 1–80, reaction? ≤80}` ≤20, `allergiesNone`,
  `conditions[] {name 1–80, note? ≤120}` ≤20, `conditionsNone`,
  `medications[] {name 1–80, dose? ≤60, anticoagulant: boolean}` ≤30, `medicationsNone`,
  `contacts[] {name 1–60, relation? ≤40, phone /^\+?[0-9 ()-]{6,20}$/}` ≤3,
  `communication` ≤200, `transfusion: 'ACCEPTS'|'REFUSES'|'UNKNOWN'` (default `UNKNOWN`), `organDonor: 'YES'|'NO'|'UNKNOWN'` (default `UNKNOWN`), `directives` ≤300,
  `surgeries` ≤300, `implants` ≤200, `insurance {name ≤60, number? ≤40}`, `doctor {name ≤60, phone?}`, `notes` ≤500.
- `saveMedicalRecordSchema = z.object({ data: medicalRecordSchema, visibility: z.record(section, z.boolean()) })`.
- `completion(data): number` (0–100). Ocho ítems con el mismo peso: ≥1 contacto, sangre, alergias respondidas (lista o `allergiesNone`), medicación respondida, condiciones respondidas, fecha de nacimiento, peso, altura.
- `ageFrom(birthDate, now = new Date()): number`, calculada en `America/Argentina/Jujuy`.
- `encryptJson(value: unknown, key: Buffer): string` / `decryptJson<T>(payload: string, key: Buffer): T` y `loadMedicalKey(): Buffer` (falla si la clave no tiene 32 bytes).
- Prisma: `MedicalRecord { profileId String @id → Profile (Cascade), ciphertext String, visibility Json, updatedAt DateTime @updatedAt }`.

- [ ] Tests (RED): `field-cipher.spec.ts` cubre ida y vuelta, que dos cifrados del mismo valor difieren (IV aleatorio), que un dato alterado lanza error y que una clave de 31 bytes lanza error. En contracts, tests de `completion` (vacío → 0, todo → 100, `allergiesNone` cuenta) y de `ageFrom` (cumple mañana → todavía no), y del schema (fecha futura → error, teléfono con letras → error).
- [ ] Implementar (GREEN), migrar (`prisma migrate dev --name medical_record`), agregar `MEDICAL_DATA_KEY` a `.env.example`, `.env` y al env del e2e.
- [ ] Commit `feat(medical): contrato de la ficha, cifrado AES-256-GCM y modelo`.

> Contracts no tiene runner de tests: se agrega `vitest` a `packages/contracts` (`test: vitest run`).

### Task 2: API privada de la ficha

**Files:** `apps/api/src/features/medical-record/{medical-record.module,controller,service}.ts`, `docs/specs/medical-record/spec.md`, `apps/api/test/medical-record.e2e-spec.ts`. Modifica `ProfileDto` y `toProfileDto` (agrega `completion: number` y `active: boolean`).

**Interfaces:**
- `GET /profiles/:id/record` → `{ data: MedicalRecord, visibility, updatedAt: string | null }`. Si no existe, devuelve la ficha vacía con `DEFAULT_VISIBILITY` y `updatedAt: null`.
- `PUT /profiles/:id/record` (`saveMedicalRecordSchema`) → mismo formato. Ajeno o inexistente → 404 `not_found`.
- `MedicalRecordService.get(ownerId, profileId)`, `.save(ownerId, profileId, input)`, `.findPublic(token)` (lo usa la Task 3) y `.summaries(profileIds): Map<id, { completion, active }>`.
- Después de `save`, llama a `CardCache.invalidate([publicToken])` (Task 4). En esta task, `CardCache` es un no-op inyectable.

- [ ] Spec + tests e2e (RED): guardar y leer ida y vuelta; en la DB `ciphertext` no contiene "Penicilina" en claro; perfil ajeno → 404 en GET y PUT; payload inválido → 400; `GET /profiles` trae `completion` y `active`.
- [ ] Implementar (GREEN) y commit `feat(medical): API privada de la ficha`.

### Task 3: API pública de la ficha

**Files:** `apps/api/src/features/emergency-card/{emergency-card.module,controller}.ts`, `packages/contracts/src/public-card.ts`, `docs/specs/emergency-card/spec.md`, `apps/api/test/public-card.e2e-spec.ts`.

**Interfaces:**
- `type PublicCardDto = { firstName; lastName; active: boolean; updatedAt: string | null; identity?: { age?: number; sex?; language? }; vitals?: { bloodType?; weightKg?; heightCm? }; allergies?: { items: {substance; reaction?}[]; none: boolean }; conditions?: {...}; medications?: {...}; contacts?: {name; relation?; phone}[]; care?: { communication?; transfusion; organDonor; directives? }; history?: { surgeries?; implants? }; insurance?: {...}; doctor?: {...}; notes?: string }`. Una sección privada **no aparece** como clave.
- `GET /public/cards/:token` → 200 `PublicCardDto` con `X-Robots-Tag: noindex, nofollow` y `Cache-Control: no-store`. Token inexistente → 404 `{ error: 'not_found' }`. `@Throttle({ default: { limit: 60, ttl: 60_000 } })`.

- [ ] Spec + tests (RED): todo público; `insurance` privado no aparece en el JSON; ningún campo `birthDate`, `email`, `id` ni `ownerId` en la respuesta; edad calculada; perfil sin ficha → `active: false` y solo el nombre; token inválido → 404; header noindex presente.
- [ ] Implementar (GREEN) y commit `feat(card): API pública de la ficha`.

### Task 4: Revalidación de la página pública

**Files:** `apps/api/src/features/emergency-card/card-cache.ts` (`abstract class CardCache { invalidate(tokens: string[]): Promise<void> }`, `HttpCardCache`, `NoopCardCache`), `apps/web/src/app/internal/revalidate/route.ts` (+ test), `apps/api/test/helpers/fake-card-cache.ts`. Modifica `ProfilesService` (rotate, update, delete) y `MedicalRecordService.save`.

**Interfaces:**
- `HttpCardCache.invalidate(tokens)`: `POST {WEB_URL}/internal/revalidate` con header `x-revalidate-secret: REVALIDATE_SECRET` y body `{ tokens }`. Después, `GET {WEB_URL}/e/{token}` por cada token. Usa timeout de 8 s. Cualquier error se loguea y **no se propaga**.
- La API elige `HttpCardCache` si existen `WEB_URL` y `REVALIDATE_SECRET`; si no, `NoopCardCache`.
- Web `POST /internal/revalidate`: un secreto incorrecto → 401; si es correcto, aplica `revalidateTag('card:'+t, { expire: 0 })` a cada token (máximo 10, formato base64url de 22 caracteres) → 200 `{ revalidated: n }`.
- Se dispara en: guardar la ficha, editar el nombre del perfil, rotar el token (viejo y nuevo) y borrar el perfil.

- [ ] Tests (RED): con `FakeCardCache`, guardar la ficha → `invalidate([token])`; rotar → `invalidate([viejo, nuevo])`; borrar → `invalidate([token])`. Un `CardCache` que lanza error → igual responde 200 en el PUT. En la web, el route handler con secreto incorrecto → 401, y con correcto llama a `revalidateTag` (mockeado) con `{ expire: 0 }`.
- [ ] Implementar (GREEN), sumar `REVALIDATE_SECRET` a los `.env.example` y commit `feat(card): revalidación de la ficha pública al editar`.

### Task 5: Página pública `/e/[token]`

**Files:** `apps/web/src/app/e/[token]/{page.tsx,not-found.tsx}`, `apps/web/src/features/emergency-card/components/{EmergencyCard.tsx,emergency-card.module.css}` (+ `EmergencyCard.test.tsx`), `apps/web/src/features/emergency-card/api.ts`.

**Interfaces:**
- `getPublicCard(token): Promise<PublicCardDto | null>`: `fetch(API_URL + '/public/cards/' + token, { cache: 'force-cache', next: { tags: ['card:'+token] } })`. Con 404 devuelve `null`; con otro error, lanza.
- `page.tsx`: `export const revalidate = 86400`, `generateStaticParams = () => []`, `generateMetadata` con `robots: { index: false, follow: false }` y título "Ficha de emergencia". Si el token no cumple el formato o `null` → `notFound()`.
- `EmergencyCard({ card }: { card: PublicCardDto })` sigue el layout de `ficha-emergencia-v3.html`: barra de llamadas fija abajo en celular y lateral en ≥700px. `tel:107` siempre presente. Los teléfonos de los contactos son `tel:`. "Sin alergias conocidas" cuando `allergies.none`. La etiqueta **ANTICOAG.** se muestra en los anticoagulantes. Si `active: false`, muestra el aviso "Esta ficha todavía no tiene datos de emergencia" y el botón de 107.
- `not-found.tsx`: "Este código no corresponde a ninguna ficha activa", con el botón de 107.

- [ ] Tests (RED): renderiza las alergias en el bloque de alergias; "Sin alergias conocidas"; la etiqueta de anticoagulante; un link `tel:107`; el link `tel:` del contacto; con `insurance` ausente no aparece "Obra social"; muestra la edad y no la fecha de nacimiento.
- [ ] Implementar (GREEN), revisar en celular y escritorio con captura, y commit `feat(card): página pública de la ficha de emergencia`.

### Task 6: Editor de la ficha en el panel

**Files:** `apps/web/src/app/panel/perfiles/[id]/page.tsx`, `apps/web/src/features/medical-record/components/{RecordEditor.tsx,ListField.tsx,VisibilityToggle.tsx,record-editor.module.css}` (+ `RecordEditor.test.tsx`). Modifica `ProfileList` (completion real, link "Editar ficha" y "Ver como el paramédico") y `NewProfileForm` (al crear va a `/panel/perfiles/{id}`).

**Interfaces:**
- `RecordEditor({ profile, initial }: { profile: ProfileDto; initial: { data; visibility } })`: secciones en el orden de la ficha. Cada sección tiene un interruptor "Se ve en mi QR". Las listas (alergias, condiciones, medicación, contactos) permiten agregar y quitar filas, con una casilla "No tengo" para alergias, medicación y condiciones. Al guardar hace `PUT /profiles/:id/record`; si sale bien muestra "Guardado. Tu QR ya muestra estos datos." y la barra de progreso "Ficha al N%".
- Preguntas en lenguaje simple: "¿Sos alérgico a algo?", "¿Tomás algún remedio todos los días?", "¿Tenés alguna enfermedad que un médico debería saber?", "¿A quién llamamos?".
- "Ver como el paramédico" abre `/e/{publicToken}` en una pestaña nueva.

- [ ] Tests (RED): agregar una alergia y guardar envía el payload con `allergies: [{ substance: 'Penicilina' }]`; marcar "No tengo" deshabilita la lista; el interruptor de obra social arranca apagado; un teléfono inválido muestra "Revisá el teléfono" y no envía.
- [ ] Implementar (GREEN) y commit `feat(medical): editor de la ficha en el panel`.

### Task 7: Flujo completo e2e

**Files:** `apps/web/e2e/ficha.spec.ts`, ajuste de `registro-y-perfil.spec.ts` (ahora termina en el editor).

- [ ] Test e2e: registrarse → crear perfil → cargar "Penicilina" y un contacto → guardar → abrir `/e/{token}` → se ve "PENICILINA" y el link `tel:` del contacto → marcar "Medicación" como privada y guardar → recargar `/e/{token}` → ya no aparece la medicación. El webServer del e2e tiene `REVALIDATE_SECRET` y `MEDICAL_DATA_KEY`.
- [ ] Verificación final: `pnpm build && pnpm test && pnpm --filter api test:e2e && pnpm --filter web test:e2e`, y después commit y push.
