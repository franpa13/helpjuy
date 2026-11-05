import type { CardCache } from '../../src/features/emergency-card/card-cache.js';

export class FakeCardCache implements CardCache {
  calls: string[][] = [];
  failWith?: Error;

  async invalidate(tokens: string[]): Promise<void> {
    this.calls.push(tokens);
    if (this.failWith) throw this.failWith;
  }
}
