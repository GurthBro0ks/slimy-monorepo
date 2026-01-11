"use client";

import { useEffect, useState } from "react";
import { useTrader } from "@/lib/trader/context";
import type { Decision } from "@/lib/trader/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

export default function TraderEdgesPage() {
  const { client, recordFetch } = useTrader();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const result = await client.getRecentDecisions(20);
      if (result.data) setDecisions(result.data);
      recordFetch(result.latencyMs, result.error);
      setLoading(false);
    }

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [client, recordFetch]);

  const getSignalIcon = (signal: Decision["signal"]) => {
    switch (signal) {
      case "long":
        return <ArrowUp className="w-5 h-5 text-green-400" />;
      case "short":
        return <ArrowDown className="w-5 h-5 text-red-400" />;
      case "flat":
        return <Minus className="w-5 h-5 text-gray-400" />;
    }
  };

  const getSignalColor = (signal: Decision["signal"]) => {
    switch (signal) {
      case "long":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      case "short":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      case "flat":
        return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return "text-green-400";
    if (confidence >= 0.5) return "text-amber-400";
    return "text-red-400";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-['VT323'] text-[var(--neon-green)] tracking-widest uppercase">
          Trading Edges
        </h1>
        <span className="text-xs font-mono text-gray-500">
          {decisions.length} recent decisions
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-black/50 border-gray-800">
              <CardContent className="p-4">
                <div className="animate-pulse space-y-3">
                  <div className="h-6 bg-gray-800 rounded w-1/2" />
                  <div className="h-4 bg-gray-800 rounded w-3/4" />
                  <div className="h-4 bg-gray-800 rounded w-1/4" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : decisions.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 font-mono py-12">
            No recent decisions
          </div>
        ) : (
          decisions.map((decision) => (
            <Card
              key={decision.id}
              className="bg-black/50 border-gray-800 hover:border-gray-700 transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getSignalIcon(decision.signal)}
                    <span className="font-['VT323'] text-xl text-white">
                      {decision.market}
                    </span>
                  </div>
                  <Badge className={`${getSignalColor(decision.signal)} uppercase`}>
                    {decision.signal}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-mono">Edge</span>
                    <span className="text-gray-300 font-mono capitalize">
                      {decision.edge.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-mono">Confidence</span>
                    <span
                      className={`font-mono font-bold ${getConfidenceColor(
                        decision.confidence
                      )}`}
                    >
                      {(decision.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-mono">Time</span>
                    <span className="text-gray-400 font-mono text-xs">
                      {new Date(decision.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {decision.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-800">
                    <p className="text-xs text-gray-500 font-mono">
                      {decision.notes}
                    </p>
                  </div>
                )}

                {decision.executed && (
                  <div className="mt-3">
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50 text-xs">
                      Executed
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
