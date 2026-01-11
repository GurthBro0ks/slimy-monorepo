/**
 * Trader Me API Route
 *
 * GET /trader/auth/me
 * Returns the current authenticated user info
 */

import { NextResponse } from "next/server";
import { validateTraderSession } from "@/lib/trader/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await validateTraderSession();

  if (!result.authenticated) {
    return NextResponse.json(
      { authenticated: false, error: result.error },
      { status: 401 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    user: result.user,
  });
}
