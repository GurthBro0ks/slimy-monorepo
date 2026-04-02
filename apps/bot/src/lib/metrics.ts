/**
 * Metrics tracking system for commands and errors.
 * Ported from /opt/slimy/app/lib/metrics.js
 */

interface CommandStats {
  count: number;
  successCount: number;
  failCount: number;
  totalTime: number;
}

interface ErrorEntry {
  message: string;
  timestamp: string;
}

interface ErrorStats {
  count: number;
  lastSeen: string | null;
  messages: ErrorEntry[];
}

interface MetricsState {
  commands: Map<string, CommandStats>;
  errors: Map<string, ErrorStats>;
  startTime: number;
}

const state: MetricsState = {
  commands: new Map(),
  errors: new Map(),
  startTime: Date.now(),
};

export function trackCommand(commandName: string, duration: number, success = true): void {
  if (!state.commands.has(commandName)) {
    state.commands.set(commandName, {
      count: 0,
      successCount: 0,
      failCount: 0,
      totalTime: 0,
    });
  }

  const stats = state.commands.get(commandName)!;
  stats.count++;
  if (success) stats.successCount++;
  else stats.failCount++;
  stats.totalTime += duration;
}

export function trackError(type: string, message: string): void {
  if (!state.errors.has(type)) {
    state.errors.set(type, { count: 0, lastSeen: null, messages: [] });
  }

  const errorStats = state.errors.get(type)!;
  errorStats.count++;
  errorStats.lastSeen = new Date().toISOString();
  errorStats.messages.push({
    message,
    timestamp: new Date().toISOString(),
  });

  if (errorStats.messages.length > 10) {
    errorStats.messages.shift();
  }
}

interface MetricsOutput {
  uptime: number;
  commands: Record<string, unknown>;
  errors: Record<string, unknown>;
  summary: {
    totalCommands: number;
    totalErrors: number;
    successRate: string;
  };
}

export function getStats(): MetricsOutput {
  const stats: MetricsOutput = {
    uptime: Math.round((Date.now() - state.startTime) / 1000),
    commands: {},
    errors: {},
    summary: {
      totalCommands: 0,
      totalErrors: 0,
      successRate: "0%",
    },
  };

  let totalSuccess = 0;
  let totalFail = 0;

  for (const [cmd, data] of state.commands.entries()) {
    stats.commands[cmd] = {
      count: data.count,
      successCount: data.successCount,
      failCount: data.failCount,
      avgTime: `${Math.round(data.totalTime / data.count)}ms`,
      successRate: `${Math.round((data.successCount / data.count) * 100)}%`,
    };
    totalSuccess += data.successCount;
    totalFail += data.failCount;
  }

  for (const [type, data] of state.errors.entries()) {
    stats.errors[type] = {
      count: data.count,
      lastSeen: data.lastSeen,
      recentMessages: data.messages.slice(-3),
    };
  }

  stats.summary.totalCommands = totalSuccess + totalFail;
  stats.summary.totalErrors = totalFail;
  stats.summary.successRate =
    totalSuccess + totalFail > 0
      ? `${Math.round((totalSuccess / (totalSuccess + totalFail)) * 100)}%`
      : "100%";

  return stats;
}

export function reset(): void {
  state.commands.clear();
  state.errors.clear();
  state.startTime = Date.now();
}

export const metrics = {
  trackCommand,
  trackError,
  getStats,
  reset,
};

export default metrics;
