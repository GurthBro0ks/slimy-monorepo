import { NextResponse } from "next/server";
import { slimeChatGetUser } from "@/lib/auth/slimechat-client";
import { getServerDetails, validateServerMembership, getUserServers } from "@/lib/db/server-queries";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const { guildId } = await params;

  try {
    const user = await slimeChatGetUser();
    const userId = user._id;

    const isMember = await validateServerMembership(userId, guildId);
    if (!isMember) {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
    }

    const guild = await getServerDetails(guildId);
    if (!guild) {
      return NextResponse.json({ success: false, error: "Guild not found" }, { status: 404 });
    }

    // Get user roles specifically for this guild
    const allServers = await getUserServers(userId);
    const serverEntry = allServers.find(s => s.serverId === guildId);

    return NextResponse.json({
      guild,
      userRoles: serverEntry?.userRoles || [],
      isMember: true
    });
  } catch (error) {
    console.error(`[API Guild ${guildId}] Error:`, error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
