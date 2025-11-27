import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    "/((?!api/|_next/|_static/|[\\w-]+\\.\\w+).*)",
  ],
};

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";

  // Adjust domains for production vs local
  const currentHost =
    process.env.NODE_ENV === "production"
      ? hostname.replace(".slimyai.xyz", "")
      : hostname.replace(".localhost:3000", "");

  // Rewrite "chat" subdomain to /chat route
  if (currentHost === "chat") {
    url.pathname = `/chat${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}
