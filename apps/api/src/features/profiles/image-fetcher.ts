import { Injectable } from '@nestjs/common';

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Solo descargamos fotos de perfil de Google (https y dominio googleusercontent.com).
 * Así la URL guardada nunca puede usarse para que el servidor pida otra cosa (SSRF).
 */
export function isGooglePhotoUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === 'https:' && (u.hostname === 'googleusercontent.com' || u.hostname.endsWith('.googleusercontent.com'));
  } catch {
    return false;
  }
}

/** Google entrega la miniatura de 96px (`=s96-c`); pedimos una de 400px para que se vea bien. */
export function largeGooglePhotoUrl(raw: string): string {
  return /=s\d+(-c)?$/.test(raw) ? raw.replace(/=s\d+(-c)?$/, '=s400-c') : `${raw}=s400-c`;
}

/** Puerto para descargar una imagen remota. En tests, un fake. */
export abstract class ImageFetcher {
  abstract fetch(url: string): Promise<Buffer>;
}

@Injectable()
export class HttpImageFetcher extends ImageFetcher {
  async fetch(url: string): Promise<Buffer> {
    if (!isGooglePhotoUrl(url)) throw new Error('URL de foto no permitida');
    const res = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`No se pudo descargar la foto (${res.status})`);
    const length = Number(res.headers.get('content-length') ?? 0);
    if (length > MAX_BYTES) throw new Error('Foto demasiado grande');
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_BYTES) throw new Error('Foto demasiado grande');
    return buf;
  }
}
