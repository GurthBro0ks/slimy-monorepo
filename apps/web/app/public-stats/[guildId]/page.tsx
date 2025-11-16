import { notFound } from "next/navigation";
import { isExperimentEnabled } from "@/lib/feature-flags";
import { getMockRawStats, scrubStats } from "@/lib/stats-scrubber";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Metadata } from "next";

// Mock data for demonstration
const MOCK_GUILD_ID = "123456789";
const MOCK_GUILD_NAME = "The Snail Club";

// Set dynamic metadata for OG image
export async function generateMetadata({
  params,
}: {
  params: { guildId: string };
}): Promise<Metadata> {
  const guildId = params.guildId;

  return {
    title: `${MOCK_GUILD_NAME} - Public Stats`,
    description: `Real-time public stats for ${MOCK_GUILD_NAME} powered by Slimy.ai.`,
    openGraph: {
      images: [`/api/og/stats?guildId=${guildId}`],
    },
    twitter: {
      card: "summary_large_image",
      creator: "@SlimyAI",
      images: [`/api/og/stats?guildId=${guildId}`],
    },
  };
}

export default function PublicStatsPage({ params }: { params: { guildId: string } }) {
  const guildId = params.guildId;

  // 1. Check feature flag (server-side)
  // We use "web" as a mock guild ID for testing the feature flag system
  // In a real app, we'd check the specific guildId
  const isEnabled = isExperimentEnabled(guildId, "publicStats");

  if (!isEnabled) {
    // Return 404 or a forbidden message if the feature is not enabled
    // We choose notFound() to return a 404 status code
    notFound();
  }

  // 2. Fetch and scrub data
  const rawStats = getMockRawStats(guildId, MOCK_GUILD_NAME);
  const scrubbedStats = scrubStats(rawStats);

  // 3. Calculate summary metrics
  const totalValue = scrubbedStats.reduce((sum, stat) => sum + stat.value, 0);
  const lastUpdate = scrubbedStats.reduce((latest, stat) => {
    return stat.date > latest ? stat.date : latest;
  }, "N/A");

  return (
    <div className="container px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-4xl font-bold">{MOCK_GUILD_NAME} Public Stats</h1>
        <p className="text-muted-foreground mb-8">
          Read-only, PII-scrubbed metrics. Last updated: {lastUpdate}
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Metric Value</CardTitle>
              <Badge variant="neon">SCRUBBED</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Sum of all tracked values
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Member Count</CardTitle>
              <Badge variant="secondary">SCRUBBED</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scrubbedStats.length}</div>
              <p className="text-xs text-muted-foreground">
                Total members tracked
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Latest Value</CardTitle>
              <Badge variant="outline">SCRUBBED</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {scrubbedStats[scrubbedStats.length - 1]?.value.toLocaleString() || "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                From {scrubbedStats[scrubbedStats.length - 1]?.date || "N/A"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Metric Breakdown (PII Scrubbed)</h2>
          <div className="space-y-2">
            {scrubbedStats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="font-mono text-sm">
                    Member {index + 1}
                  </div>
                  <div className="text-lg font-semibold">
                    {stat.value.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.date}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
