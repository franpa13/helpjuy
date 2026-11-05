import type { MailMessage } from '../mail/mailer.js';

const webUrl = () => process.env.WEB_URL ?? 'http://localhost:3000';

const wrap = (title: string, body: string, link: string, cta: string) => `
<div style="font-family:Arial,sans-serif;max-width:480px;color:#141414">
  <h1 style="font-size:20px">${title}</h1>
  <p>${body}</p>
  <p><a href="${link}" style="display:inline-block;background:#141414;color:#fff;padding:12px 18px;text-decoration:none">${cta}</a></p>
  <p style="color:#6b6b6b;font-size:13px">Si no fuiste vos, ignorá este mensaje.</p>
</div>`;

export function verifyEmailMessage(to: string, token: string): MailMessage {
  const link = `${webUrl()}/verificar?token=${token}`;
  return {
    to,
    subject: 'Confirmá tu email para HelpJuy',
    text: `Hola. Confirmá tu email abriendo este link (vence en 24 horas):\n${link}\n\nSi no fuiste vos, ignorá este mensaje.`,
    html: wrap('Confirmá tu email', 'Abrí este link para confirmar tu email. Vence en 24 horas.', link, 'Confirmar email'),
  };
}

export function resetPasswordMessage(to: string, token: string): MailMessage {
  const link = `${webUrl()}/restablecer?token=${token}`;
  return {
    to,
    subject: 'Restablecé tu contraseña de HelpJuy',
    text: `Pediste cambiar tu contraseña. Abrí este link (vence en 1 hora):\n${link}\n\nSi no fuiste vos, ignorá este mensaje.`,
    html: wrap('Restablecé tu contraseña', 'Abrí este link para elegir una contraseña nueva. Vence en 1 hora.', link, 'Elegir contraseña nueva'),
  };
}
