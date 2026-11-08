# Métricas

## Tablero propio (`/panel/metricas`)

- `GET /admin/metrics`: solo para los emails de `ADMIN_EMAILS` (API). Cualquier otro recibe 404; sin sesión, 401.
  `GET /auth/me` devuelve `admin: true|false` para mostrar el link.
- Solo agregados: nunca nombres, emails ni datos médicos (un test lo verifica). Para saber si un QR está activo y el
  avance de cada ficha se descifran los registros, pero solo salen totales.
- Contenido: totales (cuentas, verificadas, Google, fichas, de familiares, con foto, avance promedio, actualizadas en
  30 días, escaneos y emergencias en 30 días, grupos y miembros promedio), embudo por cuenta (cuenta → ficha → QR activo
  → impresa → escaneada) y las últimas 8 semanas (cuentas, fichas, escaneos, emergencias).
- Foto diaria (`MetricsSnapshot`, un registro por día de Jujuy) que guarda la limpieza nocturna y el cron externo:
  la evolución no se pierde aunque se borren cuentas o escaneos viejos.
- Gráficos de un solo color (no hay series que distinguir), valores al pasar el mouse o con el foco del teclado, y
  tablas con todos los números.

## Tráfico (Vercel Web Analytics)

- Sin cookies ni identificar personas. Se carga solo en Vercel (`process.env.VERCEL`).
- `redactUrl` reemplaza antes de enviar: `/e/<token>` → `/e/[ficha]` (el token es la llave de la ficha),
  `/unirme/<token>` → `/unirme/[invitacion]`, `/panel/perfiles/<id>` → `/panel/perfiles/[id]`, y saca la query
  (los links de confirmar email y cambiar contraseña llevan el token ahí).
- No usamos Google Analytics, píxeles ni grabación de sesiones.
