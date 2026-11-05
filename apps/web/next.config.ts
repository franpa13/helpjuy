import type { NextConfig } from 'next';

const apiUrl = process.env.API_URL ?? 'http://localhost:4000';

const nextConfig: NextConfig = {
  transpilePackages: ['@helpjuy/contracts'],
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
