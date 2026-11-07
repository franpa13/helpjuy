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
