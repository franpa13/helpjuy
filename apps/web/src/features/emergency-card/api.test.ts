import { getPublicCard } from './api';

vi.mock('server-only', () => ({}));

const T = 'AAAAAAAAAAAAAAAAAAAAAA';

describe('getPublicCard', () => {
  beforeEach(() => {
    process.env.API_URL = 'http://api.test';
    process.env.PROXY_SECRET = 'px';
  });

  it('cachea con techo de 1 hora (nunca más vieja que eso si se pierde una invalidación)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }));
    await getPublicCard(T);
    const init = fetchSpy.mock.calls[0][1] as RequestInit & { next?: { revalidate?: number; tags?: string[] } };
    expect(init.next?.revalidate).toBe(3600);
    expect(init.next?.tags).toEqual([`card:${T}`]);
  });

  it('corta a los pocos segundos si la API no responde', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }));
    await getPublicCard(T);
    expect((fetchSpy.mock.calls[0][1] as RequestInit).signal).toBeInstanceOf(AbortSignal);
  });

  it('se identifica ante la API como la web (para no compartir el límite por IP)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }));
    await getPublicCard(T);
    const headers = (fetchSpy.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers['x-proxy-secret']).toBe('px');
  });
});
