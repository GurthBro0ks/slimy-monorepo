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

export async function POST() {
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

    // Create response with relative Location (303 See Other)
    const response = new NextResponse(null, {
      status: 303,
      headers: { Location: "/trader/login" },
    });

    // Securely clear the cookie
    response.cookies.set({
      name: TRADER_SESSION_COOKIE,
      value: "",
      path: "/",
      expires: new Date(0),
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("[TraderAuth] Logout error:", error);
    // Still clear cookie and redirect even on error
    const response = new NextResponse(null, {
      status: 303,
      headers: { Location: "/trader/login" },
    });
    response.cookies.set({
      name: TRADER_SESSION_COOKIE,
      value: "",
      path: "/",
      expires: new Date(0),
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });
    return response;
  }
}

export async function GET() {
  return POST();
}
