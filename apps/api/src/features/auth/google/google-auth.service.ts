import { Inject, Injectable, Logger } from '@nestjs/common';
import { createHash, timingSafeEqual } from 'node:crypto';
import { isGooglePhotoUrl } from '../../profiles/image-fetcher.js';
import type { User } from '../../../generated/prisma/client.js';
import { randomToken } from '../../../shared/crypto/tokens.js';
import { PrismaService } from '../../../shared/prisma/prisma.service.js';
import { SessionService } from '../session.service.js';
import { GoogleOAuth, type GoogleIdentity } from './google-oauth.js';

export type OAuthPending = { state: string; verifier: string; next: string };

/** Solo rutas internas: evita que un link trampa mande a otro sitio después de ingresar. */
export function safeNext(next: unknown, fallback = '/panel'): string {
  if (typeof next !== 'string' || !next.startsWith('/')) return fallback;
  try {
    const base = 'http://helpjuy.invalid';
    const u = new URL(next, base);
    return u.origin === base ? u.pathname + u.search : fallback;
  } catch {
    return fallback;
  }
}

const sameString = (a: string, b: string) => {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
};

export class GoogleAuthError extends Error {
  constructor(public readonly code: 'google' | 'google_email') {
    super(code);
  }
}

@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger('GoogleAuth');

  constructor(
    @Inject(GoogleOAuth) private readonly google: GoogleOAuth | null,
    private readonly prisma: PrismaService,
    private readonly sessions: SessionService,
  ) {}

  get enabled(): boolean {
    return this.google !== null;
  }

  redirectUri(): string {
    // Vuelve por el dominio de la web (/api/*), así la cookie de sesión queda first-party.
    return `${process.env.WEB_URL ?? 'http://localhost:3000'}/api/auth/google/callback`;
  }

  start(next: unknown): { url: string; pending: OAuthPending } {
    const state = randomToken(24);
    const verifier = randomToken(32); // 43 caracteres: dentro de lo que pide PKCE (43–128)
    const codeChallenge = createHash('sha256').update(verifier).digest('base64url');
    const url = this.google!.authUrl({ state, codeChallenge, redirectUri: this.redirectUri() });
    return { url, pending: { state, verifier, next: safeNext(next) } };
  }

  async finish(
    query: { code?: unknown; state?: unknown },
    pending: OAuthPending | null,
  ): Promise<{ token: string; next: string }> {
    const { code, state } = query;
    if (!pending || typeof code !== 'string' || typeof state !== 'string' || !sameString(state, pending.state)) {
      throw new GoogleAuthError('google');
    }
    let identity: GoogleIdentity;
    try {
      identity = await this.google!.exchange(code, pending.verifier, this.redirectUri());
    } catch (err) {
      this.logger.warn(`Falló el canje con Google: ${(err as Error).message}`);
      throw new GoogleAuthError('google');
    }
    if (!identity.emailVerified) throw new GoogleAuthError('google_email');
    const user = await this.findOrLink(identity);
    return { token: await this.sessions.create(user.id), next: pending.next };
  }

  private async findOrLink(identity: GoogleIdentity): Promise<User> {
    const email = identity.email.trim().toLowerCase();
    // Solo guardamos la foto si es de Google (nunca la mostramos desde ahí: se copia a la ficha si el titular quiere).
    const picture = identity.picture && isGooglePhotoUrl(identity.picture) ? identity.picture : null;
    const byGoogle = await this.prisma.user.findUnique({ where: { googleId: identity.sub } });
    if (byGoogle) {
      if (byGoogle.googlePictureUrl === picture) return byGoogle;
      return this.prisma.user.update({ where: { id: byGoogle.id }, data: { googlePictureUrl: picture } });
    }

    const byEmail = await this.prisma.user.findUnique({ where: { email } });
    if (!byEmail) {
      return this.prisma.user.create({ data: { email, googleId: identity.sub, emailVerifiedAt: new Date(), googlePictureUrl: picture } });
    }

    if (byEmail.emailVerifiedAt) {
      // La cuenta ya demostró que el email es de su dueño: solo sumamos Google.
      return this.prisma.user.update({ where: { id: byEmail.id }, data: { googleId: identity.sub, googlePictureUrl: picture } });
    }

    // Cuenta con contraseña y email nunca verificado: cualquiera pudo haberla creado con este email.
    // Google acaba de probar quién es el dueño, así que descartamos esa contraseña y sus sesiones.
    await this.sessions.revokeAll(byEmail.id);
    return this.prisma.user.update({
      where: { id: byEmail.id },
      data: { googleId: identity.sub, emailVerifiedAt: new Date(), passwordHash: null, googlePictureUrl: picture },
    });
  }
}
