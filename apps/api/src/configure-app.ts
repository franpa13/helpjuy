import type { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { json } from 'express';
import helmet from 'helmet';
import { requireProxy } from './shared/require-proxy.js';

/** Cuerpos JSON: chicos en general; la foto (ya achicada en el navegador, en base64) puede pesar más. */
const JSON_LIMIT = '100kb';
const PHOTO_JSON_LIMIT = '3mb';
const PHOTO_ROUTE = /^\/profiles\/[^/]+\/photo$/;

/** Configuración compartida entre main.ts y los tests e2e. */
export function configureApp(app: INestApplication): INestApplication {
  const http = app.getHttpAdapter().getInstance();
  // Detrás del proxy de Render/Vercel la IP real llega en X-Forwarded-For.
  http.set('trust proxy', 1);
  // La API solo devuelve JSON e imágenes: nada se puede embeber ni ejecutar, y no decimos qué servidor es.
  app.use(
    helmet({
      contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
      frameguard: { action: 'deny' },
      referrerPolicy: { policy: 'no-referrer' },
      crossOriginResourcePolicy: { policy: 'same-site' },
    }),
  );
  app.use(requireProxy());
  app.use(cookieParser());
  // Primero el parser con límite grande solo para la foto; el resto queda con el límite chico.
  // (Si un parser ya leyó el cuerpo, el siguiente lo saltea.)
  app.use(PHOTO_ROUTE, json({ limit: PHOTO_JSON_LIMIT }));
  app.use(json({ limit: JSON_LIMIT }));
  return app;
}
