import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await params;
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized", debug: { authHeaderPresent: !!authHeader } }, { status: 401 });
    }

    const session = await db.chatSession.findUnique({
      where: { token: token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    // Get channel with memberships
    const channel = await db.chatChannel.findUnique({
      where: { id: channelId },
      include: {
        guild: {
          include: {
            memberships: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    role: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    // Return guild members for this channel
    const members = channel.guild.memberships.map((m) => ({
      id: m.user.id,
      username: m.user.username,
      role: m.user.role,
    }));

    return NextResponse.json({ members });
  } catch (error) {
    console.error("Failed to fetch channel members error detail:", error);
    return NextResponse.json(
      { error: "Failed to fetch members", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
