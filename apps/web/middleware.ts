import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    "/((?!api/|_next/|_static/|[\\w-]+\\.\\w+).*)",
  ],
};

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";

  if (url.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const currentHost =
    process.env.NODE_ENV === "production"
      ? hostname.replace(".slimyai.xyz", "")
      : hostname.replace(".localhost:3000", "");

  if (currentHost === "chat") {
    url.pathname = `/chat${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Pass pathname to server components via header
  const response = NextResponse.next();
  response.headers.set("x-pathname", url.pathname);
  return response;
}
