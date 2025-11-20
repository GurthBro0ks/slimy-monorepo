/**
 * Mock API for slime.craft server status
 * Provides typed interfaces and data access for server monitoring
 */

import sampleData from '../data/sample-status.json' assert { type: 'json' };

// ============================================================================
// Type Definitions
// ============================================================================

export interface Player {
  name: string;
  uuid: string;
}

export interface PlayerStats {
  online: number;
  max: number;
  list?: Player[];
}

export interface TPSMetrics {
  current: number;
  oneMinute: number;
  fiveMinutes: number;
  fifteenMinutes: number;
}

export interface MemoryStats {
  used: number;
  allocated: number;
  max: number;
  unit: string;
}

export interface UptimeInfo {
  seconds: number;
  formatted: string;
}

export interface JavaServerStatus {
  status: 'online' | 'offline' | 'starting' | 'stopping';
  host: string;
  port: number;
  version: string;
  protocol: number;
  players: PlayerStats;
  motd: string;
  favicon?: string;
  tps: TPSMetrics;
  uptime: UptimeInfo;
  memory: MemoryStats;
}

export interface BedrockServerStatus {
  status: 'online' | 'offline' | 'starting' | 'stopping';
  host: string;
  port: number;
  version: string;
  protocol: number;
  players: PlayerStats;
  motd: string;
  gamemode: string;
  uptime: UptimeInfo;
}

export interface MapWorld {
  name: string;
  displayName: string;
  lastUpdate: string;
  renderProgress: number;
  players: number;
}

export interface MapStatus {
  service: 'squaremap' | 'dynmap' | 'bluemap';
  url: string;
  lastRender: string;
  worlds: MapWorld[];
}

export interface CPUStats {
  usage: number;
  cores: number;
}

export interface DiskStats {
  used: number;
  total: number;
  unit: string;
}

export interface PerformanceMetrics {
  overall: 'healthy' | 'degraded' | 'critical';
  warnings: string[];
  cpu: CPUStats;
  disk: DiskStats;
}

export interface ServerStatus {
  timestamp: string;
  servers: {
    java: JavaServerStatus;
    bedrock: BedrockServerStatus;
  };
  map: MapStatus;
  performance: PerformanceMetrics;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get the full mock server status
 * In production, this would make network calls to actual server endpoints
 */
export function getMockStatus(): ServerStatus {
  return sampleData as ServerStatus;
}

/**
 * Get only Java server status
 */
export function getMockJavaStatus(): JavaServerStatus {
  return sampleData.servers.java as JavaServerStatus;
}

/**
 * Get only Bedrock server status
 */
export function getMockBedrockStatus(): BedrockServerStatus {
  return sampleData.servers.bedrock as BedrockServerStatus;
}

/**
 * Get only map status
 */
export function getMockMapStatus(): MapStatus {
  return sampleData.map as MapStatus;
}

/**
 * Get performance metrics
 */
export function getMockPerformanceMetrics(): PerformanceMetrics {
  return sampleData.performance as PerformanceMetrics;
}

/**
 * Simulate a network delay (for testing)
 */
export async function getMockStatusAsync(delayMs: number = 500): Promise<ServerStatus> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getMockStatus());
    }, delayMs);
  });
}

/**
 * Helper to format uptime in a human-readable way
 */
export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);

  return parts.join(', ') || '0 minutes';
}

/**
 * Helper to get status color/badge
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'online':
      return '#22c55e'; // green
    case 'offline':
      return '#ef4444'; // red
    case 'starting':
    case 'stopping':
      return '#f59e0b'; // yellow
    default:
      return '#6b7280'; // gray
  }
}

/**
 * Helper to get TPS health status
 */
export function getTPSHealth(tps: number): 'healthy' | 'degraded' | 'critical' {
  if (tps >= 19.5) return 'healthy';
  if (tps >= 18.0) return 'degraded';
  return 'critical';
}

// Export default status getter
export default getMockStatus;
