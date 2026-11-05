import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/configure-app.js';
import { CardCache } from '../../src/features/emergency-card/card-cache.js';
import { Mailer } from '../../src/features/mail/mailer.js';
import { FakeCardCache } from './fake-card-cache.js';
import { FakeMailer } from './fake-mailer.js';

export async function createTestApp(
  overrides: { mailer?: Mailer; cardCache?: CardCache } = {},
): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(Mailer)
    .useValue(overrides.mailer ?? new FakeMailer())
    .overrideProvider(CardCache)
    .useValue(overrides.cardCache ?? new FakeCardCache())
    .compile();
  const app = configureApp(moduleRef.createNestApplication());
  await app.init();
  return app;
}
