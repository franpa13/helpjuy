# Seguridad

## Web (next.config.ts)

Headers en todas las páginas (no en `/api/*`, que responde la API):

- `Content-Security-Policy`: `default-src 'self'`; scripts y estilos propios (`'unsafe-inline'` porque Next hidrata con
  scripts en línea y los nonces obligarían a renderizar cada pedido, perdiendo la ficha pública cacheada); imágenes
  propias, `data:`/`blob:` y los mosaicos de `tile.openstreetmap.org`; `connect-src 'self'`; `frame-ancestors 'none'`;
  `object-src 'none'`; `base-uri` y `form-action 'self'`; `upgrade-insecure-requests` en producción.
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`
  (la ficha pública además `no-referrer`), `Strict-Transport-Security` (2 años), `Permissions-Policy` (ubicación solo
  propia; sin cámara, micrófono, pagos ni USB). Sin `X-Powered-By`.
- Un e2e recorre landing, registro, editor, ficha pública, avisos y familia y falla si la consola reporta una violación de CSP.

## API (configure-app.ts)

- helmet: `default-src 'none'`, `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`,
  `Cross-Origin-Resource-Policy: same-site`, sin `X-Powered-By`.
- Cuerpos JSON de hasta 100 KB; solo `PUT /profiles/:id/photo` acepta hasta 3 MB. Más grande: 413.
- Textos: los caracteres de control se limpian en los contratos (`singleLine` para nombres y datos de una línea,
  `multiLine` para notas, voluntades y cirugías, que conservan los saltos de línea).

## Registro con un email que ya tiene cuenta

Con el ingreso inmediato no se puede ocultar del todo (una cuenta nueva recibe la sesión y una existente no). Mitigación:
límite de 10 intentos por minuto por IP (`AUTH_RATE_LIMIT`; no bajarlo, en celulares muchos comparten IP por CGNAT) y un
email al dueño real ("Alguien intentó crear una cuenta con tu email"), como mucho uno por hora (`User.signupNoticeAt`).
