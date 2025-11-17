"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Callout } from "@/components/ui/callout";
import { Calendar, Trophy, Users, TrendingUp, Loader2, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/auth/protected-route";

interface SeasonMemberStats {
  id: number;
  memberKey: string;
  totalPowerGain: string;
  bestTier: string | null;
  participationCount: number;
}

interface Season {
  id: number;
  guildId: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  memberStats?: SeasonMemberStats[];
  _count?: {
    memberStats: number;
  };
}

export default function SeasonsPage() {
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null);
  const [pastSeasons, setPastSeasons] = useState<Season[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock guild ID - in real app this would come from auth context
  const guildId = 'guild-123';

  // Load seasons on mount
  useEffect(() => {
    loadSeasons();
  }, []);

  const loadSeasons = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load current season
      const currentResponse = await fetch(`/api/seasons/current/${guildId}`);
      if (currentResponse.ok) {
        const currentData = await currentResponse.json();
        setCurrentSeason(currentData.season);
      }

      // Load all seasons
      const allResponse = await fetch(`/api/seasons/${guildId}`);
      if (allResponse.ok) {
        const allData = await allResponse.json();
        // Filter out the current season from past seasons
        const past = allData.seasons.filter((s: Season) => !s.isActive);
        setPastSeasons(past);
      }
    } catch (err) {
      console.error('Failed to load seasons:', err);
      setError('Failed to load seasons data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPowerGain = (powerGain: string) => {
    const value = parseInt(powerGain);
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Club Seasons</h1>
            <p className="text-muted-foreground">
              Track member performance and achievements across seasonal periods
            </p>
          </div>
        </div>

        {error && (
          <Callout variant="error" title="Error">
            {error}
          </Callout>
        )}

        {/* Current Season */}
        {currentSeason ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  <CardTitle>Current Season: {currentSeason.name}</CardTitle>
                </div>
                <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  Active
                </div>
              </div>
              <CardDescription>
                {formatDate(currentSeason.startDate)} - {formatDate(currentSeason.endDate)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentSeason.memberStats && currentSeason.memberStats.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{currentSeason.memberStats.length} members participating</span>
                  </div>

                  {/* Top Performers Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4">Rank</th>
                          <th className="text-left py-2 px-4">Member</th>
                          <th className="text-left py-2 px-4">Power Gain</th>
                          <th className="text-left py-2 px-4">Best Tier</th>
                          <th className="text-left py-2 px-4">Participation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentSeason.memberStats.slice(0, 10).map((stat, index) => (
                          <tr key={stat.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                {index < 3 && <Award className="w-4 h-4 text-yellow-500" />}
                                <span className="font-medium">#{index + 1}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-medium">{stat.memberKey}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1 text-green-600">
                                <TrendingUp className="w-4 h-4" />
                                {formatPowerGain(stat.totalPowerGain)}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {stat.bestTier ? (
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                                  {stat.bestTier}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">
                              {stat.participationCount} snapshots
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {currentSeason.memberStats.length > 10 && (
                    <p className="text-sm text-muted-foreground text-center">
                      Showing top 10 of {currentSeason.memberStats.length} members
                    </p>
                  )}
                </div>
              ) : (
                <Callout variant="info" title="No Data Yet">
                  This season doesn&apos;t have any member statistics yet. Stats will be calculated from
                  club analyses during the season period.
                </Callout>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-2">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-medium">No Active Season</h3>
                <p className="text-muted-foreground">
                  There is currently no active season for this guild.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Past Seasons */}
        {pastSeasons.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Past Seasons</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pastSeasons.map((season) => (
                <Card key={season.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{season.name}</CardTitle>
                    <CardDescription>
                      {formatDate(season.startDate)} - {formatDate(season.endDate)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>
                        {season._count?.memberStats || 0} members participated
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
