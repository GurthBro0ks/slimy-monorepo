"use client";

import { useEffect, useState } from "react";
import { useTrader } from "@/lib/trader/context";
import type { Market } from "@/lib/trader/types";
import { Badge } from "@/components/ui/badge";

export default function TraderMarketsPage() {
  const { client, recordFetch } = useTrader();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const result = await client.getActiveMarkets();
      if (result.data) setMarkets(result.data);
      recordFetch(result.latencyMs, result.error);
      setLoading(false);
    }

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [client, recordFetch]);

  const getStatusColor = (status: Market["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      case "halted":
        return "bg-amber-500/20 text-amber-400 border-amber-500/50";
      case "closed":
        return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-['VT323'] text-[var(--neon-green)] tracking-widest uppercase">
          Markets
        </h1>
        <span className="text-xs font-mono text-gray-500">
          {markets.length} markets tracked
        </span>
      </div>

      <div className="bg-black/30 border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 text-xs font-mono text-gray-500 uppercase">
                <th className="text-left p-4">Symbol</th>
                <th className="text-left p-4">Exchange</th>
                <th className="text-center p-4">Status</th>
                <th className="text-right p-4">Price</th>
                <th className="text-right p-4">24h Change</th>
                <th className="text-right p-4">24h Volume</th>
                <th className="text-right p-4">Updated</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-800/50">
                    <td colSpan={7} className="p-4">
                      <div className="animate-pulse h-6 bg-gray-800 rounded" />
                    </td>
                  </tr>
                ))
              ) : markets.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-gray-500 font-mono"
                  >
                    No markets available
                  </td>
                </tr>
              ) : (
                markets.map((market) => (
                  <tr
                    key={market.id}
                    className="border-b border-gray-800/50 hover:bg-gray-900/30"
                  >
                    <td className="p-4">
                      <span className="font-['VT323'] text-lg text-white">
                        {market.symbol}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-sm text-gray-400 capitalize">
                        {market.exchange}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <Badge
                        className={`${getStatusColor(market.status)} uppercase text-xs`}
                      >
                        {market.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-mono text-white">
                        ${market.lastPrice.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span
                        className={`font-mono ${
                          market.change24h >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {market.change24h >= 0 ? "+" : ""}
                        {market.change24h.toFixed(2)}%
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-mono text-gray-400">
                        ${(market.volume24h / 1e6).toFixed(1)}M
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-mono text-xs text-gray-500">
                        {new Date(market.updatedAt).toLocaleTimeString()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
