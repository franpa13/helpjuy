import { clientIpHeaders } from './client-ip';

describe('clientIpHeaders', () => {
  afterEach(() => {
    delete process.env.PROXY_SECRET;
  });

  it('toma la primera IP de x-forwarded-for y la firma con el secreto', () => {
    process.env.PROXY_SECRET = 's3cr3t';
    const h = new Headers({ 'x-forwarded-for': '200.1.2.3, 10.0.0.1' });
    expect(clientIpHeaders(h)).toEqual({ 'x-proxy-secret': 's3cr3t', 'x-client-ip': '200.1.2.3' });
  });

  it('sin secreto configurado no manda nada', () => {
    expect(clientIpHeaders(new Headers({ 'x-forwarded-for': '200.1.2.3' }))).toEqual({});
  });
});
