# Feature: profiles

## Objetivo
Que una cuenta pueda administrar varias fichas (la propia, la de un hijo, la de un padre), cada una con su propio código de QR.

## Reglas
- Un perfil pertenece a un solo usuario (`ownerId`).
- Cada perfil tiene un `publicToken` aleatorio de 128 bits en base64url (22 caracteres). Nunca DNI ni correlativo.
- Rotar el token invalida el anterior de inmediato (el viejo deja de existir).
- Un perfil ajeno o inexistente responde **404** `{ error: 'not_found' }`, nunca 403.
- Crear un perfil exige el consentimiento vigente (ver `docs/specs/consent/spec.md`), en la misma transacción.

## API (con sesión)
| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| GET | `/profiles` | — | 200 `ProfileDto[]` ordenados por creación |
| POST | `/profiles` | `CreateProfileInput` | 201 `ProfileDto` |
| GET | `/profiles/:id` | — | 200 `ProfileDto` · 404 |
| PATCH | `/profiles/:id` | `UpdateProfileInput` | 200 `ProfileDto` · 404 |
| DELETE | `/profiles/:id` | — | 204 · 404 |
| POST | `/profiles/:id/rotate-token` | — | 200 `{ publicToken }` · 404 |

## Criterios de aceptación
- **Dado** un usuario con sesión, **cuando** crea un perfil, **entonces** recibe un `publicToken` de 22 caracteres base64url.
- **Dado** un perfil de otro usuario o un id inexistente, **cuando** lo lee, edita, borra o rota, **entonces** 404 `{ error: 'not_found' }`.
- **Dado** un perfil, **cuando** rota el token, **entonces** el token nuevo es distinto y el viejo ya no existe en la DB.
- **Dado** un usuario, **puede** tener varios perfiles (yo, hijo, padre).
- **Dado** un pedido sin sesión, **entonces** 401.

## Primero tu ficha

- La primera ficha de una cuenta es siempre la del titular (`relationship: SELF`). Sin ella, crear la de otra persona responde `409 self_profile_required`.
- Hay una sola ficha propia por cuenta: una segunda `SELF` responde `409 self_profile_exists` (lock por cuenta para altas simultáneas).
- La ficha propia no se convierte en otra ni al revés (`PATCH` → `409 self_profile_locked`).
- No se puede borrar la ficha propia mientras haya otras a cargo (`409 self_profile_has_dependents`).
- En la web, sin ficha propia el alta no pregunta "¿para quién es?": es la tuya. Con ficha propia se elige entre Hijo/a, Madre/Padre, Pareja u Otro.

## Tope de fichas

- Máximo `MAX_PROFILES_PER_ACCOUNT` (10) fichas por cuenta: la propia más las de la familia. La 11.ª responde `409 profile_limit`.
- El alta de fichas tiene además un límite de 20 por minuto por IP.
- Las fichas de otras personas requieren el email confirmado (`403 email_unverified`); la propia no, para no trabar el registro. La web muestra el pedido de confirmación con el botón de reenviar en lugar del formulario.

## Foto de la ficha

- Opcional. `PUT /profiles/:id/photo { image: base64 }`: el servidor la gira según el celular, la recorta cuadrada (centrada en lo más llamativo), la achica a 320×320 webp y le borra los metadatos (GPS, modelo, fecha). Se guarda cifrada con la misma clave que los datos médicos.
- `POST /profiles/:id/photo/google`: copia la foto de la cuenta de Google, solo a la ficha propia. Solo se descargan URLs `https://*.googleusercontent.com` (sin redirecciones, 8 s, 5 MB máx.). Después ya no depende de Google.
- Visibilidad: sección `photo`, **oculta por defecto**. La ficha pública incluye `photoVersion` solo si es visible, y `GET /public/cards/:token/photo` responde 404 si no lo es. La foto no va impresa.
- En la ficha de un menor, si se marca visible, la web avisa del riesgo.
