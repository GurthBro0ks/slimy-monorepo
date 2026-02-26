import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    "/((?!_next/|_static/|[\\w-]+\\.\w+).*)",
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
  ];
  
  const isExactPublic = publicRoutes.includes(pathname);
  const isPublicPrefix = publicPrefixes.some(p => pathname.startsWith(p));
  const isPublicApi = pathname === "/api/codes" || pathname.startsWith("/api/session/");

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

  // 4. Owner-only Routes Check
  if (pathname.startsWith("/owner")) {
    try {
      // Internal call to /api/auth/me to verify role
      const meRes = await fetch(new URL("/api/auth/me", req.url), {
        headers: { Cookie: "slimy_session=" + sessionToken },
      });
      
      if (!meRes.ok) {
        const loginUrl = new URL("/login", req.url);
        return NextResponse.redirect(loginUrl);
      }

      const user = await meRes.json();
      if (user.role !== "owner") {
        return NextResponse.rewrite(new URL("/owner/forbidden", req.url));
      }
    } catch (error) {
      console.error("[Middleware] Owner check failed:", error);
      return NextResponse.rewrite(new URL("/owner/forbidden", req.url));
    }
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
