# Feature: emergency-card (ficha pública del QR)

## Objetivo
Que quien escanea el QR (un paramédico o un testigo) vea al instante, sin iniciar sesión, la información de emergencia que el titular eligió mostrar.

## Reglas
- URL pública: `/e/{token}`, con un token de 22 caracteres base64url.
- La API pública solo devuelve las **secciones marcadas como públicas**. Una sección privada no aparece ni como clave vacía.
- **Nunca** se devuelve la fecha de nacimiento (solo la edad, calculada en hora de Jujuy), ni DNI, domicilio, email, id del perfil o del dueño.
- `X-Robots-Tag: noindex, nofollow` y `Cache-Control: no-store` en la API. En la web, metadata `robots: noindex, nofollow`.
- Rate limit de 60 solicitudes por minuto por IP. Un token inexistente responde 404 `not_found`, sin distinguir si existió.
- La web cachea la página (ISR, tag `card:{token}`) y la API la invalida al cambiar la ficha. Ver la Task 4 del Plan 2.

## API
| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/public/cards/:token` | 200 `PublicCardDto` · 404 `not_found` |

## Criterios de aceptación
- **Dada** una ficha con todo público, **entonces** la respuesta trae identidad, signos, alergias, medicación y contactos.
- **Dada** la obra social marcada como privada, **entonces** la clave `insurance` no aparece.
- **Dada** cualquier ficha, **entonces** la respuesta no contiene `birthDate`, `email`, `id`, `ownerId` ni `publicToken`.
- **Dada** una fecha de nacimiento, **entonces** se informa `identity.age`.
- **Dado** un perfil sin ficha, **entonces** se devuelve el nombre con `active: false` y sin secciones médicas.
- **Dado** un token que no existe, **entonces** 404 `not_found`.
- **Dada** cualquier respuesta, **entonces** tiene el header `X-Robots-Tag: noindex, nofollow`.
