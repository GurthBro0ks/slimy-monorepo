import { ImageResponse } from "next/og";
import { getMockRawStats, scrubStats } from "@/lib/stats-scrubber";
import { isExperimentEnabled } from "@/lib/feature-flags";

export const runtime = "nodejs";

// Mock data for demonstration
const MOCK_GUILD_ID = "123456789";
const MOCK_GUILD_NAME = "The Snail Club";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const guildId = searchParams.get("guildId") || MOCK_GUILD_ID;

    // Check feature flag
    const isEnabled = isExperimentEnabled(guildId, "publicStats");

    if (!isEnabled) {
      return new ImageResponse(
        (
          <div
            style={{
              height: "100%",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#111827",
              color: "#F3F4F6",
              fontSize: 60,
              fontWeight: 700,
            }}
          >
            <p style={{ color: "#EF4444" }}>403 Forbidden</p>
            <p style={{ fontSize: 30, fontWeight: 400 }}>Public Stats are not enabled for this Guild.</p>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }

    // Fetch and scrub data
    const rawStats = getMockRawStats(guildId, MOCK_GUILD_NAME);
    const scrubbedStats = scrubStats(rawStats);

    // Calculate summary metrics
    const totalValue = scrubbedStats.reduce((sum, stat) => sum + stat.value, 0);
    const memberCount = scrubbedStats.length;

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 50,
            backgroundColor: "#111827",
            color: "#F3F4F6",
            border: "10px solid #39FF14",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 40, color: "#39FF14", marginBottom: 10 }}>
              Slimy.ai Public Stats
            </div>
            <div style={{ fontSize: 80, fontWeight: 900 }}>
              {MOCK_GUILD_NAME}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 30, color: "#9CA3AF" }}>Total Metric Value</div>
              <div style={{ fontSize: 60, fontWeight: 700 }}>
                {totalValue.toLocaleString()}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 30, color: "#9CA3AF" }}>Members Tracked</div>
              <div style={{ fontSize: 60, fontWeight: 700 }}>
                {memberCount}
              </div>
            </div>
          </div>

          <div style={{ fontSize: 24, color: "#9CA3AF" }}>
            Data is PII-scrubbed and updated hourly.
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    console.error(e);
    return new Response("Failed to generate image", { status: 500 });
  }
}
