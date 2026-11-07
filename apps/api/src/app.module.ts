import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { AccountModule } from './features/account/account.module.js';
import { AuthModule } from './features/auth/auth.module.js';
import { ConsentModule } from './features/consent/consent.module.js';
import { CardCacheModule } from './features/emergency-card/card-cache.js';
import { EmergencyCardModule } from './features/emergency-card/emergency-card.module.js';
import { FamilyModule } from './features/family/family.module.js';
import { HealthController } from './features/health/health.controller.js';
import { MailModule } from './features/mail/mail.module.js';
import { MaintenanceModule } from './features/maintenance/maintenance.module.js';
import { MedicalRecordModule } from './features/medical-record/medical-record.module.js';
import { ProfilesModule } from './features/profiles/profiles.module.js';
import { CryptoModule } from './shared/crypto/medical-cipher.js';
import { ClientIpThrottlerGuard } from './shared/client-ip-throttler.guard.js';
import { PrismaModule } from './shared/prisma/prisma.module.js';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    CryptoModule,
    CardCacheModule,
    MailModule,
    AuthModule,
    ConsentModule,
    ProfilesModule,
    MedicalRecordModule,
    EmergencyCardModule,
    FamilyModule,
    AccountModule,
    MaintenanceModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ClientIpThrottlerGuard }],
})
export class AppModule {}
