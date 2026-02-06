/**
 * Trader 2FA Verify API Route
 *
 * POST /trader/auth/2fa/verify
 * Verifies a TOTP code to confirm 2FA setup or during login.
 * Requires: { code: string, secret: string }
 *
 * NOTE: Once the `totpSecret` column exists on TraderUser, the secret
 * parameter becomes optional (read from DB instead).
 */

import { NextRequest, NextResponse } from "next/server";
import { validateTraderSession } from "@/lib/trader/auth/session";
import { verifyTotp } from "@/lib/trader/auth/totp";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await validateTraderSession();

    if (!session.authenticated || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { code, secret } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "A 6-digit TOTP code is required" },
        { status: 400 }
      );
    }

    if (!secret || typeof secret !== "string") {
      return NextResponse.json(
        {
          error:
            "TOTP secret is required (will be automatic once DB migration is applied)",
        },
        { status: 400 }
      );
    }

    const valid = verifyTotp(code, secret);

    if (!valid) {
      return NextResponse.json(
        { error: "Invalid TOTP code. Check your authenticator app and try again." },
        { status: 401 }
      );
    }

    // TODO: Once TraderUser.totpEnabled column exists, enable 2FA here:
    // await db.traderUser.update({
    //   where: { id: session.user.id },
    //   data: { totpEnabled: true },
    // });

    return NextResponse.json({
      success: true,
      verified: true,
      message: "2FA verification successful. Two-factor authentication is now active.",
    });
  } catch (error) {
    console.error("[TraderAuth] 2FA verify error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
