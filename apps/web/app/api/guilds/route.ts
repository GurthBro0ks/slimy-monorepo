import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { slimeChatGetUser } from "@/lib/auth/slimechat-client";
import { getUserServers } from "@/lib/db/server-queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("slimy_session")?.value;

  if (!sessionToken) {
    return NextResponse.json({ success: false, error: "No session" }, { status: 401 });
  }

  try {
    const user = await slimeChatGetUser(sessionToken);
    const userId = user._id;
    
    const guilds = await getUserServers(userId);
    
    return NextResponse.json({ guilds });
  } catch (error) {
    console.error("[API Guilds] Error:", error);
    return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 401 });
  }
}
