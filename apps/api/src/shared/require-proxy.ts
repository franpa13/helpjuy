import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { timingSafeEqual } from 'node:crypto';

/** Lo único que se atiende directo: el chequeo de Render y los crons (el mantenimiento tiene su propio secreto). */
const OPEN = new Set(['GET /health', 'HEAD /health', 'POST /internal/maintenance']);

const sameSecret = (a: string, b: string) => {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
};

/** Activo en producción (o con REQUIRE_PROXY_SECRET=true); REQUIRE_PROXY_SECRET=false lo apaga. */
export const proxyRequired = () =>
  process.env.REQUIRE_PROXY_SECRET ? process.env.REQUIRE_PROXY_SECRET === 'true' : process.env.NODE_ENV === 'production';

/**
 * En producción la API solo atiende a la web (Vercel), que firma cada pedido con PROXY_SECRET.
 * Así nadie la llama directo para saltearse los límites por IP (detrás de Render la IP de la conexión no es
 * la del usuario) ni la protección de la web. A quien llega directo le respondemos 404: ni se entera de qué hay.
 */
export function requireProxy() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!proxyRequired() || OPEN.has(`${req.method} ${req.path}`)) return next();
    const secret = process.env.PROXY_SECRET;
    if (!secret) {
      // Mejor seguir funcionando que dejar a todos afuera por una variable faltante; pero que se note.
      Logger.error('Falta PROXY_SECRET: la API atiende pedidos directos', 'RequireProxy');
      return next();
    }
    const sent = req.headers['x-proxy-secret'];
    if (typeof sent === 'string' && sameSecret(sent, secret)) return next();
    res.status(404).json({ error: 'not_found' });
  };
}
