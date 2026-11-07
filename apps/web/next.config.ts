import type { NextConfig } from 'next';

const apiUrl = process.env.API_URL ?? 'http://localhost:4000';

/** En desarrollo, permitimos el host de SITE_URL (ej. la IP de tu compu) para probar desde el celular en el mismo Wi-Fi. */
const siteHost = (() => {
  try {
    return process.env.SITE_URL ? new URL(process.env.SITE_URL).hostname : undefined;
  } catch {
    return undefined;
  }
})();

const dev = process.env.NODE_ENV !== 'production';

/**
 * Política de contenido. Next mete scripts en línea para hidratar la página: sin nonces no podemos sacar
 * 'unsafe-inline' (los nonces obligan a renderizar cada pedido y perderíamos la ficha pública cacheada).
 * Igual bloquea lo importante: scripts y conexiones a otros dominios, iframes, plugins y que nos embeban.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  // Mapa de avisos: mosaicos de OpenStreetMap.
  "img-src 'self' data: blob: https://tile.openstreetmap.org",
  "font-src 'self'",
  `connect-src 'self'${dev ? ' ws: wss:' : ''}`,
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(dev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  // Ubicación solo para "Es una emergencia"; nada de cámara, micrófono ni pagos desde otros sitios.
  { key: 'Permissions-Policy', value: 'geolocation=(self), camera=(), microphone=(), payment=(), usb=()' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ['@helpjuy/contracts'],
  allowedDevOrigins: siteHost && siteHost !== 'localhost' ? [siteHost] : [],
  async headers() {
    return [
      // Todo menos /api/* (eso lo responde la API con sus propios headers).
      { source: '/((?!api/).*)', headers: securityHeaders },
      // La ficha pública no tiene que aparecer en buscadores.
      { source: '/e/:token', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
    ];
  },
  async rewrites() {
    // La web habla con la API por /api/* para que la cookie de sesión sea del mismo dominio.
    return [{ source: '/api/:path*', destination: `${apiUrl}/:path*` }];
  },
};

export default nextConfig;
