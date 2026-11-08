import { timingSafeEqual } from 'node:crypto';
import nodemailer from 'nodemailer';
import { z } from 'zod';

export const runtime = 'nodejs';

/**
 * Envío de emails por Gmail, a pedido de la API. Render gratis bloquea el SMTP saliente; Vercel no.
 * Protegido con MAIL_RELAY_SECRET (el mismo valor en la API). Gmail permite ~500 emails por día.
 */

const sameSecret = (a: string, b: string) => {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
};

// Un solo destinatario y asunto sin saltos de línea: nadie puede usar esto para mandar a otros.
const mailSchema = z.object({
  to: z.email(),
  subject: z.string().min(1).max(200).regex(/^[^\r\n]*$/),
  text: z.string().max(20_000),
  html: z.string().max(50_000),
});

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.MAIL_RELAY_SECRET;
  const sent = request.headers.get('x-mail-secret') ?? '';
  if (!secret || !sameSecret(sent, secret)) return Response.json({ error: 'unauthorized' }, { status: 401 });

  // Google muestra la contraseña de aplicación en 4 grupos con espacios: los sacamos (y comillas o saltos de línea
  // que se cuelen al copiar), así da igual cómo se haya pegado.
  const user = process.env.GMAIL_USER?.trim().replace(/^["']|["']$/g, '');
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/[\s"']/g, '');
  if (!user || !pass) return Response.json({ error: 'not_configured' }, { status: 503 });

  const parsed = mailSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'validation' }, { status: 400 });

  try {
    const transport = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user, pass } });
    // Hay que esperar el envío antes de responder: en Vercel, lo que queda pendiente después de responder se corta.
    await transport.sendMail({ from: `HelpJuy <${user}>`, ...parsed.data });
    return Response.json({ sent: true }, { status: 202 });
  } catch (err) {
    // Para diagnosticar sin exponer nada: la cuenta enmascarada y el largo de la contraseña (tiene que ser 16).
    const [local = '', domain = '(sin @)'] = user.split('@');
    const who = `${local.slice(0, 2)}***@${domain}`;
    console.error(`No se pudo enviar por Gmail (cuenta ${who}, contraseña de ${pass.length} caracteres): ${(err as Error).message}`);
    return Response.json({ error: 'send_failed' }, { status: 502 });
  }
}
