import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type MeResponse,
  type RegisterInput,
} from '@helpjuy/contracts';
import type { User } from '../../generated/prisma/client.js';
import { ZodValidationPipe } from '../../shared/zod-validation.pipe.js';
import { AuthService, toMe } from './auth.service.js';
import { CurrentUser } from './current-user.decorator.js';
import { SessionGuard } from './session.guard.js';
import { SESSION_COOKIE, SESSION_TTL_MS, SessionService } from './session.service.js';

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
});

@Throttle({ default: { limit: 10, ttl: 60_000 } })
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly sessions: SessionService,
  ) {}

  @Post('register')
  async register(
    @Body(new ZodValidationPipe(registerSchema)) body: RegisterInput,
    @Res({ passthrough: true }) res: Response,
  ): Promise<MeResponse> {
    const { user, token } = await this.auth.register(body);
    res.cookie(SESSION_COOKIE, token, { ...cookieOptions(), maxAge: SESSION_TTL_MS });
    return toMe(user);
  }

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
}
