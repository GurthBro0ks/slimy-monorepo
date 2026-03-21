/**
 * GET /api/session/me
 * Returns current authenticated user info from DB-backed session.
 */

import { NextResponse } from "next/server";
import { validateSession } from "@/lib/slimy-auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await validateSession();

  if (!result.authenticated) {
    return NextResponse.json(
      { authenticated: false, error: result.error },
      { status: 401 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    id: result.user.id,
    username: result.user.username,
    email: result.user.email,
    role: result.user.role,
  });
}
