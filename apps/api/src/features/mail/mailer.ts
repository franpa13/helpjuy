export type MailMessage = { to: string; subject: string; text: string; html: string };

/** Puerto de envío de emails. En producción Resend, en desarrollo consola, en tests un fake. */
export abstract class Mailer {
  abstract send(msg: MailMessage): Promise<void>;
}
