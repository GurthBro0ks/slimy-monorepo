'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Callout } from '@/components/ui/callout';
import { Image, TrendingUp, Award, Activity } from 'lucide-react';
import {
  fetchLatestScreenshots,
  getSandboxScreenshots,
  type SnailAnalysisPayload,
} from '@/lib/api/snail-screenshots';
import { adminApiClient } from '@/lib/api/admin-client';

/**
 * Get tier badge color classes based on tier
 */
function getTierBadgeClasses(tier: string): string {
  const tierUpper = tier.toUpperCase();

  if (tierUpper.includes('S+')) {
    return 'border-purple-400/50 bg-purple-500/10 text-purple-300';
  } else if (tierUpper.includes('S')) {
    return 'border-pink-400/50 bg-pink-500/10 text-pink-300';
  } else if (tierUpper.includes('A')) {
    return 'border-emerald-400/50 bg-emerald-500/10 text-emerald-300';
  } else if (tierUpper.includes('B')) {
    return 'border-blue-400/50 bg-blue-500/10 text-blue-300';
  } else if (tierUpper.includes('C')) {
    return 'border-yellow-400/50 bg-yellow-500/10 text-yellow-300';
  } else if (tierUpper.includes('D')) {
    return 'border-orange-400/50 bg-orange-500/10 text-orange-300';
  } else {
    return 'border-red-400/50 bg-red-500/10 text-red-300';
  }
}

/**
 * Format confidence as percentage
 */
function formatConfidence(confidence?: number): string {
  if (confidence === undefined) return 'N/A';
  return `${Math.round(confidence * 100)}%`;
}

/**
 * Calculate average confidence from metrics
 */
