import { CodeChallengeMethod, OAuth2Client } from 'google-auth-library';
import type { GoogleIdentity, GoogleOAuth } from './google-oauth.js';

/** Implementación real contra Google (OAuth 2.0 + OpenID Connect, con PKCE). */
export class GoogleOAuthClient implements GoogleOAuth {
  private readonly client: OAuth2Client;

  constructor(
    private readonly clientId: string,
    clientSecret: string,
  ) {
    this.client = new OAuth2Client({ clientId, clientSecret });
  }

  authUrl(p: { state: string; codeChallenge: string; redirectUri: string }): string {
    return this.client.generateAuthUrl({
      scope: ['openid', 'email'],
      state: p.state,
      code_challenge: p.codeChallenge,
      code_challenge_method: CodeChallengeMethod.S256,
      redirect_uri: p.redirectUri,
      prompt: 'select_account',
    });
  }

  async exchange(code: string, codeVerifier: string, redirectUri: string): Promise<GoogleIdentity> {
    const { tokens } = await this.client.getToken({ code, codeVerifier, redirect_uri: redirectUri });
    if (!tokens.id_token) throw new Error('Google no devolvió id_token');
    // Verifica firma, emisor, vencimiento y que el token sea para nuestra app (audience).
    const ticket = await this.client.verifyIdToken({ idToken: tokens.id_token, audience: this.clientId });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) throw new Error('Token de Google sin sub o email');
    return { sub: payload.sub, email: payload.email, emailVerified: payload.email_verified === true };
  }
}

export function createGoogleOAuth(env: NodeJS.ProcessEnv): GoogleOAuth | null {
  const { GOOGLE_CLIENT_ID: id, GOOGLE_CLIENT_SECRET: secret } = env;
  return id && secret ? new GoogleOAuthClient(id, secret) : null;
}
