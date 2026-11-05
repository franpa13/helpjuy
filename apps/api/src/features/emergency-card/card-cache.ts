import { Global, Injectable, Logger, Module } from '@nestjs/common';

/** Invalida la ficha pública cacheada en la web para estos tokens. */
export abstract class CardCache {
  abstract invalidate(tokens: string[]): Promise<void>;
}

@Injectable()
export class NoopCardCache implements CardCache {
  async invalidate(_tokens: string[]): Promise<void> {}
}

const TIMEOUT_MS = 8_000;

/**
 * Le pide a la web que descarte la ficha cacheada (revalidateTag con expire: 0) y después
 * la visita una vez (warm-up): así queda regenerada con la API despierta y el próximo
 * escaneo la recibe al instante. Nunca lanza errores: un fallo acá no debe romper el guardado.
 */
export class HttpCardCache implements CardCache {
  private readonly logger = new Logger('CardCache');

  constructor(
    private readonly webUrl: string,
    private readonly secret: string,
  ) {}

  async invalidate(tokens: string[]): Promise<void> {
    if (tokens.length === 0) return;
    try {
      const res = await fetch(`${this.webUrl}/internal/revalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-revalidate-secret': this.secret },
        body: JSON.stringify({ tokens }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) {
        this.logger.warn(`La web respondió ${res.status} al revalidar`);
        return;
      }
      // Warm-up sin esperar: el guardado no tiene por qué demorarse por esto.
      for (const t of tokens) {
        void fetch(`${this.webUrl}/e/${t}`, { signal: AbortSignal.timeout(TIMEOUT_MS) }).catch(() => undefined);
      }
    } catch (err) {
      this.logger.warn(`No se pudo revalidar la ficha pública: ${(err as Error).message}`);
    }
  }
}

type Env = Partial<Record<'NODE_ENV' | 'WEB_URL' | 'REVALIDATE_SECRET', string>>;

/**
 * En producción, sin estas variables las fichas nunca se invalidarían: mejor no arrancar
 * que mostrar datos viejos (o un QR rotado) sin que nadie se entere.
 */
export function createCardCache(env: Env): CardCache {
  const { WEB_URL: webUrl, REVALIDATE_SECRET: secret } = env;
  if (webUrl && secret) return new HttpCardCache(webUrl, secret);
  if (env.NODE_ENV === 'production') {
    const missing = [!webUrl && 'WEB_URL', !secret && 'REVALIDATE_SECRET'].filter(Boolean).join(' y ');
    throw new Error(`Falta configurar ${missing}: sin eso la ficha pública no se actualiza al editarla`);
  }
  return new NoopCardCache();
}

@Global()
@Module({
  providers: [
    { provide: CardCache, useFactory: (): CardCache => createCardCache(process.env) },
  ],
  exports: [CardCache],
})
export class CardCacheModule {}
