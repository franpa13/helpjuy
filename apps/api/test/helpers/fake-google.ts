import type { GoogleIdentity, GoogleOAuth } from '../../src/features/auth/google/google-oauth.js';

/** Simula a Google: el "código" que llega al callback es la identidad que queremos devolver. */
export class FakeGoogleOAuth implements GoogleOAuth {
  identities = new Map<string, GoogleIdentity>();
  lastChallenge?: string;
  lastVerifier?: string;

  authUrl(p: { state: string; codeChallenge: string; redirectUri: string }): string {
    this.lastChallenge = p.codeChallenge;
    const u = new URL('https://accounts.google.test/o/oauth2/auth');
    u.searchParams.set('state', p.state);
    u.searchParams.set('redirect_uri', p.redirectUri);
    return u.toString();
  }

  async exchange(code: string, codeVerifier: string): Promise<GoogleIdentity> {
    this.lastVerifier = codeVerifier;
    const id = this.identities.get(code);
    if (!id) throw new Error('invalid_grant');
    return id;
  }
}
