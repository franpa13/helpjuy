import { Resend } from 'resend';
import type { MailMessage, Mailer } from './mailer.js';

/** Resend: necesita un dominio propio verificado para mandarle a cualquiera. */
export class ResendMailer implements Mailer {
  private readonly client: Resend;

  constructor(
    apiKey: string,
    private readonly from = 'HelpJuy <no-reply@helpjuy.app>',
  ) {
    this.client = new Resend(apiKey);
  }

  async send(msg: MailMessage): Promise<void> {
    const { error } = await this.client.emails.send({ from: this.from, ...msg });
    if (error) throw new Error(`Resend: ${error.message}`);
  }
}
