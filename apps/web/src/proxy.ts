import { NextResponse, type NextRequest } from 'next/server';

/** Chequeo optimista: sin cookie de sesión no se entra al panel. La API valida la sesión de verdad. */
export function proxy(request: NextRequest) {
  if (!request.cookies.has('hj_session')) {
    const url = new URL('/ingresar', request.url);
    url.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/panel/:path*',
};
