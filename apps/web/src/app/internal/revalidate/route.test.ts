import { revalidateTag } from 'next/cache';
import { POST } from './route';

vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }));

const T1 = 'AAAAAAAAAAAAAAAAAAAAAA';
const T2 = 'BBBBBBBBBBBBBBBBBBBBBB';

const req = (body: unknown, secret?: string) =>
  new Request('http://localhost/internal/revalidate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(secret ? { 'x-revalidate-secret': secret } : {}) },
    body: JSON.stringify(body),
  });

describe('POST /internal/revalidate', () => {
  beforeEach(() => {
    process.env.REVALIDATE_SECRET = 's3cr3t';
    vi.mocked(revalidateTag).mockClear();
  });

  it('sin secreto o con secreto incorrecto → 401', async () => {
    expect((await POST(req({ tokens: [T1] }))).status).toBe(401);
    expect((await POST(req({ tokens: [T1] }, 'otro'))).status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('si no hay secreto configurado en la web → 401 siempre', async () => {
    delete process.env.REVALIDATE_SECRET;
    expect((await POST(req({ tokens: [T1] }, 'undefined'))).status).toBe(401);
  });

  it('con secreto correcto invalida cada ficha sin servir la versión vieja', async () => {
    const res = await POST(req({ tokens: [T1, T2] }, 's3cr3t'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ revalidated: 2 });
    expect(revalidateTag).toHaveBeenCalledWith(`card:${T1}`, { expire: 0 });
    expect(revalidateTag).toHaveBeenCalledWith(`card:${T2}`, { expire: 0 });
  });

  it('ignora tokens con formato inválido y acepta como máximo 10', async () => {
    const res = await POST(req({ tokens: ['../etc', T1, ...Array(20).fill(T2)] }, 's3cr3t'));
    expect(res.status).toBe(200);
    expect(vi.mocked(revalidateTag).mock.calls.map((c) => c[0])).not.toContain('card:../etc');
    expect(revalidateTag).toHaveBeenCalledTimes(10);
  });
});
