import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server";
import { db as prisma } from "@/lib/db";

// FIX: Force Node.js runtime to prevent "global is not defined" error with Prisma
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireAuth();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const guildId = user.guilds?.[0]?.id;
    console.log(`[Sheet API] READ Request. User: ${user.username}, Guild: ${guildId}`);

    if (!guildId) {
        return NextResponse.json({ error: "No guild found" }, { status: 400 });
    }

    const sheet = await prisma.clubSheet.findUnique({
      where: { guildId: guildId },
    });

    let returnData = [];
    if (sheet && sheet.data) {
        try {
            // Deep clone to safely handle Prisma JSON types
            returnData = JSON.parse(JSON.stringify(sheet.data));
        } catch (e) {
            console.error("[Sheet API] JSON Parse Error:", e);
            returnData = [];
        }
    }

    return NextResponse.json(returnData);

  } catch (error) {
    console.error("[Sheet API] GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const guildId = user.guilds?.[0]?.id;

    if (!guildId) {
        return NextResponse.json({ error: "No guild found" }, { status: 400 });
    }

    console.log(`[Sheet API] WRITE Request. Guild: ${guildId}`);

    // Use explicit type casting for Prisma JSON compatibility
    await prisma.clubSheet.upsert({
      where: { guildId: guildId },
      create: {
        guildId: guildId,
        data: body as any, // Cast to any to bypass strict InputJsonValue checks during build
      },
      update: {
        data: body as any,
      },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[Sheet API] POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
