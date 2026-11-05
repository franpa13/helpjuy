import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { timingSafeEqual } from 'node:crypto';

const safeEqual = (a: string, b: string) => {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
};

/**
 * Detrás de la web (Vercel) todas las requests llegan desde la misma IP de servidor.
 * La web reenvía la IP real del usuario en `x-client-ip`, firmada con `x-proxy-secret`.
 * Sin el secreto correcto se usa la IP de la conexión, así nadie puede falsificarla.
 */
@Injectable()
export class ClientIpThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const secret = process.env.PROXY_SECRET;
    const sent = req.headers?.['x-proxy-secret'];
    const clientIp = req.headers?.['x-client-ip'];
    if (secret && typeof sent === 'string' && typeof clientIp === 'string' && clientIp && safeEqual(sent, secret)) {
      return clientIp;
    }
    return req.ip;
  }
}
