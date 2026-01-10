/**
 * Trader Logout API Route
 *
 * POST /trader/auth/logout
 * Revokes the current session and clears the cookie
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { hashToken } from "@/lib/trader/auth/crypto";
import {
  revokeTraderSession,
  TRADER_SESSION_COOKIE,
} from "@/lib/trader/auth/session";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(TRADER_SESSION_COOKIE);

    if (sessionCookie?.value) {
      // Revoke session in database
      const tokenHash = hashToken(sessionCookie.value);
      const session = await db.traderSession.findUnique({
        where: { tokenHash },
      });
      if (session) {
        await revokeTraderSession(session.id);
      }
    }

    const response = NextResponse.redirect(new URL("/trader/login", request.url));
    response.cookies.delete(TRADER_SESSION_COOKIE);

    return response;
  } catch (error) {
    console.error("[TraderAuth] Logout error:", error);
    // Still clear cookie even on error
    const response = NextResponse.redirect(new URL("/trader/login", request.url));
    response.cookies.delete(TRADER_SESSION_COOKIE);
    return response;
  }
}

export async function GET(request: Request) {
  return POST(request);
}
