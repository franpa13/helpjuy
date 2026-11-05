# Plan 3a — Grupos familiares y avisos de emergencia

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Que una cuenta cree grupos familiares, invite a otras cuentas por link (WhatsApp o copiar), y que quien escanee un QR pueda avisar a la familia de esa persona con un toque.

**Architecture:** Feature `family` en la API (grupos, miembros, invitaciones) y `emergency-alert` (aviso público con rate limit y deduplicación). Los avisos salen por email (`Mailer`). En la web: `/panel/familia`, `/unirme/[token]` y botones nuevos en la ficha pública.

**Spec:** `docs/specs/family/spec.md` (se actualiza en Task 1). Diseño general §6.8.

## Global Constraints
- Estar en un grupo **no da acceso a datos médicos** de otros miembros.
- Invitación: link de un solo uso, vence a los **7 días**; token aleatorio de 32 bytes guardado como sha256. El invitado necesita cuenta y **acepta explícitamente**.
- Roles: `ADMIN` (creador) y `MEMBER`. El admin invita, renombra, saca miembros, cancela invitaciones, borra el grupo y manda "Probar aviso". Cualquiera sale o silencia.
- Si sale el último admin: pasa a ser admin el miembro más antiguo; si no queda nadie, se borra el grupo.
- Aviso de emergencia: `POST /public/cards/:token/emergency`. Destinatarios: **el dueño de la ficha + todos los miembros no silenciados de todos los grupos del dueño**, sin duplicar personas. **Máximo 1 envío cada 10 minutos por perfil**; los siguientes se registran con `suppressed: true`. Rate limit de 5 por minuto por IP.
- Ubicación opcional: se redondea a 3 decimales (~100 m) y se guarda en `EmergencyAlert`.
- Texto del aviso, cuidadoso: "Posible emergencia: {Nombre} … Puede no ser real. Intentá llamarla. Si no responde, llamá al 107."
- "Probar aviso" manda el asunto con el prefijo **[PRUEBA]** y el texto "Esto es una prueba, no pasó nada".
- Ningún 403: lo ajeno o inexistente responde 404 `not_found`; las acciones sin permiso dentro de un grupo propio, 403 `forbidden`.

## Review Focus
1. Un miembro del grupo **no puede leer la ficha privada** de otro miembro (`/profiles/:id/record` → 404).
2. **Doble toque** en "avisar a la familia" dentro de 10 minutos → un solo envío.
3. **Invitación reusada, vencida o cancelada** → 400 `invalid_token`; aceptarla estando ya en el grupo no duplica al miembro.
4. **El último admin sale** → el grupo sigue con un nuevo admin, o se borra si queda vacío.
5. **Alguien que está en dos grupos** con la misma persona recibe un solo email.

### Task 1: Modelo y spec
Prisma: `FamilyGroup {id, name, createdAt}`, `FamilyMember {groupId, userId, role FamilyRole, muted Boolean, joinedAt; @@id([groupId,userId])}`, `FamilyInvite {id, groupId, tokenHash @unique, invitedById, expiresAt, usedAt?, revokedAt?, createdAt}`, `EmergencyAlert {id, profileId, createdAt, lat Float?, lng Float?, notified Int, suppressed Boolean, test Boolean}`. Actualizar `resetDb`. Actualizar la spec con los destinatarios (dueño incluido) y "Probar aviso". Contracts: `familyGroupSchema` (name 1–60), DTOs.

### Task 2: API de grupos
`GET/POST /family-groups`, `PATCH/DELETE /family-groups/:id`, `POST /family-groups/:id/invites` → `{ token, url, expiresAt }`, `GET /family-groups/:id/invites`, `DELETE /family-groups/:id/invites/:inviteId`, `GET /family-invites/:token` (preview, sin sesión: `{ groupName, inviterName, memberCount }`), `POST /family-invites/:token/accept`, `DELETE /family-groups/:id/members/:userId`, `PATCH /family-groups/:id/me {muted}`. Tests e2e de cada regla y de la Review Focus 1, 3 y 4.

### Task 3: Avisos
`POST /public/cards/:token/emergency {lat?, lng?}` → `{ notified: number }` y `POST /family-groups/:id/test-alert` (admin). Servicio `EmergencyAlertService.recipients(profileId)` deduplicado. Tests: destinatarios, deduplicación entre grupos, silenciados, ventana de 10 minutos, redondeo de ubicación, prefijo [PRUEBA].

### Task 4: Web — Familia en el panel
`/panel/familia`: crear grupo, lista de miembros (iniciales, rol, "Vos"), invitaciones pendientes, invitar (copiar link y "Compartir por WhatsApp" con `https://wa.me/?text=`), silenciar, salir, sacar, renombrar, probar aviso. Link "Familia" en el panel y una sugerencia si no tiene grupos. `/unirme/[token]`: preview, explicación, "Unirme" (sin sesión → `/ingresar?next=/unirme/{token}`).

### Task 5: Web — ficha pública
Botón **"Es una emergencia: avisar a la familia"**: confirma, pide la ubicación de forma opcional, muestra "Avisamos a N personas". Botón **"Avisar por WhatsApp a {contacto}"** (`https://wa.me/{numero}?text=`).

### Task 6: e2e y verificación
Dos usuarios: A crea el grupo e invita, B se une por el link. Se escanea la ficha de A, se marca emergencia y aparece "Avisamos a 2 personas". Suite completa, commit y push solo si todo pasa.
