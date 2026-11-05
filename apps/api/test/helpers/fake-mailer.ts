import type { MailMessage, Mailer } from '../../src/features/mail/mailer.js';

export class FakeMailer implements Mailer {
  sent: MailMessage[] = [];

  async send(msg: MailMessage): Promise<void> {
    this.sent.push(msg);
  }

  lastLinkTo(email: string): string {
    const msg = [...this.sent].reverse().find((m) => m.to === email);
    if (!msg) throw new Error(`No se envió ningún email a ${email}`);
    const match = /https?:\/\/\S+/.exec(msg.text);
    if (!match) throw new Error('El email no tiene link');
    return match[0];
  }
}
