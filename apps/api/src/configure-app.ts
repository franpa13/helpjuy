import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';

/** Configuración compartida entre main.ts y los tests e2e. */
export function configureApp(app: INestApplication): INestApplication {
  app.use(cookieParser());
  // La foto de la ficha viaja en base64 (ya achicada en el navegador): un poco más que el límite por defecto.
  (app as NestExpressApplication).useBodyParser('json', { limit: '3mb' });
  // Detrás del proxy de Render/Vercel la IP real llega en X-Forwarded-For.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  return app;
}
