"use client";

import { useState, FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, TrendingUp, Lightbulb } from "lucide-react";
import {
  calculateTier,
  getTierColor,
  getTierDescription,
  type TierInputs,
  type TierResult,
} from "@/lib/snail-tier-calculator";

export default function TiersPage() {
  const [inputs, setInputs] = useState<TierInputs>({
    snailLevel: 100,
    cityLevel: 30,
    relicPower: 20000,
    clubContribution: 500,
  });

  const [result, setResult] = useState<TierResult | null>(null);

  function handleCalculate(e: FormEvent) {
    e.preventDefault();
    const tierResult = calculateTier(inputs);
    setResult(tierResult);
  }

  function handleInputChange(field: keyof TierInputs, value: string) {
    setInputs((prev) => ({
      ...prev,
      [field]: Number(value) || 0,
    }));
  }

  return (
    <div className="container px-4 py-16">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <Calculator className="h-10 w-10 text-neon-green" />
          <div>
            <h1 className="text-4xl font-bold">Tier Calculator</h1>
            <p className="text-muted-foreground">
              Determine your snail progression tier based on key stats
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input Form */}
          <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm">
            <CardHeader>
              <CardTitle>Your Stats</CardTitle>
              <CardDescription>
                Enter your current snail stats to calculate your tier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCalculate} className="space-y-4">
                {/* Snail Level */}
                <div>
                  <label
                    htmlFor="snailLevel"
                    className="mb-2 block text-sm font-medium text-slate-200"
                  >
                    Snail Level
                  </label>
                  <input
                    id="snailLevel"
                    type="number"
                    min="1"
                    max="300"
                    value={inputs.snailLevel}
                    onChange={(e) => handleInputChange("snailLevel", e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="e.g. 100"
                    required
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Your current snail level (1-300)
                  </p>
                </div>

                {/* City Level */}
                <div>
                  <label
                    htmlFor="cityLevel"
                    className="mb-2 block text-sm font-medium text-slate-200"
                  >
                    City Level
                  </label>
                  <input
                    id="cityLevel"
                    type="number"
                    min="1"
                    max="50"
                    value={inputs.cityLevel}
                    onChange={(e) => handleInputChange("cityLevel", e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="e.g. 30"
                    required
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Your city progression level (1-50)
                  </p>
                </div>

                {/* Relic Power */}
                <div>
                  <label
                    htmlFor="relicPower"
                    className="mb-2 block text-sm font-medium text-slate-200"
                  >
                    Relic Power
                  </label>
                  <input
                    id="relicPower"
                    type="number"
                    min="0"
                    max="1000000"
                    value={inputs.relicPower}
                    onChange={(e) => handleInputChange("relicPower", e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="e.g. 20000"
                    required
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Total power from your relics
                  </p>
                </div>

                {/* Club Contribution */}
                <div>
                  <label
                    htmlFor="clubContribution"
                    className="mb-2 block text-sm font-medium text-slate-200"
                  >
                    Club Contribution
                  </label>
                  <input
                    id="clubContribution"
                    type="number"
                    min="0"
                    max="100000"
                    value={inputs.clubContribution}
                    onChange={(e) => handleInputChange("clubContribution", e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="e.g. 500"
                    required
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Your weekly or total club contribution
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  variant="default"
                >
                  <Calculator className="mr-2 h-4 w-4" />
                  Calculate Tier
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-6">
            {result ? (
              <>
                {/* Tier Result */}
                <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm">
                  <CardHeader>
                    <CardTitle>Your Tier</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-baseline gap-3">
                      <div className={`text-6xl font-bold ${getTierColor(result.tier)}`}>
                        {result.tier}
                      </div>
                      <div className="text-sm text-slate-400">
                        <div>Score: {result.score}</div>
                        <div className="mt-1 text-xs">
                          {getTierDescription(result.tier)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Reasons */}
                <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-400" />
                      <CardTitle className="text-lg">Analysis</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-slate-300">
                      {result.reasons.map((reason, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400" />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Suggestions */}
                {result.suggestions.length > 0 && (
                  <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-yellow-400" />
                        <CardTitle className="text-lg">Suggestions</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm text-slate-300">
                        {result.suggestions.map((suggestion, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-yellow-400" />
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm">
                <CardContent className="flex h-64 items-center justify-center text-center">
                  <div className="text-slate-500">
                    <Calculator className="mx-auto mb-3 h-12 w-12 opacity-50" />
                    <p>Enter your stats and click Calculate Tier to see your results</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Info Footer */}
        <Card className="mt-8 rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-xs text-slate-500">
              <strong>Note:</strong> This tier calculator uses a deterministic algorithm
              based on common progression patterns. Tiers range from F (beginner) to S+
              (elite). The calculation is purely frontend-based and does not require a
              backend connection. Tier boundaries and scoring weights are heuristic and
              designed for gameplay guidance.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
