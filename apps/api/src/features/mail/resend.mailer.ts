import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import type { MailMessage, Mailer } from './mailer.js';

@Injectable()
export class ResendMailer implements Mailer {
  private readonly client = new Resend(process.env.RESEND_API_KEY);
  private readonly from = process.env.MAIL_FROM ?? 'HelpJuy <no-reply@helpjuy.app>';

  async send(msg: MailMessage): Promise<void> {
    const { error } = await this.client.emails.send({ from: this.from, ...msg });
    if (error) throw new Error(`Resend: ${error.message}`);
  }
}
