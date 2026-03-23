import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/auth/owner";
import { getAggregator } from "@/lib/codes-aggregator";
import { db as prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DISCORD_MESSAGE_MAX = 2000;

/**
 * POST /api/owner/snail-codes/push-discord
 * Pushes codes to Discord via the configured webhook
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    await requireOwner(request);

    // Get webhook URL from DashboardSettings
    const settings = await prisma.dashboardSettings.findFirst();
    const webhookUrl = settings?.discordWebhookUrl;

    if (!webhookUrl) {
      return NextResponse.json({
        success: false,
        error: "No webhook configured",
      });
    }

    // Validate webhook URL format
    if (
      !webhookUrl.startsWith("https://discord.com/api/webhooks/") &&
      !webhookUrl.startsWith("https://discordapp.com/api/webhooks/")
    ) {
      return NextResponse.json({ error: "invalid webhook url" }, { status: 400 });
    }

    // Get current codes
    const aggregator = getAggregator();
    const result = await aggregator.aggregateCodes();

    // Categorize codes
    const newCodes: string[] = [];
    const olderCodes: string[] = [];

    for (const code of result.codes) {
      if (code.source === "snelp") {
        if (!newCodes.includes(code.code)) {
          newCodes.push(code.code);
        }
      } else {
        if (!olderCodes.includes(code.code)) {
          olderCodes.push(code.code);
        }
      }
    }

    newCodes.sort();
    olderCodes.sort();

    // Format date
    const dateStr = new Date().toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });

    // Format code list for Discord
    const formatCodes = (codes: string[]) => codes.length > 0
      ? codes.join("\n")
      : "_No codes in this category_";

    // Build messages - split if needed (Discord has 2000 char limit per message)
    const messages: string[] = [];

    // New codes message
    if (newCodes.length > 0) {
      const newSection = `**NEW CODES (${newCodes.length})** _Updated ${dateStr}_\n\`\`\`\n${formatCodes(newCodes)}\n\`\`\``;
      if (newSection.length <= DISCORD_MESSAGE_MAX) {
        messages.push(newSection);
      } else {
        // Need to split - codes are one per line
        const codeText = formatCodes(newCodes);
        const header = `**NEW CODES (${newCodes.length})** _Updated ${dateStr}_\n\`\`\`\n`;
        const footer = "\n```";

        let current = header;
        for (const line of codeText.split("\n")) {
          if (current.length + line.length + footer.length > DISCORD_MESSAGE_MAX - 10) {
            messages.push(current + footer);
            current = "```\n" + line + "\n";
          } else {
            current += line + "\n";
          }
        }
        if (current !== header) {
          messages.push(current + footer);
        }
      }
    }

    // Older codes message
    if (olderCodes.length > 0) {
      const olderSection = `**OLDER CODES - MIGHT WORK (${olderCodes.length})**\n\`\`\`\n${formatCodes(olderCodes)}\n\`\`\`\n_Codes from wiki and community sources - may or may not still work_`;
      if (olderSection.length <= DISCORD_MESSAGE_MAX) {
        messages.push(olderSection);
      } else {
        // Split older codes into chunks too
        const codeText = formatCodes(olderCodes);
        const header = `**OLDER CODES - MIGHT WORK (${olderCodes.length})**\n\`\`\`\n`;
        const footer = "\n```\n_Codes from wiki and community sources - may or may not still work_";

        let current = header;
        for (const line of codeText.split("\n")) {
          if (current.length + line.length + footer.length > DISCORD_MESSAGE_MAX - 10) {
            messages.push(current + footer);
            current = "```\n" + line + "\n";
          } else {
            current += line + "\n";
          }
        }
        if (current !== header) {
          messages.push(current + footer);
        }
      }
    }

    // Footer
    const footerMsg = `_codes aggregated from snelp.com, wiki_`;
    messages.push(footerMsg);

    // Send all messages
    let sent = 0;
    let failed = 0;
    let rateLimited = false;

    for (const message of messages) {
      if (rateLimited) break;

      try {
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: message }),
        });

        if (res.status === 429) {
          rateLimited = true;
          console.warn("[push-discord] Rate limited");
          break;
        }

        if (!res.ok) {
          console.error(`[push-discord] Discord returned ${res.status}`);
          failed++;
          continue;
        }

        sent++;

        // Respect Discord rate limits (1 req/sec for webhooks)
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (err) {
        console.error("[push-discord] Failed to send message:", err);
        failed++;
      }
    }

    return NextResponse.json({
      success: sent > 0 && failed === 0,
      sent,
      failed,
      rate_limited: rateLimited,
      total_new: newCodes.length,
      total_older: olderCodes.length,
      messages_sent: messages.length,
    });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    console.error("[/api/owner/snail-codes/push-discord POST] Error:", error);
    return NextResponse.json(
      { error: "internal_server_error", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
