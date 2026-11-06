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

const nextConfig: NextConfig = {
  transpilePackages: ['@helpjuy/contracts'],
  allowedDevOrigins: siteHost && siteHost !== 'localhost' ? [siteHost] : [],
  async headers() {
    // La ficha pública no tiene que aparecer en buscadores.
    return [{ source: '/e/:token', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }];
  },
  async rewrites() {
    // La web habla con la API por /api/* para que la cookie de sesión sea del mismo dominio.
    return [{ source: '/api/:path*', destination: `${apiUrl}/:path*` }];
  },
};

export default nextConfig;
