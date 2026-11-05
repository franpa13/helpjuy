import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './features/auth/auth.module.js';
import { ConsentModule } from './features/consent/consent.module.js';
import { HealthController } from './features/health/health.controller.js';
import { MailModule } from './features/mail/mail.module.js';
import { ProfilesModule } from './features/profiles/profiles.module.js';
import { PrismaModule } from './shared/prisma/prisma.module.js';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    MailModule,
    AuthModule,
    ConsentModule,
    ProfilesModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
