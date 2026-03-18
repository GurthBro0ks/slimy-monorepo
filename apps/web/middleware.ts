import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    "/((?!_next/|_static/|[\w-]+\.\w+).*)",
    "/api/mission-control/:path*",
    "/api/owner/:path*",
    "/api/guilds/:path*",
    "/api/session/:path*",
  ],
};

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const { pathname, searchParams } = url;
  
  // 1. Hands-off routes (Separate auth system)
  if (pathname.startsWith("/trader")) {
    return NextResponse.next();
  }

  // 2. Public Routes (Always allow)
  const publicRoutes = [
    "/",
    "/login",
    "/status",
    "/features",
  ];
  const publicPrefixes = [
    "/docs",
    "/public-stats",
    "/_next",
    "/auth",
    "/brand",
  ];
  
  const isExactPublic = publicRoutes.includes(pathname);
  const isPublicPrefix = publicPrefixes.some(p => pathname.startsWith(p));
  const isPublicApi = pathname === "/api/codes" || pathname.startsWith("/api/session/") || pathname.startsWith("/api/local-auth/") || pathname.startsWith("/api/owner/invites") || pathname.startsWith("/api/webhook/");

  if (isExactPublic || isPublicPrefix || isPublicApi) {
    return NextResponse.next();
  }

  // 3. Protected Routes Check
  const sessionToken = req.cookies.get("slimy_session")?.value;

  if (!sessionToken) {
    const loginUrl = new URL("/login", req.url);
    const returnTo = pathname + (searchParams.toString() ? "?" + searchParams.toString() : "");
    loginUrl.searchParams.set("returnTo", returnTo);
    return NextResponse.redirect(loginUrl);
  }

  // Pass pathname to server components via header
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
