import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConsoleMailer } from './console.mailer.js';
import { createMailer, RelayMailer } from './mail.module.js';
import { ResendMailer } from './resend.mailer.js';

const msg = { to: 'ana@mail.com', subject: 'Hola', text: 'texto', html: '<p>texto</p>' };

describe('qué servicio de email se usa', () => {
  it('con RESEND_API_KEY, Resend (necesita dominio propio)', () => {
    expect(createMailer({ RESEND_API_KEY: 're_x', MAIL_RELAY_SECRET: 's', WEB_URL: 'https://w' })).toBeInstanceOf(ResendMailer);
  });

  it('sin Resend pero con MAIL_RELAY_SECRET y WEB_URL, la web lo manda por Gmail', () => {
    expect(createMailer({ MAIL_RELAY_SECRET: 's', WEB_URL: 'https://w' })).toBeInstanceOf(RelayMailer);
  });

  it('sin nada, solo a los logs (desarrollo)', () => {
    expect(createMailer({})).toBeInstanceOf(ConsoleMailer);
  });
});

describe('RelayMailer', () => {
  afterEach(() => vi.restoreAllMocks());

  it('le pasa el email a la web con el secreto', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 202 }));
    await new RelayMailer('https://helpjuy.vercel.app', 'secreto').send(msg);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://helpjuy.vercel.app/internal/mail',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'x-mail-secret': 'secreto' }),
        body: JSON.stringify(msg),
      }),
    );
  });

  it('si la web no lo pudo mandar, falla (así se registra y el aviso puede reintentarse)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"error":"send_failed"}', { status: 502 }));
    await expect(new RelayMailer('https://w', 's').send(msg)).rejects.toThrow('502');
  });
});
