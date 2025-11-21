'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Callout } from '@/components/ui/callout';
import { Calculator, TrendingUp, Lightbulb, Award } from 'lucide-react';
import {
  calculateTier,
  getSandboxTier,
  type SnailTierRequest,
  type SnailTierResponse,
} from '@/lib/api/snail-tier';
import { adminApiClient } from '@/lib/api/admin-client';

/**
 * Get tier band info based on score
 */
function getTierBand(score: number) {
  if (score >= 1000) {
    return { label: 'S+', description: 'Endgame monster snail.', color: 'text-purple-300' };
  }
  if (score >= 800) {
    return { label: 'S', description: 'Late-game powerhouse.', color: 'text-pink-300' };
  }
  if (score >= 600) {
    return { label: 'A', description: 'Strong and efficient.', color: 'text-emerald-300' };
  }
  if (score >= 400) {
    return { label: 'B', description: 'Solid mid-game snail.', color: 'text-blue-300' };
  }
  if (score >= 200) {
    return { label: 'C', description: 'Early/mid-game, needs work.', color: 'text-yellow-300' };
  }
  if (score >= 100) {
    return { label: 'D', description: 'Starter snail, lots of room.', color: 'text-orange-300' };
  }
  return { label: 'F', description: 'Fresh slime, just getting started.', color: 'text-red-300' };
}

/**
 * Get improvement suggestions based on input stats
 */
function getImprovementHints(stats: SnailTierRequest): string[] {
  const hints: string[] = [];

  // Check relic power relative to level
  const expectedRelicPower = stats.level * 200; // Rough heuristic
  if (stats.relicPower < expectedRelicPower * 0.6) {
    hints.push('🔮 Relics are lagging behind your level. Focus on relic upgrades and expeditions.');
  }

  // Check city level relative to snail level
  if (stats.cityLevel < stats.level * 0.7) {
    hints.push('🏰 City level is behind your snail level. Consider pushing city quests and upgrades.');
  }

  // Check club contribution
  if (stats.clubContribution < 100) {
    hints.push('🤝 Club contribution is low. Join an active club and participate regularly for bonuses.');
  }

  // Check sim power if provided
  if (stats.simPower && stats.simPower < stats.level * 2000) {
    hints.push('⚡ Sim power seems low for your level. Work on sim upgrades and gear.');
  }

  // Generic advice if no specific gaps
  if (hints.length === 0) {
    hints.push('🎯 Your stats are well-balanced! Continue progressing all areas evenly.');
  }

  return hints;
}

