import { Global, Module } from '@nestjs/common';
import { ConsoleMailer } from './console.mailer.js';
import { Mailer } from './mailer.js';
import { ResendMailer } from './resend.mailer.js';

@Global()
@Module({
  providers: [
    {
      provide: Mailer,
      useFactory: (): Mailer => (process.env.RESEND_API_KEY ? new ResendMailer() : new ConsoleMailer()),
    },
  ],
  exports: [Mailer],
})
export class MailModule {}
