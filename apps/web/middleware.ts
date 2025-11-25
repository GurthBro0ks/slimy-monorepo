import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // SAFETY: Stop middleware from processing static files immediately
  if (request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.includes('.')) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
