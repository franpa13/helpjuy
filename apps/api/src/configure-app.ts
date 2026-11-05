import type { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';

/** Configuración compartida entre main.ts y los tests e2e. */
export function configureApp(app: INestApplication): INestApplication {
  app.use(cookieParser());
  return app;
}
