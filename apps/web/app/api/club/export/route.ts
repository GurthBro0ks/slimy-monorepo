import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server";
import { validateGuildAccess } from "@/lib/auth/permissions";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const guildId = searchParams.get("guildId");
    
    // 1. Auth Check
    const cookieStore = await cookies();
    const user = await requireAuth(cookieStore);

    // 2. Safety Guard (Fixes the TS Error)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!guildId) {
      return NextResponse.json({ error: "Guild ID required" }, { status: 400 });
    }

    // 3. Validation (Now safe because user is confirmed not null)
    validateGuildAccess(user, guildId);

    // Placeholder for actual export logic
    return NextResponse.json({ success: true, url: "https://example.com/sheet.csv" });

  } catch (error) {
    console.error("[Export API] Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
