import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { SESSION_COOKIE, SESSION_TTL_MS } from '../session.service.js';
import { GoogleAuthError, GoogleAuthService, type OAuthPending } from './google-auth.service.js';

const OAUTH_COOKIE = 'hj_oauth';
const OAUTH_TTL_MS = 10 * 60 * 1000;

const cookieBase = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const, // Lax: viaja en la redirección de vuelta desde Google (navegación GET)
  path: '/',
});

const encode = (p: OAuthPending) => Buffer.from(JSON.stringify(p)).toString('base64url');

function decode(raw: unknown): OAuthPending | null {
  if (typeof raw !== 'string') return null;
  try {
    const p = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as Partial<OAuthPending>;
    return typeof p.state === 'string' && typeof p.verifier === 'string' && typeof p.next === 'string'
      ? (p as OAuthPending)
      : null;
  } catch {
    return null;
  }
}

@Throttle({ default: { limit: 10, ttl: 60_000 } })
@Controller('auth/google')
export class GoogleAuthController {
  constructor(private readonly google: GoogleAuthService) {}

  @Get()
  start(@Query('next') next: unknown, @Res() res: Response): void {
    if (!this.google.enabled) return res.redirect(302, '/ingresar?error=google_disabled');
    const { url, pending } = this.google.start(next);
    res.cookie(OAUTH_COOKIE, encode(pending), { ...cookieBase(), maxAge: OAUTH_TTL_MS });
    res.redirect(302, url);
  }

  @Get('callback')
  async callback(@Query() query: { code?: unknown; state?: unknown }, @Req() req: Request, @Res() res: Response) {
    res.clearCookie(OAUTH_COOKIE, cookieBase());
    if (!this.google.enabled) return res.redirect(302, '/ingresar?error=google_disabled');
    try {
      const { token, next } = await this.google.finish(query, decode(req.cookies?.[OAUTH_COOKIE]));
      res.cookie(SESSION_COOKIE, token, { ...cookieBase(), maxAge: SESSION_TTL_MS });
      return res.redirect(302, next);
    } catch (err) {
      const code = err instanceof GoogleAuthError ? err.code : 'google';
      return res.redirect(302, `/ingresar?error=${code}`);
    }
  }
}
