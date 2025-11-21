/**
 * Snail Tier Calculator Page
 *
 * Calculates snail tier based on level, city level, relic power, and club contribution.
 * Supports both sandbox mode (local fallback) and live mode (admin-api).
 */

"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ConnectionBadge } from "@/components/status/connection-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Callout } from "@/components/ui/callout";
import { Calculator } from "lucide-react";
import {
  calculateSnailTier,
  type SnailTierInput,
  type SnailTierResult,
} from "@/lib/api/snail-tier";

export default function TiersPage() {
  const [form, setForm] = useState<SnailTierInput>({
    level: 1,
    cityLevel: 1,
    relicPower: 0,
    clubContribution: 0,
  });

  const [result, setResult] = useState<SnailTierResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle input change for form fields
   */
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value) || 0;
    setForm((prev) => ({ ...prev, [name]: numValue }));
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await calculateSnailTier(form);
      setResult(res);
    } catch (err) {
      console.error("Failed to calculate tier", err);
      setError("Failed to calculate tier. Using last result if available.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get tier badge color based on tier value
   */
  const getTierBadgeVariant = (tier: SnailTierResult["tier"]) => {
    switch (tier) {
      case "S+":
      case "S":
        return "default";
      case "A":
        return "secondary";
      case "B":
      case "C":
        return "outline";
      default:
        return "destructive";
    }
  };

  return (
    <PageShell
      icon={<span>🏅</span>}
      title="Snail Tier Calculator"
      subtitle="Estimate your snail's tier based on level, city, relics, and club contribution."
      status={<ConnectionBadge />}
      primaryAction={null}
    >
      <div className="grid gap-6 md:grid-cols-2">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Enter Your Stats</CardTitle>
            <CardDescription>
              Fill in your snail's statistics to calculate the tier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="level"
                  className="block text-sm font-medium mb-2"
                >
                  Snail Level
                </label>
                <input
                  type="number"
                  id="level"
                  name="level"
                  value={form.level}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neon-green"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="cityLevel"
                  className="block text-sm font-medium mb-2"
                >
                  City Level
                </label>
                <input
                  type="number"
                  id="cityLevel"
                  name="cityLevel"
                  value={form.cityLevel}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neon-green"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="relicPower"
                  className="block text-sm font-medium mb-2"
                >
                  Relic Power
                </label>
                <input
                  type="number"
                  id="relicPower"
                  name="relicPower"
                  value={form.relicPower}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neon-green"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="clubContribution"
                  className="block text-sm font-medium mb-2"
                >
                  Club Contribution
                </label>
                <input
                  type="number"
                  id="clubContribution"
                  name="clubContribution"
                  value={form.clubContribution}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neon-green"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="neon"
                className="w-full"
                disabled={isLoading}
              >
                <Calculator className="h-4 w-4 mr-2" />
                {isLoading ? "Calculating..." : "Calculate Tier"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Your Tier</CardTitle>
            <CardDescription>
              Based on your current stats
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Callout variant="warn" className="mb-4">
                {error}
              </Callout>
            )}

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : result ? (
              <div className="space-y-4">
                {/* Tier Display */}
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="mb-2 text-sm text-muted-foreground">
                      Your Tier
                    </div>
                    <Badge
                      variant={getTierBadgeVariant(result.tier)}
                      className="text-4xl font-bold px-6 py-3"
                    >
                      {result.tier}
                    </Badge>
                  </div>
                </div>

                {/* Score */}
                <div className="rounded-lg border bg-muted/50 p-4 text-center">
                  <div className="text-2xl font-bold">{Math.round(result.score)}</div>
                  <div className="text-sm text-muted-foreground">Total Score</div>
                </div>

                {/* Summary */}
                <div className="rounded-lg border bg-muted/50 p-4">
                  <p className="text-sm">{result.summary}</p>
                </div>

                {/* Details */}
                <div>
                  <h4 className="mb-2 text-sm font-medium">Calculation Details</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {result.details.map((detail, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[300px] items-center justify-center text-center">
                <div className="text-muted-foreground">
                  <Calculator className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p>Enter your stats and click Calculate to see your tier</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How Tier Calculation Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              The tier calculator uses a weighted scoring system based on your snail's statistics:
            </p>
            <ul className="space-y-1 ml-4">
              <li>• <strong>Level:</strong> Your snail's level (weight: 2x)</li>
              <li>• <strong>City Level:</strong> Your city's level (weight: 3x)</li>
              <li>• <strong>Relic Power:</strong> Total relic power (weight: 0.001x)</li>
              <li>• <strong>Club Contribution:</strong> Your club contribution (weight: 1.5x)</li>
            </ul>
            <p className="mt-3">
              <strong>Tier Thresholds:</strong> S+ (2000+), S (1500+), A (1100+), B (800+), C (500+), D (250+), F (&lt;250)
            </p>
            <p className="mt-3 text-xs">
              <em>Note: This is a simplified formula. The actual tier calculation in the game may differ.</em>
            </p>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
