"use client";

import React, { useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Calculator, Award } from "lucide-react";

type TierResult = {
  tier: string;
  score: number;
  explanation: string;
};

export default function TiersPage() {
  const [snailLevel, setSnailLevel] = useState<number>(0);
  const [cityLevel, setCityLevel] = useState<number>(0);
  const [relicPower, setRelicPower] = useState<number>(0);
  const [clubContribution, setClubContribution] = useState<number>(0);
  const [result, setResult] = useState<TierResult | null>(null);

  const calculateTier = (e: React.FormEvent) => {
    e.preventDefault();

    // Simple mock tier calculation logic
    const totalScore =
      snailLevel * 10 +
      cityLevel * 15 +
      relicPower * 0.001 +
      clubContribution * 0.0001;

    let tier = "F";
    let explanation = "Beginner tier. Keep building!";

    if (totalScore >= 5000) {
      tier = "S+";
      explanation = "Elite tier! You're dominating the game.";
    } else if (totalScore >= 4000) {
      tier = "S";
      explanation = "Top tier performance. Excellent progress!";
    } else if (totalScore >= 3000) {
      tier = "A+";
      explanation = "Very strong performance. Keep it up!";
    } else if (totalScore >= 2000) {
      tier = "A";
      explanation = "Solid mid-high tier. You're doing well.";
    } else if (totalScore >= 1500) {
      tier = "B+";
      explanation = "Good progress. Room for improvement.";
    } else if (totalScore >= 1000) {
      tier = "B";
      explanation = "Decent tier. Keep grinding!";
    } else if (totalScore >= 500) {
      tier = "C";
      explanation = "Early-mid tier. Focus on leveling up.";
    } else if (totalScore >= 100) {
      tier = "D";
      explanation = "Early game tier. Lots of potential ahead!";
    }

    setResult({ tier, score: Math.round(totalScore), explanation });
  };

  const sidebar = (
    <div className="space-y-3">
      <div className="border border-slate-800 rounded-lg bg-slate-900/60 p-3">
        <h2 className="text-xs font-semibold text-slate-200 mb-1">
          About Tier Calculator
        </h2>
        <p className="text-xs text-slate-400">
          Estimates your player tier based on snail level, city level, relic
          power, and club contributions. This is a simple mock formula; a
          real ML model will provide more accurate tiers later.
        </p>
      </div>
      <div className="border border-slate-800 rounded-lg bg-slate-900/60 p-3">
        <h2 className="text-xs font-semibold text-slate-200 mb-1">
          Tier Levels
        </h2>
        <div className="text-xs text-slate-400 space-y-1">
          <div className="flex justify-between">
            <span>S+ / S</span>
            <span className="text-neon-green">Elite</span>
          </div>
          <div className="flex justify-between">
            <span>A+ / A</span>
            <span className="text-green-400">High</span>
          </div>
          <div className="flex justify-between">
            <span>B+ / B</span>
            <span className="text-yellow-400">Mid</span>
          </div>
          <div className="flex justify-between">
            <span>C / D</span>
            <span className="text-orange-400">Early</span>
          </div>
          <div className="flex justify-between">
            <span>F</span>
            <span className="text-slate-400">Beginner</span>
          </div>
        </div>
      </div>
      <div className="border border-slate-800 rounded-lg bg-slate-900/60 p-3">
        <h2 className="text-xs font-semibold text-slate-200 mb-1">
          Integration TODOs
        </h2>
        <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
          <li>Train ML model on real player data</li>
          <li>Connect to admin-api /tiers endpoint</li>
          <li>Auto-fetch stats from screenshots</li>
          <li>Show tier progression over time</li>
        </ul>
      </div>
    </div>
  );

  const status = (
    <>
      <span className="inline-flex h-2 w-2 rounded-full bg-amber-400" />
      <span>Sandbox mode – using simple mock formula</span>
    </>
  );

  return (
    <PageShell
      icon={<Calculator className="h-6 w-6 text-neon-green" />}
      title="Tier Calculator"
      subtitle="Estimate your player tier. ML model integration pending."
      primaryAction={
        <button
          type="button"
          className="rounded-md bg-neon-green px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-lime-green"
        >
          Save Results
        </button>
      }
      status={status}
      sidebar={sidebar}
    >
      <form onSubmit={calculateTier} className="space-y-4">
        {/* Input Form */}
        <div className="border border-slate-800 rounded-lg bg-slate-900/60 p-4">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">
            Enter Your Stats
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Snail Level
              </label>
              <input
                type="number"
                min="0"
                value={snailLevel}
                onChange={(e) => setSnailLevel(Number(e.target.value))}
                className="w-full bg-slate-900 text-sm text-slate-100 rounded-md px-3 py-2 outline-none border border-slate-700 focus:border-neon-green"
                placeholder="e.g. 85"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                City Level
              </label>
              <input
                type="number"
                min="0"
                value={cityLevel}
                onChange={(e) => setCityLevel(Number(e.target.value))}
                className="w-full bg-slate-900 text-sm text-slate-100 rounded-md px-3 py-2 outline-none border border-slate-700 focus:border-neon-green"
                placeholder="e.g. 120"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Relic Power
              </label>
              <input
                type="number"
                min="0"
                value={relicPower}
                onChange={(e) => setRelicPower(Number(e.target.value))}
                className="w-full bg-slate-900 text-sm text-slate-100 rounded-md px-3 py-2 outline-none border border-slate-700 focus:border-neon-green"
                placeholder="e.g. 1500000"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Club Contribution
              </label>
              <input
                type="number"
                min="0"
                value={clubContribution}
                onChange={(e) => setClubContribution(Number(e.target.value))}
                className="w-full bg-slate-900 text-sm text-slate-100 rounded-md px-3 py-2 outline-none border border-slate-700 focus:border-neon-green"
                placeholder="e.g. 25000000"
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-4 w-full rounded-md bg-neon-green px-4 py-2 text-sm font-medium text-slate-900 hover:bg-lime-green"
          >
            Calculate Tier
          </button>
        </div>

        {/* Result Card */}
        {result && (
          <div className="border-2 border-neon-green/50 rounded-lg bg-slate-900/80 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Award className="h-8 w-8 text-neon-green" />
              <div>
                <h3 className="text-sm font-semibold text-slate-400">
                  Your Tier
                </h3>
                <div className="text-4xl font-bold text-neon-green">
                  {result.tier}
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Score:</span>
                <span className="font-mono text-slate-100">
                  {result.score.toLocaleString()}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-700">
                <p className="text-xs text-slate-300">{result.explanation}</p>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Example Stats */}
      <div className="border border-slate-800 rounded-lg bg-slate-900/60 p-4">
        <h3 className="text-sm font-semibold text-slate-200 mb-2">
          Example Inputs
        </h3>
        <div className="text-xs text-slate-400 space-y-1">
          <p>
            <strong>S+ Tier:</strong> Snail 150, City 200, Relic 5M, Club 100M
          </p>
          <p>
            <strong>A Tier:</strong> Snail 100, City 120, Relic 2M, Club 40M
          </p>
          <p>
            <strong>B Tier:</strong> Snail 70, City 80, Relic 800K, Club 15M
          </p>
          <p>
            <strong>C Tier:</strong> Snail 40, City 50, Relic 300K, Club 5M
          </p>
        </div>
      </div>
    </PageShell>
  );
}
