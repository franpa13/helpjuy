# Feature: auth

## Objetivo
Permitir que una persona cree su cuenta e ingrese de forma simple y segura, para administrar sus fichas de emergencia.

## Alcance
- Incluye: registro e ingreso con email y contraseña, sesión por cookie, cierre de sesión, consulta del usuario actual, verificación de email y recuperación de contraseña.
- Incluye también: ingreso y registro con Google (OAuth 2.0 + OpenID Connect con PKCE).

## Reglas
- Email normalizado (`trim` + minúsculas) antes de guardar o buscar.
- Contraseña de 8 a 128 caracteres, guardada con argon2id (`@node-rs/argon2`).
- Sesión: token aleatorio de 32 bytes en la cookie `hj_session` (httpOnly, `Secure` en producción, `SameSite=Lax`, `Path=/`, 30 días). En la DB se guarda solo el sha256 (hex).
- Se puede usar la app sin email verificado; `emailVerified` lo indica.
- Rate limit en `/auth/*`: 10 solicitudes por minuto por IP.

## API
| Método | Ruta | Cuerpo | Respuesta |
|---|---|---|---|
| POST | `/auth/register` | `{ email, password }` | 201 `MeResponse` + cookie · 409 `email_taken` · 400 `validation` |
| POST | `/auth/login` | `{ email, password }` | 200 `MeResponse` + cookie · 401 `invalid_credentials` |
| POST | `/auth/logout` | — | 204, borra la cookie |
| GET | `/auth/me` | — | 200 `MeResponse` · 401 `unauthenticated` |
| POST | `/auth/verify-email` | `{ token }` | 204 · 400 `invalid_token` |
| POST | `/auth/resend-verification` | — (con sesión) | 204 |
| POST | `/auth/forgot-password` | `{ email }` | 204 siempre |
| POST | `/auth/reset-password` | `{ token, password }` | 204 · 400 `invalid_token` |

`MeResponse = { id: string; email: string; emailVerified: boolean }`

## Criterios de aceptación

### Registro e ingreso
- **Dado** un email nuevo, **cuando** se registra, **entonces** se crea el usuario, queda con sesión iniciada y se le envía un email de verificación.
- **Dado** un email ya registrado (con cualquier combinación de mayúsculas o espacios), **cuando** se registra, **entonces** recibe 409 `email_taken`.
- **Dado** un usuario sin email verificado, **cuando** ingresa, **entonces** puede usar la app y `emailVerified` es `false`.
- **Dadas** credenciales incorrectas, **cuando** ingresa, **entonces** recibe 401 `invalid_credentials`, sin distinguir un email inexistente de una contraseña errónea.
- **Dada** una sesión vencida o cerrada, **cuando** llama a `/auth/me`, **entonces** recibe 401.
- **Dadas** 11 solicitudes en un minuto a `/auth/login` desde la misma IP, **entonces** la 11ª recibe 429.

### Verificación y recuperación
- **Dado** un registro, **cuando** abre el link de verificación, **entonces** `emailVerified` pasa a `true`.
- **Dado** un link ya usado o vencido, **cuando** se usa, **entonces** recibe 400 `invalid_token` y nada cambia.
- **Dado** un email existente o inexistente, **cuando** pide recuperar la contraseña, **entonces** recibe 204 en los dos casos (solo el existente recibe email).
- **Dado** un reset exitoso, **entonces** todas las sesiones anteriores quedan cerradas y puede ingresar con la contraseña nueva.
- Los links vencen: verificación en 24 h, restablecimiento en 1 h.

### Google
- `GET /auth/google?next=…`: genera `state` y un verificador PKCE, los guarda en la cookie temporal `hj_oauth` (httpOnly, 10 min) y redirige a Google con `scope=openid email`.
- `GET /auth/google/callback`: compara el `state` en tiempo constante, canjea el código con el verificador, **verifica la firma y la audiencia del id_token** y exige `email_verified`.
- `redirect_uri` = `{WEB_URL}/api/auth/google/callback`, así la sesión queda en el dominio de la web.
- Vinculación por email:
  - si no existe cuenta, se crea ya verificada y sin contraseña;
  - si existe y su email estaba verificado, se le suma Google y la contraseña sigue sirviendo;
  - si existe y su email **nunca se verificó**, se borra esa contraseña y se cierran sus sesiones: cualquiera pudo haberla creado con un email ajeno, y Google acaba de probar quién es el dueño.
- `next` solo acepta rutas internas. Cualquier error vuelve a `/ingresar?error=google|google_email|google_disabled`.
- Sin `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` en la API, Google queda desactivado. La web muestra el botón solo con `GOOGLE_AUTH_ENABLED=true`.

#### Criterios
- **Dado** un usuario nuevo, **cuando** vuelve de Google con el email verificado, **entonces** se crea la cuenta verificada, queda con sesión y va a `next` (o `/panel`).
- **Dado** un `state` distinto o sin la cookie temporal, **entonces** vuelve a `/ingresar?error=google` sin sesión.
- **Dado** un email de Google no verificado, **entonces** `/ingresar?error=google_email`.
- **Dada** una cuenta existente sin verificar con ese email, **cuando** entra con Google, **entonces** la contraseña anterior deja de servir y sus sesiones se cierran.
- **Dado** `next=//evil.com`, **entonces** va a `/panel`.
