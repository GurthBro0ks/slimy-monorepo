import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import { db as prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// POST /api/owner/notifications/discord-test
// Sends a test message to the configured Discord webhook.
export async function POST(request: NextRequest) {
  try {
    const ctx = await requireOwner(request);

    const settings = await prisma.dashboardSettings.findUnique({
      where: { userId: ctx.owner.id },
    });
    const webhookUrl = settings?.discordWebhookUrl;

    if (!webhookUrl) {
      return NextResponse.json(
        { error: "No webhook URL configured. Save one in Settings first." },
        { status: 400 }
      );
    }

    if (
      !webhookUrl.startsWith("https://discord.com/api/webhooks/") &&
      !webhookUrl.startsWith("https://discordapp.com/api/webhooks/")
    ) {
      return NextResponse.json(
        { error: "Invalid Discord webhook URL format." },
        { status: 400 }
      );
    }

    const testPayload = {
      embeds: [{
        title: "\u0001F4A5 SlimyAI Test",
        description: "Notification delivery is working! You will receive alerts here.",
        color: 0x00ffc8,
        timestamp: new Date().toISOString(),
        footer: { text: "SlimyAI \u2022 test" },
      }],
    };

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testPayload),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Discord returned ${res.status}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("[/api/owner/notifications/discord-test POST] Error:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
