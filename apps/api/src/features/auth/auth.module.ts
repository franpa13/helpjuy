import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { EmailTokenService } from './email-token.service.js';
import { SessionGuard } from './session.guard.js';
import { SessionService } from './session.service.js';

@Module({
  controllers: [AuthController],
  providers: [AuthService, SessionService, SessionGuard, EmailTokenService],
  exports: [SessionService, SessionGuard],
})
export class AuthModule {}
