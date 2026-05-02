import { NextResponse } from "next/server";
import { slimeChatGetUser } from "@/lib/auth/slimechat-client";
import { getUserServers } from "@/lib/db/server-queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await slimeChatGetUser();
    const userId = user._id;
    
    const guilds = await getUserServers(userId);
    
    return NextResponse.json({ guilds });
  } catch (error) {
    console.error("[API Guilds] Error:", error);
    return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 401 });
  }
}
