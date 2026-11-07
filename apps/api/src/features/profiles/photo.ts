import { BadRequestException } from '@nestjs/common';
import sharp from 'sharp';

export const PHOTO_SIZE = 320;
const MAX_INPUT_PIXELS = 40_000_000;

/**
 * Normaliza la foto de una ficha: la gira según el celular, la recorta cuadrada centrada en lo
 * más llamativo (la cara, casi siempre), la achica a 320x320 y la pasa a webp.
 * sharp no copia los metadatos: se van el GPS, el modelo del celular y la fecha.
 */
export async function processPhoto(input: Buffer): Promise<Buffer> {
  try {
    return await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS, failOn: 'error' })
      .rotate()
      .resize(PHOTO_SIZE, PHOTO_SIZE, { fit: 'cover', position: sharp.strategy.attention })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    throw new BadRequestException({ error: 'photo_invalid' });
  }
}
