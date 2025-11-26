import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // SAFETY: Stop middleware from processing static files immediately
  if (request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.includes('.')) {
    return NextResponse.next();
  }

  // SECURITY: Strip any x-user-* headers from incoming requests to prevent header injection attacks
  // These headers should ONLY be set by our middleware after authentication, never trusted from clients
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete('x-user-id');
  requestHeaders.delete('x-user-role');
  requestHeaders.delete('x-user-roles');
  requestHeaders.delete('x-username');

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
