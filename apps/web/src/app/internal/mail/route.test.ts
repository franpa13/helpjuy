const sendMail = vi.fn();
vi.mock('nodemailer', () => ({ default: { createTransport: vi.fn(() => ({ sendMail })) } }));

import nodemailer from 'nodemailer';
import { POST } from './route';

const msg = { to: 'ana@mail.com', subject: 'Posible emergencia: Ana', text: 'texto', html: '<p>texto</p>' };
const req = (body: unknown, secret?: string) =>
  new Request('https://helpjuy.vercel.app/internal/mail', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(secret ? { 'x-mail-secret': secret } : {}) },
    body: JSON.stringify(body),
  });

describe('POST /internal/mail (Gmail a través de la web)', () => {
  beforeEach(() => {
    vi.stubEnv('MAIL_RELAY_SECRET', 'secreto');
    vi.stubEnv('GMAIL_USER', 'helpjuy.avisos@gmail.com');
    vi.stubEnv('GMAIL_APP_PASSWORD', 'abcd efgh ijkl mnop');
    sendMail.mockReset().mockResolvedValue({ messageId: '1' });
  });
  afterEach(() => vi.unstubAllEnvs());

  it('sin el secreto correcto, 401 y no manda nada', async () => {
    expect((await POST(req(msg))).status).toBe(401);
    expect((await POST(req(msg, 'otro'))).status).toBe(401);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('manda el email por Gmail con HelpJuy como nombre del remitente', async () => {
    const res = await POST(req(msg, 'secreto'));
    expect(res.status).toBe(202);
    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user: 'helpjuy.avisos@gmail.com', pass: 'abcdefghijklmnop' } }),
    );
    expect(sendMail).toHaveBeenCalledWith({ from: 'HelpJuy <helpjuy.avisos@gmail.com>', ...msg });
  });

  it('valida lo que recibe (un solo destinatario, sin saltos de línea en el asunto)', async () => {
    expect((await POST(req({ ...msg, to: 'a@a.com, b@b.com' }, 'secreto'))).status).toBe(400);
    expect((await POST(req({ ...msg, subject: 'Hola\r\nBcc: x@y.com' }, 'secreto'))).status).toBe(400);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('limpia lo que se cuela al copiar: espacios, comillas, saltos de línea', async () => {
    vi.stubEnv('GMAIL_USER', ' "helpjuy.avisos@gmail.com"\n');
    vi.stubEnv('GMAIL_APP_PASSWORD', '"abcd efgh ijkl mnop"\n');
    await POST(req(msg, 'secreto'));
    expect(nodemailer.createTransport).toHaveBeenLastCalledWith(
      expect.objectContaining({ auth: { user: 'helpjuy.avisos@gmail.com', pass: 'abcdefghijklmnop' } }),
    );
  });

  it('si Gmail falla, 502 y el log dice con qué cuenta (enmascarada) y cuántos caracteres tiene la contraseña', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    sendMail.mockRejectedValue(new Error('Invalid login'));
    expect((await POST(req(msg, 'secreto'))).status).toBe(502);
    const line = String(log.mock.calls[0]?.[0]);
    expect(line).toContain('he***@gmail.com');
    expect(line).toContain('16 caracteres');
    expect(line).not.toContain('abcd');
    log.mockRestore();
  });

  it('sin Gmail configurado, 503', async () => {
    vi.stubEnv('GMAIL_APP_PASSWORD', '');
    expect((await POST(req(msg, 'secreto'))).status).toBe(503);
  });
});
