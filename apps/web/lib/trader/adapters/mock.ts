// Mock adapter for Trader UI - returns fixture data with simulated latency

import type { TraderClient, FetchResult } from "../types";
import {
  mockMarkets,
  mockFeeds,
  mockDecisions,
  mockRisk,
  mockLogs,
} from "../fixtures";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function wrapResult<T>(data: T, latencyMs: number): FetchResult<T> {
  return { data, error: null, latencyMs };
}

export function createMockAdapter(): TraderClient {
  return {
    async getHealth() {
      const start = Date.now();
      await delay(50 + Math.random() * 50);
      return wrapResult(
        {
          ok: true,
          timestamp: new Date().toISOString(),
          version: "mock-v1.0.0",
        },
        Date.now() - start
      );
    },

    async getActiveMarkets() {
      const start = Date.now();
      await delay(80 + Math.random() * 40);
      // Return markets with slightly randomized prices
      const markets = mockMarkets.map((m) => ({
        ...m,
        lastPrice: m.lastPrice * (1 + (Math.random() - 0.5) * 0.002),
        updatedAt: new Date().toISOString(),
      }));
      return wrapResult(markets, Date.now() - start);
    },

    async getFeedsStatus() {
      const start = Date.now();
      await delay(60 + Math.random() * 30);
      // Randomize some values
      const feeds = mockFeeds.map((f) => ({
        ...f,
        latencyMs: f.connected ? Math.floor(f.latencyMs * (0.8 + Math.random() * 0.4)) : 0,
        messagesPerSec: f.connected
          ? Math.floor(f.messagesPerSec * (0.9 + Math.random() * 0.2))
          : 0,
        lastMessage: f.connected ? new Date().toISOString() : f.lastMessage,
      }));
      return wrapResult(feeds, Date.now() - start);
    },

    async getRecentDecisions(limit = 20) {
      const start = Date.now();
      await delay(70 + Math.random() * 30);
      return wrapResult(mockDecisions.slice(0, limit), Date.now() - start);
    },

    async getRisk() {
      const start = Date.now();
      await delay(50 + Math.random() * 30);
      // Slightly randomize PnL values
      const risk = {
        ...mockRisk,
        unrealizedPnl: mockRisk.unrealizedPnl * (0.95 + Math.random() * 0.1),
        dailyPnl: mockRisk.dailyPnl * (0.95 + Math.random() * 0.1),
      };
      return wrapResult(risk, Date.now() - start);
    },

    async getLogsTail(limit = 50) {
      const start = Date.now();
      await delay(40 + Math.random() * 20);
      return wrapResult(mockLogs.slice(0, limit), Date.now() - start);
    },
  };
}
