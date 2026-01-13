import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireOwner(request);

    return NextResponse.json({
      ok: true,
      user: {
        id: ctx.user.id,
        discordId: ctx.user.discordId,
        email: ctx.user.email,
        globalName: ctx.user.globalName,
      },
      owner: {
        id: ctx.owner.id,
        email: ctx.owner.email,
        userId: ctx.owner.userId,
      },
      isOwner: true,
    });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }

    console.error("[/api/owner/me] Unexpected error:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}
