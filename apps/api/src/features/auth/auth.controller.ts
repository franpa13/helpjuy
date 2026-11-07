import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  tokenSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type MeResponse,
  type RegisterInput,
  type ResetPasswordInput,
  type TokenInput,
} from '@helpjuy/contracts';
import type { User } from '../../generated/prisma/client.js';
import { ZodValidationPipe } from '../../shared/zod-validation.pipe.js';
import { AuthService, toMe } from './auth.service.js';
import { CurrentUser } from './current-user.decorator.js';
import { SessionGuard } from './session.guard.js';
import { SESSION_COOKIE, SESSION_TTL_MS, SessionService, sessionCookieOptions } from './session.service.js';

// Límite estricto solo en las acciones sensibles; /auth/me queda con el global.
const STRICT = { default: { limit: 10, ttl: 60_000 } };

const cookieOptions = sessionCookieOptions;


@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionService,
  ) {}

  @Throttle(STRICT)
  @Post('register')
  async register(
    @Body(new ZodValidationPipe(registerSchema)) body: RegisterInput,
    @Res({ passthrough: true }) res: Response,
  ): Promise<MeResponse> {
    const { user, token } = await this.auth.register(body);
    res.cookie(SESSION_COOKIE, token, { ...cookieOptions(), maxAge: SESSION_TTL_MS });
    return toMe(user);
  }

  @Throttle(STRICT)
  @Post('login')
  @HttpCode(200)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginInput,
    @Res({ passthrough: true }) res: Response,
  ): Promise<MeResponse> {
    const { user, token } = await this.auth.login(body);
    res.cookie(SESSION_COOKIE, token, { ...cookieOptions(), maxAge: SESSION_TTL_MS });
    return toMe(user);
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    await this.sessions.revoke(req.cookies?.[SESSION_COOKIE]);
    res.clearCookie(SESSION_COOKIE, cookieOptions());
  }

  @Get('me')
  @UseGuards(SessionGuard)
  me(@CurrentUser() user: User): MeResponse {
    return toMe(user);
  }

  @Throttle(STRICT)
  @Post('verify-email')
  @HttpCode(204)
  async verifyEmail(@Body(new ZodValidationPipe(tokenSchema)) body: TokenInput): Promise<void> {
    await this.auth.verifyEmail(body.token);
  }

  @Throttle(STRICT)
  @Post('resend-verification')
  @HttpCode(204)
  @UseGuards(SessionGuard)
  async resendVerification(@CurrentUser() user: User): Promise<void> {
    if (user.emailVerifiedAt) return;
    await this.auth.sendVerification(user);
  }

  @Throttle(STRICT)
  @Post('forgot-password')
  @HttpCode(204)
  async forgotPassword(@Body(new ZodValidationPipe(forgotPasswordSchema)) body: ForgotPasswordInput): Promise<void> {
    await this.auth.forgotPassword(body.email);
  }

  @Throttle(STRICT)
  @Post('reset-password')
  @HttpCode(204)
  async resetPassword(@Body(new ZodValidationPipe(resetPasswordSchema)) body: ResetPasswordInput): Promise<void> {
    await this.auth.resetPassword(body.token, body.password);
  }
}
