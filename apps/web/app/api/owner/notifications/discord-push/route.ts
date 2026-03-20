import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const DISCORD_TOKEN = process.env.BOT_SYNC_SECRET || "";

// POST /api/owner/notifications/discord-push
// Processes unsent notifications and delivers them to Discord webhook.
// Called by cron every 5 minutes. Uses Bearer token auth.
export async function POST(request: NextRequest) {
  try {
    // Bearer token auth
    const authHeader = request.headers.get("authorization");
    const providedToken = authHeader?.replace("Bearer ", "") || "";
    if (!DISCORD_TOKEN || providedToken !== DISCORD_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Load webhook URL from DashboardSettings (singleton for the owner)
    const settings = await prisma.dashboardSettings.findFirst();
    const webhookUrl = settings?.discordWebhookUrl;
    if (!webhookUrl) {
      return NextResponse.json({ skipped: true, reason: "no webhook url configured" });
    }

    // Validate webhook URL format
    if (
      !webhookUrl.startsWith("https://discord.com/api/webhooks/") &&
      !webhookUrl.startsWith("https://discordapp.com/api/webhooks/")
    ) {
      return NextResponse.json({ error: "invalid webhook url" }, { status: 400 });
    }

    // Fetch up to 20 unsent, undismissed notifications
    const unsent = await prisma.slimyNotification.findMany({
      where: { sentToDiscord: false, dismissed: false },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    if (unsent.length === 0) {
      return NextResponse.json({ sent: 0, failed: 0, remaining: 0 });
    }

    let sent = 0;
    let failed = 0;
    let rateLimited = false;

    for (const notif of unsent) {
      // Stop on rate limit
      if (rateLimited) break;

      const color =
        notif.severity === "error" ? 0xff0000 :
        notif.severity === "warn"  ? 0xffaa00 :
        0x00ffc8;

      const embed = {
        embeds: [{
          title: notif.title,
          description: notif.message,
          color,
          timestamp: new Date(notif.createdAt).toISOString(),
          footer: { text: `SlimyAI \u2022 ${notif.type}` },
        }],
      };

      try {
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(embed),
        });

        if (res.status === 429) {
          rateLimited = true;
          console.warn("[discord-push] Rate limited, stopping batch");
          break;
        }

        if (!res.ok) {
          console.error(`[discord-push] Discord returned ${res.status} for notif ${notif.id}`);
          failed++;
          continue;
        }

        // Mark as sent
        await prisma.slimyNotification.update({
          where: { id: notif.id },
          data: { sentToDiscord: true },
        });
        sent++;

        // 500ms delay to respect Discord rate limits
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (err) {
        console.error(`[discord-push] Failed to send notif ${notif.id}:`, err);
        failed++;
      }
    }

    const remaining = await prisma.slimyNotification.count({
      where: { sentToDiscord: false, dismissed: false },
    });

    return NextResponse.json({ sent, failed, remaining, rateLimited });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error("[/api/owner/notifications/discord-push POST] Error:", error);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
