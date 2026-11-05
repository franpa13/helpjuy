import type { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';

/** Configuración compartida entre main.ts y los tests e2e. */
export function configureApp(app: INestApplication): INestApplication {
  app.use(cookieParser());
  // Detrás del proxy de Render/Vercel la IP real llega en X-Forwarded-For.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  return app;
}
