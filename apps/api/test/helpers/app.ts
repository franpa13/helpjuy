import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/configure-app.js';
import { Mailer } from '../../src/features/mail/mailer.js';
import { FakeMailer } from './fake-mailer.js';

export async function createTestApp(overrides: { mailer?: Mailer } = {}): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(Mailer)
    .useValue(overrides.mailer ?? new FakeMailer())
    .compile();
  const app = configureApp(moduleRef.createNestApplication());
  await app.init();
  return app;
}
