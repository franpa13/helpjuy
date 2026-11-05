import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { EmailTokenService } from './email-token.service.js';
import { GoogleAuthController } from './google/google-auth.controller.js';
import { GoogleAuthService } from './google/google-auth.service.js';
import { createGoogleOAuth } from './google/google-oauth.client.js';
import { GoogleOAuth } from './google/google-oauth.js';
import { SessionGuard } from './session.guard.js';
import { SessionService } from './session.service.js';

@Module({
  controllers: [AuthController, GoogleAuthController],
  providers: [
    AuthService,
    SessionService,
    SessionGuard,
    EmailTokenService,
    GoogleAuthService,
    { provide: GoogleOAuth, useFactory: () => createGoogleOAuth(process.env) },
  ],
  exports: [SessionService, SessionGuard],
})
export class AuthModule {}
