export type GoogleIdentity = { sub: string; email: string; emailVerified: boolean; picture?: string };

/** Puerto hacia Google. En producción, `GoogleOAuthClient`; en tests, un fake. `null` si no está configurado. */
export abstract class GoogleOAuth {
  abstract authUrl(p: { state: string; codeChallenge: string; redirectUri: string }): string;
  abstract exchange(code: string, codeVerifier: string, redirectUri: string): Promise<GoogleIdentity>;
}
