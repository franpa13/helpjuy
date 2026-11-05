import { NextResponse, type NextRequest } from 'next/server';
import { clientIpHeaders } from '@/shared/api/client-ip';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /api/* se reescribe a la API: le agregamos la IP real del usuario (y pisamos lo que haya mandado el cliente).
  if (pathname.startsWith('/api/')) {
    const headers = new Headers(request.headers);
    headers.delete('x-proxy-secret');
    headers.delete('x-client-ip');
    for (const [k, v] of Object.entries(clientIpHeaders(request.headers))) headers.set(k, v);
    return NextResponse.next({ request: { headers } });
  }

  // Chequeo optimista: sin cookie de sesión no se entra al panel. La API valida la sesión de verdad.
  if (!request.cookies.has('hj_session')) {
    const url = new URL('/ingresar', request.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/panel/:path*', '/api/:path*'],
};
