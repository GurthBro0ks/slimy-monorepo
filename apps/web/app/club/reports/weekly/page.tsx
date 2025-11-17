"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Callout } from "@/components/ui/callout";
import { Calendar, FileText, Loader2, Download, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProtectedRoute } from "@/components/auth/protected-route";

interface WeeklyReportSummary {
  totalMembers: number;
  avgPowerDelta: number;
  topGainers: Array<{ memberKey: string; powerDelta: number }>;
  topTierMembers: Array<{ memberKey: string; tier: string }>;
  totalAnalyses: number;
  avgConfidence: number;
}

interface WeeklyReport {
  guildId: string;
  weekStart: string;
  weekEnd: string;
  summary: WeeklyReportSummary;
  raw: any;
  discordEmbeds: any[];
  html: string;
}

export default function WeeklyReportPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  // TODO: Get from auth context in production
  const [guildId, setGuildId] = useState("guild-123");
  const [weekStart, setWeekStart] = useState("");

  // Auto-load report on mount with default settings
  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        guildId,
        ...(weekStart && { weekStart: new Date(weekStart).toISOString() }),
      });

      const response = await fetch(`/api/reports/weekly?${queryParams}`);

      if (!response.ok) {
        throw new Error(`Failed to generate report: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setReport(data.data);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Error loading report:", err);
      setError(err instanceof Error ? err.message : "Failed to load report");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendToDiscord = async () => {
    if (!report) return;

    setIsSending(true);
    setError(null);

    try {
      // TODO: Add UI for channel ID selection
      const channelId = "channel-123"; // Placeholder

      const response = await fetch("/api/reports/weekly/send-discord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guildId,
          channelId,
          ...(weekStart && { weekStart: new Date(weekStart).toISOString() }),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send to Discord: ${response.statusText}`);
      }

      const data = await response.json();
      alert(data.data?.message || "Report sent to Discord successfully!");
    } catch (err) {
      console.error("Error sending to Discord:", err);
      setError(err instanceof Error ? err.message : "Failed to send to Discord");
    } finally {
      setIsSending(false);
    }
  };

  const handleDownloadHTML = () => {
    if (!report) return;

    const blob = new Blob([report.html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `weekly-report-${report.guildId}-${report.weekStart}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <ProtectedRoute requiredRole="club">
      <div className="container px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="mb-2 text-4xl font-bold">Weekly Club Report</h1>
            <p className="text-muted-foreground">
              Generate and view comprehensive weekly performance reports
            </p>
          </div>

          <Callout variant="note" className="mb-6 text-sm">
            Reports aggregate club analytics including member performance, power deltas, and tier rankings.
          </Callout>

          {/* Configuration Section */}
          <Card className="mb-6 rounded-2xl border border-emerald-500/30 bg-zinc-900/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-neon-green" />
                Report Settings
              </CardTitle>
              <CardDescription>
                Configure the guild and date range for your report
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="guildId">Guild ID</Label>
                  <Input
                    id="guildId"
                    value={guildId}
                    onChange={(e) => setGuildId(e.target.value)}
                    placeholder="Enter guild ID"
                    className="bg-zinc-800 border-zinc-700"
                  />
                  <p className="text-xs text-muted-foreground">
                    In production, this will be auto-detected from your authentication
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weekStart">Week Start Date (Optional)</Label>
                  <Input
                    id="weekStart"
                    type="date"
                    value={weekStart}
                    onChange={(e) => setWeekStart(e.target.value)}
                    className="bg-zinc-800 border-zinc-700"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave blank for current week
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  onClick={loadReport}
                  disabled={isLoading || !guildId}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Generate Report
                    </>
                  )}
                </Button>
                {report && (
                  <>
                    <Button
                      onClick={handleDownloadHTML}
                      variant="outline"
                      className="border-emerald-500/30 hover:bg-emerald-500/10"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download HTML
                    </Button>
                    <Button
                      onClick={handleSendToDiscord}
                      variant="outline"
                      disabled={isSending}
                      className="border-blue-500/30 hover:bg-blue-500/10"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send to Discord
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Callout variant="error" className="mb-6">
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </Callout>
          )}

          {/* Report Display */}
          {report && (
            <>
              {/* Summary Cards */}
              <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs">Total Members</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-neon-green">
                      {report.summary.totalMembers}
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs">Avg Power Delta</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-neon-green">
                      {report.summary.avgPowerDelta >= 0 ? "+" : ""}
                      {Math.round(report.summary.avgPowerDelta)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs">Total Analyses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-neon-green">
                      {report.summary.totalAnalyses}
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs">Avg Confidence</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-neon-green">
                      {(report.summary.avgConfidence * 100).toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Top Performers */}
              <div className="mb-6 grid gap-6 md:grid-cols-2">
                {/* Top Gainers */}
                <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40">
                  <CardHeader>
                    <CardTitle className="text-lg">🏆 Top Gainers</CardTitle>
                    <CardDescription>Highest power increase this week</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {report.summary.topGainers.length > 0 ? (
                      <div className="space-y-2">
                        {report.summary.topGainers.map((gainer, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-lg bg-zinc-800/50 p-3"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-emerald-500">
                                #{idx + 1}
                              </span>
                              <span className="text-sm">{gainer.memberKey}</span>
                            </div>
                            <span className="font-semibold text-neon-green">
                              +{Math.round(gainer.powerDelta)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No data available</p>
                    )}
                  </CardContent>
                </Card>

                {/* Top Tier Members */}
                <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40">
                  <CardHeader>
                    <CardTitle className="text-lg">⭐ Top Tier Members</CardTitle>
                    <CardDescription>Elite performers in Tier I & II</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {report.summary.topTierMembers.length > 0 ? (
                      <div className="space-y-2">
                        {report.summary.topTierMembers.map((member, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-lg bg-zinc-800/50 p-3"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-yellow-500">
                                #{idx + 1}
                              </span>
                              <span className="text-sm">{member.memberKey}</span>
                            </div>
                            <span className="font-semibold text-yellow-400">
                              {member.tier}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No data available</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* HTML Report Preview */}
              <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40">
                <CardHeader>
                  <CardTitle className="text-lg">Report Preview</CardTitle>
                  <CardDescription>
                    {formatDate(report.weekStart)} - {formatDate(report.weekEnd)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/*
                    NOTE: Using dangerouslySetInnerHTML here because the HTML is generated
                    by our trusted backend service, not from user input.
                    The report HTML is safe and contains only styling + data we control.
                  */}
                  <div
                    className="rounded-lg bg-white p-4"
                    dangerouslySetInnerHTML={{ __html: report.html }}
                  />
                </CardContent>
              </Card>
            </>
          )}

          {/* Loading State */}
          {isLoading && !report && (
            <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="mx-auto h-12 w-12 animate-spin text-emerald-500" />
                  <p className="mt-4 text-muted-foreground">Generating report...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Report State */}
          {!isLoading && !report && !error && (
            <Card className="rounded-2xl border border-emerald-500/30 bg-zinc-900/40">
              <CardContent className="py-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">
                  Click "Generate Report" to view your weekly club report
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
