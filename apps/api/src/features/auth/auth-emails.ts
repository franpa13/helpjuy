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

/** Alguien intentó registrarse con un email que ya tiene cuenta: se le avisa al dueño real. */
export function signupAttemptMessage(to: string): MailMessage {
  const web = process.env.WEB_URL ?? 'http://localhost:3000';
  const text = [
    'Alguien intentó crear una cuenta en HelpJuy con este email, pero ya tenés una.',
    '',
    `Si fuiste vos, ingresá en ${web}/ingresar. Si no te acordás la contraseña, pedí una nueva en ${web}/recuperar.`,
    '',
    'Si no fuiste vos, no tenés que hacer nada: tu cuenta y tus fichas siguen igual.',
  ].join('\n');
  const html = `
<div style="font-family:Arial,sans-serif;max-width:520px;color:#141414">
  <p>Alguien intentó crear una cuenta en HelpJuy con este email, pero <strong>ya tenés una</strong>.</p>
  <p>Si fuiste vos, <a href="${web}/ingresar">ingresá</a>. Si no te acordás la contraseña, <a href="${web}/recuperar">pedí una nueva</a>.</p>
  <p style="color:#6b6b6b;font-size:13px">Si no fuiste vos, no tenés que hacer nada: tu cuenta y tus fichas siguen igual.</p>
</div>`;
  return { to, subject: 'Alguien intentó crear una cuenta con tu email', text, html };
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
