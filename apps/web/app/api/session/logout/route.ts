/**
 * POST /api/session/logout
 * Revokes the current session in DB and clears the cookie.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { hashToken } from "@/lib/slimy-auth/crypto";
import { revokeSession, SESSION_COOKIE } from "@/lib/slimy-auth/session";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE);

    if (sessionCookie?.value) {
      const tokenHash = hashToken(sessionCookie.value);
      const session = await db.slimySession.findUnique({
        where: { tokenHash },
      });
      if (session) {
        await revokeSession(session.id);
      }
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: SESSION_COOKIE,
      value: "",
      path: "/",
      expires: new Date(0),
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("[SlimyAuth] Logout error:", error);
    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: SESSION_COOKIE,
      value: "",
      path: "/",
      expires: new Date(0),
    });
    return response;
  }
}

export async function GET() {
  return POST();
}
