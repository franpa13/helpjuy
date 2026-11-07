# Tu cuenta y escaneos

## Descargar mis datos (Ley 25.326, art. 14 — acceso)

- `GET /account/export` (con sesión): JSON descargable `helpjuy-mis-datos-AAAA-MM-DD.json`, `Cache-Control: private, no-store`.
- Incluye: cuenta (email, verificado, alta, si usa Google o contraseña — nunca el hash), cada ficha con su registro médico descifrado, visibilidad, foto (data URL), consentimientos, avisos de emergencia (sin suprimidos ni pruebas), escaneos, y los grupos (nombre, rol, silenciado, cantidad de miembros).
- No incluye datos de otras personas (ni nombres ni emails de los demás miembros).

## Borrar la cuenta (art. 16 — supresión)

- `DELETE /account { confirm: "BORRAR" }`. Sale de cada grupo con la misma regla que "Salir del grupo" (siempre queda un admin; un grupo vacío se borra), borra el usuario y en cascada fichas, registros, fotos, consentimientos, avisos, escaneos, sesiones y tokens. Invalida las fichas públicas cacheadas y borra la cookie.
- La web pide escribir BORRAR en un AlertDialog y vuelve a la landing con un aviso.

## Escaneos ("Sabés cuándo lo escanean")

- La ficha pública (cacheada) llama a `POST /public/cards/:token/scan` al abrirse, con la cookie: si quien la abre es el titular, no cuenta.
- Se guarda solo la fecha (`CardScan`: id, ficha, fecha). Sin IP ni datos de quien la abrió.
- Varios escaneos dentro de 10 minutos cuentan como uno. Email al titular (si confirmó el email) como mucho uno por hora por ficha.
- `GET /scans`: los de mis fichas (máx. 100). Se borran a los 90 días.

## QR nuevo

- En la pantalla de imprimir: "Generar QR nuevo" con confirmación (`POST /profiles/:id/rotate-token`). El link viejo responde 404 al instante.

## Consentimiento

- Versión `2026-11-07`: suma la foto, el registro de escaneos y la ubicación de los avisos.
