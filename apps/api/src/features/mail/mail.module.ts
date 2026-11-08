import { Global, Module } from '@nestjs/common';
import { ConsoleMailer } from './console.mailer.js';
import { Mailer, type MailMessage } from './mailer.js';
import { ResendMailer } from './resend.mailer.js';

/**
 * Manda el email a través de la web (Vercel), que lo envía por Gmail.
 * Render gratis bloquea el SMTP saliente; Vercel no. Así funciona gratis y le llega a cualquiera.
 */
export class RelayMailer extends Mailer {
  constructor(
    private readonly webUrl: string,
    private readonly secret: string,
  ) {
    super();
  }

  async send(msg: MailMessage): Promise<void> {
    const res = await fetch(`${this.webUrl}/internal/mail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-mail-secret': this.secret },
      body: JSON.stringify(msg),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`La web no pudo enviar el email (${res.status})`);
  }
}

type Env = Partial<Record<'RESEND_API_KEY' | 'MAIL_FROM' | 'MAIL_RELAY_SECRET' | 'WEB_URL', string>>;

/** Resend si hay dominio propio configurado; si no, Gmail a través de la web; si no, solo a los logs. */
export function createMailer(env: Env): Mailer {
  if (env.RESEND_API_KEY) return new ResendMailer(env.RESEND_API_KEY, env.MAIL_FROM);
  if (env.MAIL_RELAY_SECRET && env.WEB_URL) return new RelayMailer(env.WEB_URL, env.MAIL_RELAY_SECRET);
  return new ConsoleMailer();
}

@Global()
@Module({
  providers: [{ provide: Mailer, useFactory: (): Mailer => createMailer(process.env) }],
  exports: [Mailer],
})
export class MailModule {}
