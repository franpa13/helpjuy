import { Injectable, Logger } from '@nestjs/common';
import type { MailMessage, Mailer } from './mailer.js';

/** Para desarrollo local: imprime el email en la consola en vez de enviarlo. */
@Injectable()
export class ConsoleMailer implements Mailer {
  private readonly logger = new Logger('Mail');

  async send(msg: MailMessage): Promise<void> {
    this.logger.log(`Para: ${msg.to} | ${msg.subject}\n${msg.text}`);
  }
}