function getAverageConfidence(confidence?: Record<string, number | undefined>): number | null {
  if (!confidence) return null;

  const values = Object.values(confidence).filter((v): v is number => typeof v === 'number');
  if (values.length === 0) return null;

  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export default function ScreenshotsPage() {
  const [analysis, setAnalysis] = useState<SnailAnalysisPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingSandbox, setUsingSandbox] = useState(false);

  useEffect(() => {
    async function loadScreenshots() {
      setLoading(true);

      // Check if admin API is configured
      if (!adminApiClient.isConfigured()) {
        // Use sandbox data
        setAnalysis(getSandboxScreenshots());
        setUsingSandbox(true);
        setLoading(false);
        return;
      }

      // Fetch from API
      const response = await fetchLatestScreenshots('test-guild-123');

      if (response.ok) {
        setAnalysis(response.data);
        setUsingSandbox(false);
      } else {
        // Fall back to sandbox on error
        console.warn('Failed to fetch screenshots, using sandbox:', response.message);
        setAnalysis(getSandboxScreenshots());
        setUsingSandbox(true);
      }

      setLoading(false);
    }

    loadScreenshots();
  }, []);

  if (loading) {
    return (
      <div className="container px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-6 text-4xl font-bold">Screenshot Analysis</h1>
          <Card className="p-8 rounded-2xl border border-emerald-500/30 bg-zinc-900/40">
            <div className="text-center">
              <Activity className="h-12 w-12 mx-auto mb-4 text-neon-green animate-pulse" />
              <p className="text-muted-foreground">Loading screenshot analysis...</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!analysis || analysis.results.length === 0) {
    return (
      <div className="container px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-6 text-4xl font-bold">Screenshot Analysis</h1>
          <Callout variant="note">
            No screenshot analysis available yet. Upload screenshots to see tier suggestions and insights!
          </Callout>
        </div>
      </div>
    );
  }

  // Compute summary metrics
  const totalResults = analysis.results.length;
  const scored = analysis.results.filter(r => typeof r.stats?.suggestedScore === 'number');
  const avgScore = scored.length
    ? scored.reduce((sum, r) => sum + (r.stats!.suggestedScore as number), 0) / scored.length
    : null;

  const best = scored.length
    ? scored.reduce((max, current) =>
        (current.stats!.suggestedScore as number) > (max.stats!.suggestedScore as number)
          ? current
          : max
      )
    : null;

  const bestTier = best?.stats?.suggestedTier ?? null;

  return (
    <div className="container px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold">Screenshot Analysis</h1>
          <p className="text-muted-foreground">
            AI-powered analysis of your Super Snail screenshots with tier suggestions
          </p>
        </div>

        {usingSandbox && (
          <Callout variant="note" className="mb-6">
            Sandbox mode: Showing example data. Connect Admin API to analyze real screenshots.
          </Callout>
        )}

        {/* Summary Metrics */}
        {scored.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm">
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Screenshots Analyzed
                  </CardTitle>
                  <Image className="h-4 w-4 text-neon-green" aria-label="Screenshots icon" />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-3xl font-bold">{totalResults}</div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm">
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Avg Slimy Score
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-neon-green" />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-3xl font-bold">
                  {avgScore !== null ? Math.round(avgScore * 10) / 10 : 'N/A'}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm">
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Best Tier This Run
                  </CardTitle>
                  <Award className="h-4 w-4 text-neon-green" />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-3xl font-bold">
                  {bestTier || 'N/A'}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Screenshot Results Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {analysis.results.map((result, index) => {
            const isTopSnail = best && result === best;
            const avgConfidence = getAverageConfidence(result.confidence);

            return (
              <Card
                key={`${result.imageUrl}-${index}`}
                className={`rounded-2xl border shadow-sm transition-all ${
                  isTopSnail
                    ? 'border-purple-500/50 bg-gradient-to-br from-purple-900/20 to-zinc-900/40 ring-2 ring-purple-500/20'
                    : 'border-emerald-500/30 bg-zinc-900/40 hover:bg-zinc-900/60'
                }`}
              >
                <CardHeader className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {result.stats.suggestedTier && (
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getTierBadgeClasses(
                              result.stats.suggestedTier
                            )}`}
                          >
                            {result.stats.suggestedTier}
                          </span>
                        )}
                        {isTopSnail && (
                          <span className="inline-flex items-center rounded-full border border-purple-400/50 bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-purple-300">
                            ⭐ Top Snail
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-base mt-2">
                        Screenshot #{index + 1}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {new Date(result.timestamp).toLocaleString()}
                      </CardDescription>
                    </div>
                    <Image className="h-8 w-8 text-neon-green/50" aria-label="Screenshot icon" />
                  </div>

                  {/* Slimy Score */}
                  {typeof result.stats.suggestedScore === 'number' && (
                    <div className="mt-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                      <div className="text-xs text-muted-foreground mb-1">Slimy Score</div>
                      <div className="text-2xl font-bold text-emerald-300">
                        {Math.round(result.stats.suggestedScore * 10) / 10}
                      </div>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="p-4 pt-0">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {result.stats.snailLevel !== undefined && (
                      <div className="text-sm">
                        <div className="text-muted-foreground text-xs">Snail Level</div>
                        <div className="font-semibold">{result.stats.snailLevel}</div>
                      </div>
                    )}
                    {result.stats.cityLevel !== undefined && (
                      <div className="text-sm">
                        <div className="text-muted-foreground text-xs">City Level</div>
                        <div className="font-semibold">{result.stats.cityLevel}</div>
                      </div>
                    )}
                    {result.stats.simPower !== undefined && (
                      <div className="text-sm">
                        <div className="text-muted-foreground text-xs">Sim Power</div>
                        <div className="font-semibold">
                          {result.stats.simPower.toLocaleString()}
                        </div>
                      </div>
                    )}
                    {result.stats.relicPower !== undefined && (
                      <div className="text-sm">
                        <div className="text-muted-foreground text-xs">Relic Power</div>
                        <div className="font-semibold">
                          {result.stats.relicPower.toLocaleString()}
                        </div>
                      </div>
                    )}
                    {result.stats.clubContribution !== undefined && (
                      <div className="text-sm">
                        <div className="text-muted-foreground text-xs">Club Contribution</div>
                        <div className="font-semibold">
                          {result.stats.clubContribution.toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confidence */}
                  {avgConfidence !== null && (
                    <div className="text-xs text-muted-foreground border-t border-emerald-500/10 pt-3">
                      <span className="font-medium">Avg Confidence:</span>{' '}
                      {formatConfidence(avgConfidence)}
                      {result.confidence && (
                        <span className="ml-2 text-[10px]">
                          (Level: {formatConfidence(result.confidence.snailLevel)},
                          City: {formatConfidence(result.confidence.cityLevel)})
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {scored.length === 0 && (
          <Callout variant="note" className="mt-6">
            No tier suggestions available yet. Screenshots may still be processing or waiting for analysis.
          </Callout>
        )}
      </div>
    </div>
  );
}
