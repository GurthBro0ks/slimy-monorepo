/**
 * Trader 2FA Setup API Route
 *
 * POST /trader/auth/2fa/setup
 * Generates a TOTP secret and returns the otpauth URI for QR scanning.
 * Requires an active trader session.
 *
 * NOTE: Full persistence requires adding a `totpSecret` column to TraderUser.
 * Until the migration runs, 2FA setup returns the secret for client-side storage.
 */

import { NextResponse } from "next/server";
import { validateTraderSession } from "@/lib/trader/auth/session";
import { generateTotpSecret, buildTotpUri } from "@/lib/trader/auth/totp";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = await validateTraderSession();

    if (!session.authenticated || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const secret = generateTotpSecret();
    const uri = buildTotpUri(secret, session.user.username);

    // TODO: Once TraderUser.totpSecret column exists, persist here:
    // await db.traderUser.update({
    //   where: { id: session.user.id },
    //   data: { totpSecret: secret, totpEnabled: false },
    // });

    return NextResponse.json({
      success: true,
      secret,
      uri,
      message:
        "Scan the QR code with your authenticator app, then verify with /trader/auth/2fa/verify",
    });
  } catch (error) {
    console.error("[TraderAuth] 2FA setup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
