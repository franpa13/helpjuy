import { HttpCardCache } from './card-cache.js';

describe('HttpCardCache', () => {
  const T1 = 'AAAAAAAAAAAAAAAAAAAAAA';

  afterEach(() => vi.restoreAllMocks());

  it('pide revalidar con el secreto y después visita la página (warm-up)', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }));
    await new HttpCardCache('https://web.test', 's3cr3t').invalidate([T1]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://web.test/internal/revalidate');
    expect(init?.method).toBe('POST');
    expect((init?.headers as Record<string, string>)['x-revalidate-secret']).toBe('s3cr3t');
    expect(JSON.parse(String(init?.body))).toEqual({ tokens: [T1] });
    expect(fetchMock.mock.calls[1][0]).toBe(`https://web.test/e/${T1}`);
  });

  it('si la web está caída no lanza error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(new HttpCardCache('https://web.test', 's').invalidate([T1])).resolves.toBeUndefined();
  });

  it('si la revalidación responde 401 no hace el warm-up', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 401 }));
    await new HttpCardCache('https://web.test', 'mal').invalidate([T1]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
