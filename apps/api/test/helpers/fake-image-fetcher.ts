import { ImageFetcher } from '../../src/features/profiles/image-fetcher.js';

/** Simula la descarga de la foto de Google: registra qué URL se pidió y devuelve una imagen fija. */
export class FakeImageFetcher extends ImageFetcher {
  requested: string[] = [];
  image: Buffer = Buffer.alloc(0);

  async fetch(url: string): Promise<Buffer> {
    this.requested.push(url);
    return this.image;
  }
}
