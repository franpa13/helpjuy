import { Global, Injectable, Module } from '@nestjs/common';

/** Invalida la ficha pública cacheada en la web para estos tokens. Nunca debe lanzar errores. */
export abstract class CardCache {
  abstract invalidate(tokens: string[]): Promise<void>;
}

@Injectable()
export class NoopCardCache implements CardCache {
  async invalidate(_tokens: string[]): Promise<void> {}
}

@Global()
@Module({
  providers: [{ provide: CardCache, useClass: NoopCardCache }],
  exports: [CardCache],
})
export class CardCacheModule {}
