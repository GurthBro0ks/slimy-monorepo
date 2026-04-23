import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import { getImportLog } from "@/lib/club/import-log";

export const runtime = "nodejs";

const GUILD_ID = process.env.DEFAULT_GUILD_ID || "1176605506912141444";

export async function GET(request: NextRequest) {
  try {
    try {
      await requireOwner(request);
    } catch (authError: unknown) {
      if (authError instanceof NextResponse) return authError;
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const entries = await getImportLog(GUILD_ID, 50);

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("[/api/snail/club/history] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
