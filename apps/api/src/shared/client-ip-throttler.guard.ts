import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { timingSafeEqual } from 'node:crypto';

const safeEqual = (a: string, b: string) => {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
};

const hasProxySecret = (req: Record<string, any>) => {
  const secret = process.env.PROXY_SECRET;
  const sent = req.headers?.['x-proxy-secret'];
  return !!secret && typeof sent === 'string' && safeEqual(sent, secret);
};

/**
 * Detrás de la web (Vercel) todas las requests llegan desde la misma IP de servidor.
 * - Requests de un usuario reenviadas por la web: traen `x-client-ip` firmada con `x-proxy-secret`;
 *   se limita por esa IP real.
 * - Requests propias de la web (render de la ficha pública): traen el secreto sin `x-client-ip`;
 *   no se limitan, porque si no todos los renders compartirían un único límite.
 * - Sin el secreto correcto se usa la IP de la conexión, así nadie puede falsificarla.
 */
@Injectable()
export class ClientIpThrottlerGuard extends ThrottlerGuard {
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    if (hasProxySecret(req) && !req.headers?.['x-client-ip']) return true;
    return super.shouldSkip(context);
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    const clientIp = req.headers?.['x-client-ip'];
    if (typeof clientIp === 'string' && clientIp && hasProxySecret(req)) return clientIp;
    return req.ip;
  }
}
