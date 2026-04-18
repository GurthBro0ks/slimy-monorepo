import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    return NextResponse.json({
      status: "ok",
      message: "push skipped — DISCORD_WEBHOOK_URL not configured (stub)",
    });
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title: "Snail Codes Update",
            description: "Manual push triggered from /snail-codes scanner page.",
            color: 0x39ff14,
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { status: "error", message: `Discord returned ${res.status}` },
        { status: 502 }
      );
    }

    return NextResponse.json({
      status: "ok",
      message: "pushed to Discord successfully",
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        message: err instanceof Error ? err.message : "push failed",
      },
      { status: 500 }
    );
  }
}
