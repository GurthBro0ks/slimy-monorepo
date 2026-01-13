import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    "/((?!api/|_next/|_static/|[\\w-]+\\.\\w+).*)",
  ],
};

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  let hostname = req.headers.get("host") || "";
  // Remove port if present
  hostname = hostname.split(":")[0];
  console.log("Middleware: Original Host:", req.headers.get("host"), "Parsed Host:", hostname);

  if (url.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Robust hostname check
  let currentHost = hostname
    .replace(".slimyai.xyz", "")
    .replace(".localhost:3000", ""); // Handle both cases simply

  // Explicit check for trader subdomain
  if (hostname === "trader.slimyai.xyz" || currentHost === "trader") {
    currentHost = "trader";
  }

  if (currentHost === "chat") {
    url.pathname = `/chat${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  if (currentHost === "trader" && !url.pathname.startsWith("/trader")) {
    url.pathname = `/trader${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Pass pathname to server components via header
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", url.pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
