# Limpieza y retención de datos

`MaintenanceService.run()` corre todas las noches (04:00, hora de Jujuy) con `@nestjs/schedule` y se puede disparar desde
un cron externo con `POST /internal/maintenance` + header `x-maintenance-secret` (`MAINTENANCE_SECRET`), porque en el
plan gratis la API se duerme y el cron interno no corre.

| Qué | Cuándo se borra |
|---|---|
| Sesiones | Al vencer (30 días) |
| Tokens de email (verificar, recuperar contraseña) | Al vencer, o un día después de usados |
| Invitaciones a grupos | Al vencer, usarse o cancelarse |
| Ubicación de un aviso de emergencia | A los 30 días (el aviso queda, sin ubicación) |
| Escaneos de la ficha | A los 90 días |

Las pantallas filtran igual por fecha (avisos 30 días, escaneos 90), así que lo vencido no se muestra aunque la limpieza
todavía no haya corrido. No hay limpiezas "de rebote" en el camino de una emergencia.

## Base de datos

- La foto de la ficha vive en `ProfilePhoto` (1 a 1 con `Profile`): las consultas de fichas no la traen si no hace falta.
- Índices: `EmergencyAlert(createdAt)` y `CardScan(createdAt)` para la limpieza; `(profileId, createdAt)` para los historiales.
- Producción (Neon, Frankfurt): `DATABASE_URL` con pooler para la app (pool de `DB_POOL_MAX`, 5 por defecto) y
  `DIRECT_URL` sin pooler para las migraciones.
