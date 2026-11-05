import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/configure-app.js';
import { GoogleOAuth } from '../../src/features/auth/google/google-oauth.js';
import { CardCache } from '../../src/features/emergency-card/card-cache.js';
import { Mailer } from '../../src/features/mail/mailer.js';
import { FakeCardCache } from './fake-card-cache.js';
import { FakeGoogleOAuth } from './fake-google.js';
import { FakeMailer } from './fake-mailer.js';

export async function createTestApp(
  overrides: { mailer?: Mailer; cardCache?: CardCache; google?: GoogleOAuth | null } = {},
): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(Mailer)
    .useValue(overrides.mailer ?? new FakeMailer())
    .overrideProvider(CardCache)
    .useValue(overrides.cardCache ?? new FakeCardCache())
    .overrideProvider(GoogleOAuth)
    .useValue(overrides.google === undefined ? new FakeGoogleOAuth() : overrides.google)
    .compile();
  const app = configureApp(moduleRef.createNestApplication());
  await app.init();
  return app;
}
