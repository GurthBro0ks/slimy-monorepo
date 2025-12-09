import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/server";
import { db as prisma } from "@/lib/db";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const user = await requireAuth(cookieStore);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use first guild as context
    const guildId = user.guilds[0]?.id;
    console.log(`[Sheet API] READ Request. User: ${user.username}, Guild: ${guildId}`);

    if (!guildId) {
        return NextResponse.json({ error: "No guild found" }, { status: 400 });
    }

    const sheet = await prisma.clubSheet.findUnique({
      where: { guildId: guildId },
    });

    let returnData = [];
    if (sheet && sheet.data) {
        // CRITICAL FIX: Deep clone the data to remove Prisma proxies
        // This prevents the 'TypeError: ... reading aa' crash in Next.js 15
        try {
            returnData = JSON.parse(JSON.stringify(sheet.data));
            console.log(`[Sheet API] FOUND Data. Size: ${JSON.stringify(returnData).length}`);
        } catch (e) {
            console.error("[Sheet API] JSON Parse Error:", e);
            returnData = [];
        }
    } else {
        console.log(`[Sheet API] NO Data found for guild ${guildId}.`);
    }

    return NextResponse.json(returnData);

  } catch (error) {
    console.error("[Sheet API] GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const user = await requireAuth(cookieStore);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const guildId = user.guilds[0]?.id;

    if (!guildId) {
        return NextResponse.json({ error: "No guild found" }, { status: 400 });
    }

    console.log(`[Sheet API] WRITE Request. Guild: ${guildId}`);

    await prisma.clubSheet.upsert({
      where: { guildId: guildId },
      create: {
        guildId: guildId,
        data: body,
      },
      update: {
        data: body,
      },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[Sheet API] POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
