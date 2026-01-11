"use client";

import { useEffect, useState } from "react";
import { useTrader } from "@/lib/trader/context";
import type { HealthResponse, Market, RiskMetrics, FeedStatus } from "@/lib/trader/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Activity, TrendingUp, Shield, Wifi } from "lucide-react";

export default function TraderOverviewPage() {
  const { client, recordFetch } = useTrader();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [risk, setRisk] = useState<RiskMetrics | null>(null);
  const [feeds, setFeeds] = useState<FeedStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [healthRes, marketsRes, riskRes, feedsRes] = await Promise.all([
        client.getHealth(),
        client.getActiveMarkets(),
        client.getRisk(),
        client.getFeedsStatus(),
      ]);

      if (healthRes.data) setHealth(healthRes.data);
      if (marketsRes.data) setMarkets(marketsRes.data);
      if (riskRes.data) setRisk(riskRes.data);
      if (feedsRes.data) setFeeds(feedsRes.data);

      // Record the slowest fetch
      const maxLatency = Math.max(
        healthRes.latencyMs,
        marketsRes.latencyMs,
        riskRes.latencyMs,
        feedsRes.latencyMs
      );
      recordFetch(maxLatency, healthRes.error || marketsRes.error || riskRes.error || feedsRes.error);
      setLoading(false);
    }

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [client, recordFetch]);

  const activeMarkets = markets.filter((m) => m.status === "active").length;
  const connectedFeeds = feeds.filter((f) => f.connected).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-['VT323'] text-[var(--neon-green)] tracking-widest uppercase">
          Overview
        </h1>
        {health && (
          <span className="text-xs font-mono text-gray-500">
            v{health.version}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* System Status */}
        <Card className="bg-black/50 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono text-gray-400 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              System
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse h-8 bg-gray-800 rounded" />
            ) : (
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    health?.ok ? "bg-green-500 animate-pulse" : "bg-red-500"
                  }`}
                />
                <span className="text-2xl font-['VT323'] text-white">
                  {health?.ok ? "ONLINE" : "OFFLINE"}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Markets */}
        <Card className="bg-black/50 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono text-gray-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Markets
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse h-8 bg-gray-800 rounded" />
            ) : (
              <div>
                <span className="text-2xl font-['VT323'] text-[var(--neon-green)]">
                  {activeMarkets}
                </span>
                <span className="text-sm text-gray-500 ml-2">
                  / {markets.length} active
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Connected Feeds */}
        <Card className="bg-black/50 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono text-gray-400 flex items-center gap-2">
              <Wifi className="w-4 h-4" />
              Feeds
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse h-8 bg-gray-800 rounded" />
            ) : (
              <div>
                <span className="text-2xl font-['VT323'] text-[var(--neon-green)]">
                  {connectedFeeds}
                </span>
                <span className="text-sm text-gray-500 ml-2">
                  / {feeds.length} connected
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Risk Summary */}
        <Card className="bg-black/50 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-mono text-gray-400 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse h-8 bg-gray-800 rounded" />
            ) : (
              <div>
                <span className="text-2xl font-['VT323'] text-white">
                  {risk?.positionCount || 0}
                </span>
                <span className="text-sm text-gray-500 ml-2">open</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Risk Metrics Row */}
      {risk && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-black/30 border border-gray-800 rounded p-4">
            <div className="text-xs font-mono text-gray-500 uppercase">
              Total Exposure
            </div>
            <div className="text-xl font-['VT323'] text-white mt-1">
              ${risk.totalExposure.toLocaleString()}
            </div>
          </div>
          <div className="bg-black/30 border border-gray-800 rounded p-4">
            <div className="text-xs font-mono text-gray-500 uppercase">
              Unrealized P&L
            </div>
            <div
              className={`text-xl font-['VT323'] mt-1 ${
                risk.unrealizedPnl >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {risk.unrealizedPnl >= 0 ? "+" : ""}$
              {risk.unrealizedPnl.toFixed(2)}
            </div>
          </div>
          <div className="bg-black/30 border border-gray-800 rounded p-4">
            <div className="text-xs font-mono text-gray-500 uppercase">
              Daily P&L
            </div>
            <div
              className={`text-xl font-['VT323'] mt-1 ${
                risk.dailyPnl >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {risk.dailyPnl >= 0 ? "+" : ""}${risk.dailyPnl.toFixed(2)}
            </div>
          </div>
          <div className="bg-black/30 border border-gray-800 rounded p-4">
            <div className="text-xs font-mono text-gray-500 uppercase">
              Max Drawdown
            </div>
            <div className="text-xl font-['VT323'] text-amber-400 mt-1">
              {(risk.maxDrawdown * 100).toFixed(2)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
