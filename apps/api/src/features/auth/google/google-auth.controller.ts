import { Catch, Controller, Get, Query, Req, Res, UseFilters, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import { Throttle, ThrottlerException } from '@nestjs/throttler';
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

/**
 * El ingreso con Google es una navegación del navegador: si se pasa del límite, lo mandamos a /ingresar con
 * un aviso en vez de mostrarle un JSON con el 429.
 */
@Catch(ThrottlerException)
class GoogleRateLimitFilter implements ExceptionFilter {
  catch(_err: ThrottlerException, host: ArgumentsHost) {
    host.switchToHttp().getResponse<Response>().redirect(302, '/ingresar?error=rate_limited');
  }
}

// La contraseña la valida Google, acá no hay nada que adivinar: el límite solo frena abusos. Es generoso porque
// en Argentina las compañías de celular hacen que mucha gente comparta la misma IP (CGNAT).
@Throttle({ default: { limit: 40, ttl: 60_000 } })
@UseFilters(GoogleRateLimitFilter)
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
