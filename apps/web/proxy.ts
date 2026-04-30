import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    "/((?!_next/|_static/|[\\w-]+\\.\\w+).*)",
    "/api/mission-control/:path*",
    "/api/owner/:path*",
    "/api/guilds/:path*",
    "/api/session/:path*",
  ],
};

export async function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const { pathname, searchParams } = url;

  // Hands-off routes use a separate auth system.
  if (pathname.startsWith("/trader")) {
    return NextResponse.next();
  }

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
    "/snail",
    "/snail-codes",
  ];

  const isExactPublic = publicRoutes.includes(pathname);
  const isPublicPrefix = publicPrefixes.some(p => pathname.startsWith(p));
  const isPublicApi = pathname === "/api/codes" || pathname.startsWith("/api/codes/") || pathname.startsWith("/api/session/") || pathname.startsWith("/api/owner/invites") || pathname.startsWith("/api/webhook/") || pathname.startsWith("/api/owner/notifications/discord-push") || pathname.startsWith("/api/snail/") || pathname.startsWith("/api/snail-codes/");

  if (isExactPublic || isPublicPrefix || isPublicApi) {
    return NextResponse.next();
  }

  // Unknown pages must reach Next's not-found route instead of auth redirecting.
  const protectedPrefixes = [
    "/admin",
    "/analytics",
    "/dashboard",
    "/guilds",
    "/mission-control",
    "/office",
    "/owner",
    "/settings",
    "/usage",
  ];
  const protectedApiPrefixes = [
    "/api/admin",
    "/api/guilds",
    "/api/mission-control",
    "/api/office",
    "/api/owner",
    "/api/screenshot",
  ];
  const isProtectedRoute = protectedPrefixes.some(p => pathname === p || pathname.startsWith(`${p}/`));
  const isProtectedApi = protectedApiPrefixes.some(p => pathname === p || pathname.startsWith(`${p}/`));

  if (!isProtectedRoute && !isProtectedApi) {
    return NextResponse.next();
  }

  const sessionToken = req.cookies.get("slimy_session")?.value;

  if (!sessionToken) {
    const loginUrl = new URL("/login", req.url);
    const returnTo = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
    loginUrl.searchParams.set("returnTo", returnTo);
    return NextResponse.redirect(loginUrl);
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
