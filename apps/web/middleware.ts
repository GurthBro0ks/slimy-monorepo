import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Centralized Authentication Middleware
 * 
 * Handles authentication checks for protected routes before they reach the page components.
 * This eliminates the need for duplicate auth checks in every protected page.
 * 
 * Role-based access control is still handled by ProtectedRoute component for flexibility,
 * but basic authentication is enforced here at the middleware level.
 */

// Cookie name used by the admin API (must match lib/jwt.js)
const SESSION_COOKIE_NAME = "slimy_admin";

// Routes that require authentication (any authenticated user)
const protectedRoutes = [
  "/guilds",
  "/admin",
  "/club",
  "/snail",
  "/chat",
  "/analytics",
];

// Public routes that should bypass auth checks
const publicRoutes = [
  "/",
  "/status",
  "/features",
  "/docs",
  "/public-stats",
];

/**
 * Check if a pathname matches any of the protected route patterns
 */
function isProtectedRoute(pathname: string): boolean {
  // Check public routes first
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
    return false;
  }
  
  // Check protected routes
  return protectedRoutes.some(route => pathname.startsWith(route));
}

/**
 * Main middleware function
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth check for non-protected routes
  if (!isProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  // Get the session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

  if (!sessionCookie || !sessionCookie.value) {
    // No valid session cookie, redirect to login
    const adminApiBase = process.env.NEXT_PUBLIC_ADMIN_API_BASE;
    if (adminApiBase) {
      const loginUrl = `${adminApiBase}/api/auth/login?redirect=${encodeURIComponent(request.url)}`;
      return NextResponse.redirect(loginUrl);
    } else {
      // Fallback to home page if admin API base is not configured
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Session cookie exists - allow request to proceed
  // Role-based access control will be handled by ProtectedRoute component
  // This provides a balance between security (auth check here) and flexibility (role check in component)
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - handled by backend)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions (images, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)",
  ],
};
