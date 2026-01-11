"use client";

import { useEffect, useState } from "react";
import { useTrader } from "@/lib/trader/context";
import type { RiskMetrics } from "@/lib/trader/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  DollarSign,
  TrendingDown,
  BarChart3,
  Layers,
  TrendingUp,
  Calendar,
} from "lucide-react";

export default function TraderRiskPage() {
  const { client, recordFetch } = useTrader();
  const [risk, setRisk] = useState<RiskMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const result = await client.getRisk();
      if (result.data) setRisk(result.data);
      recordFetch(result.latencyMs, result.error);
      setLoading(false);
    }

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [client, recordFetch]);

  const MetricCard = ({
    title,
    value,
    icon: Icon,
    color = "text-white",
    subtitle,
  }: {
    title: string;
    value: string;
    icon: React.ElementType;
    color?: string;
    subtitle?: string;
  }) => (
    <Card className="bg-black/50 border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-mono text-gray-400 flex items-center gap-2">
          <Icon className="w-4 h-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="animate-pulse h-10 bg-gray-800 rounded" />
        ) : (
          <div>
            <span className={`text-3xl font-['VT323'] ${color}`}>{value}</span>
            {subtitle && (
              <p className="text-xs text-gray-500 font-mono mt-1">{subtitle}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-['VT323'] text-[var(--neon-green)] tracking-widest uppercase">
        Risk Management
      </h1>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Total Exposure"
          value={risk ? `$${risk.totalExposure.toLocaleString()}` : "$0"}
          icon={DollarSign}
          color="text-white"
          subtitle="Current capital at risk"
        />
        <MetricCard
          title="Open Positions"
          value={risk ? `${risk.positionCount}` : "0"}
          icon={Layers}
          color="text-[var(--neon-green)]"
          subtitle="Active market positions"
        />
        <MetricCard
          title="Sharpe Ratio"
          value={risk ? risk.sharpeRatio.toFixed(2) : "0.00"}
          icon={BarChart3}
          color={
            risk && risk.sharpeRatio >= 1
              ? "text-green-400"
              : risk && risk.sharpeRatio >= 0.5
              ? "text-amber-400"
              : "text-red-400"
          }
          subtitle="Risk-adjusted returns"
        />
      </div>

      {/* P&L Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Unrealized P&L"
          value={
            risk
              ? `${risk.unrealizedPnl >= 0 ? "+" : ""}$${risk.unrealizedPnl.toFixed(2)}`
              : "$0.00"
          }
          icon={TrendingUp}
          color={risk && risk.unrealizedPnl >= 0 ? "text-green-400" : "text-red-400"}
          subtitle="Open position gains/losses"
        />
        <MetricCard
          title="Daily P&L"
          value={
            risk
              ? `${risk.dailyPnl >= 0 ? "+" : ""}$${risk.dailyPnl.toFixed(2)}`
              : "$0.00"
          }
          icon={Calendar}
          color={risk && risk.dailyPnl >= 0 ? "text-green-400" : "text-red-400"}
          subtitle="Today's performance"
        />
        <MetricCard
          title="Weekly P&L"
          value={
            risk
              ? `${risk.weeklyPnl >= 0 ? "+" : ""}$${risk.weeklyPnl.toFixed(2)}`
              : "$0.00"
          }
          icon={Calendar}
          color={risk && risk.weeklyPnl >= 0 ? "text-green-400" : "text-red-400"}
          subtitle="7-day performance"
        />
      </div>

      {/* Drawdown Section */}
      <Card className="bg-black/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-sm font-mono text-gray-400 flex items-center gap-2">
            <TrendingDown className="w-4 h-4" />
            Max Drawdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse h-16 bg-gray-800 rounded" />
          ) : (
            <div className="space-y-4">
              <div className="flex items-end gap-4">
                <span className="text-5xl font-['VT323'] text-amber-400">
                  {risk ? (risk.maxDrawdown * 100).toFixed(2) : "0.00"}%
                </span>
                <span className="text-gray-500 font-mono text-sm pb-2">
                  from peak
                </span>
              </div>

              {/* Visual drawdown bar */}
              <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-500"
                  style={{ width: `${Math.min((risk?.maxDrawdown || 0) * 100 * 5, 100)}%` }}
                />
              </div>

              <div className="flex justify-between text-xs font-mono text-gray-500">
                <span>0%</span>
                <span>5%</span>
                <span>10%</span>
                <span>15%</span>
                <span>20%</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Risk Warning */}
      <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <TrendingDown className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-['VT323'] text-amber-400 text-lg uppercase">
              Shadow Mode Active
            </h3>
            <p className="text-sm text-amber-300/70 font-mono mt-1">
              Risk metrics are for observation only. No live trading is enabled
              in shadow mode.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
