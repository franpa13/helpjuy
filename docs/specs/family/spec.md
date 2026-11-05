# Feature: family (grupos familiares y avisos de emergencia)

> Se construye en el Plan 3, junto con `scan-log`. Decisiones marcadas *(diseñador)* las tomó quien escribió el diseño; el resto lo pidió o aprobó el autor.

## Objetivo
Que la familia de una persona se entere en seguida si alguien escanea su QR y marca que es una emergencia, sin asustarla con cada escaneo casual.

## Conceptos
- **Grupo familiar**: conjunto de cuentas conectadas, con un nombre ("Familia Mamani").
- **Miembro**: una cuenta que aceptó la invitación. Rol `ADMIN` (quien lo creó) o `MEMBER`.
- **Aviso de emergencia**: lo dispara quien escanea, con un botón explícito en la ficha pública.

## Reglas
1. Cualquier usuario puede crear grupos. **Una persona puede estar en varios grupos** *(diseñador)*.
2. Se invita por email o con un link compartible (por ejemplo por WhatsApp). El link vence en 7 días y es de un solo uso *(diseñador)*. El invitado necesita su propia cuenta y **tiene que aceptar**: el consentimiento es de las dos partes.
3. El `ADMIN` invita y saca miembros. Cualquier miembro puede salir cuando quiera *(diseñador)*. Si el admin sale, el rol pasa al miembro más antiguo; si no queda nadie, el grupo se borra *(diseñador)*.
4. **Estar en un grupo no da acceso a los datos médicos** de otros miembros. Solo sirve para recibir avisos.
5. **Escaneo normal**: solo se registra y se le avisa al dueño de la ficha (feature `scan-log`). **Nunca** se avisa a la familia por un escaneo normal.
6. **Emergencia**: quien escanea toca "Es una emergencia: avisar a la familia". Se avisa a **todos los miembros de todos los grupos** del dueño de la ficha, excepto a quien silenció ese grupo.
7. Perfiles sin cuenta propia (por ejemplo, un hijo menor) avisan a los grupos del adulto que los administra *(diseñador)*.
8. Límite: como máximo **un aviso de emergencia cada 10 minutos por perfil**. Los toques siguientes dentro de esa ventana se registran pero no reenvían *(diseñador)*.
9. **Ubicación**: solo si quien escanea la permite en su navegador. Se guarda aproximada (redondeada a unos 100 m) y se borra a los 30 días *(diseñador)*.
10. Cada miembro puede **silenciar** un grupo (deja de recibir sus avisos) sin salir de él *(diseñador)*.

## Canales (todos gratuitos)
- **Email**, por Resend.
- **Notificación push web**, por Web Push con claves VAPID. Funciona sin instalar nada en Android; en iPhone requiere agregar la web a la pantalla de inicio.
- **WhatsApp desde el celular de quien escanea**: el botón "Avisar por WhatsApp a {contacto}" abre `https://wa.me/{numero}?text=...` con el mensaje ya escrito. No tiene costo para HelpJuy.
- SMS y la API oficial de WhatsApp quedan **fuera de alcance**, porque cobran por mensaje.

## Texto del aviso (tono cuidadoso, no alarmista)
> **Posible emergencia: {Nombre}**
> Alguien escaneó la ficha de {Nombre} a las {hora} y marcó que es una emergencia{, cerca de {ubicación}}. Puede no ser real. Intentá llamarla. Si no responde, llamá al 107.

## Ficha pública: botones nuevos
Debajo de "Llamar al 107" y "Llamar a {contacto}":
- **Es una emergencia: avisar a la familia**. Pide confirmación ("¿Avisamos a la familia de {Nombre}?") y, de forma opcional, la ubicación.
- **Avisar por WhatsApp a {contacto}**.

## Modelo de datos (orientativo)
- `FamilyGroup { id, name, createdById, createdAt }`
- `FamilyMember { groupId, userId, role: ADMIN|MEMBER, muted: boolean, joinedAt }`, con clave única `(groupId, userId)`
- `FamilyInvite { id, groupId, tokenHash, email?, invitedById, expiresAt, usedAt? }`
- `EmergencyAlert { id, profileId, createdAt, lat?, lng?, notifiedCount, suppressed: boolean }`
- `PushSubscription { id, userId, endpoint, keys, createdAt }`

## API (orientativa)
| Método | Ruta | Quién |
|---|---|---|
| GET/POST | `/family-groups` | con sesión |
| GET/PATCH/DELETE | `/family-groups/:id` | miembro / admin |
| POST | `/family-groups/:id/invites` | admin → `{ link }` |
| POST | `/family-invites/:token/accept` | con sesión |
| DELETE | `/family-groups/:id/members/:userId` | admin, o uno mismo para salir |
| PATCH | `/family-groups/:id/me` `{ muted }` | miembro |
| POST | `/e/:token/emergency` `{ lat?, lng? }` | público, con rate limit |
| POST | `/push/subscriptions` | con sesión |

## Criterios de aceptación
- **Dado** un usuario, **cuando** crea un grupo, **entonces** queda como `ADMIN` y único miembro.
- **Dada** una invitación, **cuando** otra cuenta la acepta, **entonces** pasa a ser `MEMBER`. Si el link venció o ya se usó, recibe 400 `invalid_token`.
- **Dado** un miembro de un grupo, **cuando** pide la ficha médica de otro miembro por la API privada, **entonces** recibe 404, porque el grupo no da acceso a datos.
- **Dado** un escaneo normal, **entonces** no se le envía nada a la familia.
- **Dado** un toque en "Es una emergencia", **entonces** se avisa por email y push a cada miembro no silenciado de cada grupo del dueño, una sola vez por persona aunque comparta varios grupos.
- **Dado** un segundo toque dentro de 10 minutos, **entonces** se registra con `suppressed: true` y no se reenvía.
- **Dado** que quien escanea no da permiso de ubicación, **entonces** el aviso sale igual, sin ubicación.
- **Dado** un miembro que sale del grupo, **entonces** deja de recibir avisos de inmediato.
- **Dado** un perfil de un menor, **cuando** se marca emergencia, **entonces** se avisa a los grupos del adulto que lo administra.