/**
 * Get tier badge color classes
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

export default function TiersPage() {
  const [formData, setFormData] = useState<SnailTierRequest>({
    level: 0,
    cityLevel: 0,
    relicPower: 0,
    clubContribution: 0,
    simPower: 0,
  });

  const [result, setResult] = useState<SnailTierResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [usingSandbox, setUsingSandbox] = useState(false);

  const handleInputChange = (field: keyof SnailTierRequest, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, [field]: numValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      // Check if admin API is configured
      if (!adminApiClient.isConfigured()) {
        // Use sandbox calculation
        const sandboxResult = getSandboxTier(formData);
        setResult(sandboxResult);
        setUsingSandbox(true);
        setLoading(false);
        return;
      }

      // Call API
      const response = await calculateTier(formData);

      if (response.ok) {
        setResult(response.data);
        setUsingSandbox(false);
      } else {
        // Fall back to sandbox on error
        console.warn('Tier calculation failed, using sandbox:', response.message);
        const sandboxResult = getSandboxTier(formData);
        setResult(sandboxResult);
        setUsingSandbox(true);
      }
    } catch (error) {
      console.error('Error calculating tier:', error);
      // Fall back to sandbox on exception
      const sandboxResult = getSandboxTier(formData);
      setResult(sandboxResult);
      setUsingSandbox(true);
    } finally {
      setLoading(false);
    }
  };

  const tierBand = result ? getTierBand(result.score) : null;
  const improvementHints = result ? getImprovementHints(formData) : [];

  return (
    <div className="container px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold">Snail Tier Calculator</h1>
          <p className="text-muted-foreground">
            Calculate your snail&apos;s tier and get personalized improvement suggestions
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input Form */}
          <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm">
            <CardHeader className="p-6">
              <div className="flex items-center gap-2">
                <Calculator className="h-6 w-6 text-neon-green" />
                <CardTitle>Enter Your Stats</CardTitle>
              </div>
              <CardDescription>
                Input your current snail stats to calculate your tier
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="level">Snail Level *</Label>
                  <Input
                    id="level"
                    type="number"
                    min="0"
                    value={formData.level || ''}
                    onChange={e => handleInputChange('level', e.target.value)}
                    placeholder="e.g., 45"
                    required
                    className="bg-zinc-800/50 border-emerald-500/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cityLevel">City Level *</Label>
                  <Input
                    id="cityLevel"
                    type="number"
                    min="0"
                    value={formData.cityLevel || ''}
                    onChange={e => handleInputChange('cityLevel', e.target.value)}
                    placeholder="e.g., 38"
                    required
                    className="bg-zinc-800/50 border-emerald-500/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="relicPower">Relic Power *</Label>
                  <Input
                    id="relicPower"
                    type="number"
                    min="0"
                    value={formData.relicPower || ''}
                    onChange={e => handleInputChange('relicPower', e.target.value)}
                    placeholder="e.g., 8500"
                    required
                    className="bg-zinc-800/50 border-emerald-500/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clubContribution">Club Contribution *</Label>
                  <Input
                    id="clubContribution"
                    type="number"
                    min="0"
                    value={formData.clubContribution || ''}
                    onChange={e => handleInputChange('clubContribution', e.target.value)}
                    placeholder="e.g., 250"
                    required
                    className="bg-zinc-800/50 border-emerald-500/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="simPower">Sim Power (Optional)</Label>
                  <Input
                    id="simPower"
                    type="number"
                    min="0"
                    value={formData.simPower || ''}
                    onChange={e => handleInputChange('simPower', e.target.value)}
                    placeholder="e.g., 125000"
                    className="bg-zinc-800/50 border-emerald-500/30"
                  />
                </div>

                <Button
                  type="submit"
                  variant="neon"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Calculating...' : 'Calculate Tier'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-6">
            {usingSandbox && (
              <Callout variant="note">
                Sandbox mode: Using client-side calculation. Connect Admin API for server-side formulas.
              </Callout>
            )}

            {result && (
              <>
                {/* Tier Result */}
                <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm">
                  <CardHeader className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Award className="h-6 w-6 text-neon-green" />
                      <CardTitle>Your Tier</CardTitle>
                    </div>

                    <div className="flex items-center gap-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-4 py-2 text-xl font-bold uppercase tracking-wide ${getTierBadgeClasses(
                          result.tier
                        )}`}
                      >
                        {result.tier}
                      </span>
                      {tierBand && (
                        <div className="text-sm text-muted-foreground">
                          {tierBand.description}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 space-y-4">
                    {/* Slimy Score */}
                    <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-emerald-300" />
                        <div className="text-sm font-medium text-emerald-300">Slimy Score</div>
                      </div>
                      <div className="text-3xl font-bold text-emerald-300 mb-2">
                        {result.score}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        This score is computed from your level, city, relic power, club contribution, and sim power.
                      </div>
                    </div>

                    {/* Tier Band Explanation */}
                    {tierBand && (
                      <div className="text-sm">
                        <div className="font-medium mb-1">Tier Band</div>
                        <div className="text-muted-foreground">
                          You&apos;re in the <span className={tierBand.color}>{tierBand.label}</span> band: {tierBand.description}
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    <div>
                      <div className="font-medium text-sm mb-2">Summary</div>
                      <p className="text-sm text-muted-foreground">{result.summary}</p>
                    </div>

                    {/* Stats Breakdown */}
                    {result.details && result.details.length > 0 && (
                      <div>
                        <div className="font-medium text-sm mb-2">Stats Breakdown</div>
                        <ul className="space-y-1">
                          {result.details.map((detail, index) => (
                            <li key={index} className="text-xs text-muted-foreground">
                              • {detail}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Improvement Hints */}
                {improvementHints.length > 0 && (
                  <Card className="rounded-2xl border border-blue-500/30 bg-blue-900/10 shadow-sm">
                    <CardHeader className="p-6">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-6 w-6 text-blue-400" />
                        <CardTitle>What to Improve Next</CardTitle>
                      </div>
                      <CardDescription>
                        Suggestions based on your current stats
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                      <ul className="space-y-3">
                        {improvementHints.map((hint, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <span className="text-blue-400 font-medium">{hint}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {!result && (
              <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40 shadow-sm">
                <CardContent className="p-8 text-center">
                  <Calculator className="h-12 w-12 mx-auto mb-4 text-neon-green/50" />
                  <p className="text-muted-foreground">
                    Enter your stats and click &quot;Calculate Tier&quot; to see your results
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
