/**
 * Radar route handler - exposes opportunity radar snapshots over HTTP
 */

import type { Request, Response } from 'express';
import type { UserProfile, RiskLevel } from '../../../opps-core/src/index.js';
import { buildRadarSnapshot } from '../../../opps-runtime/src/index.js';

/**
 * Handler for GET /radar
 *
 * Query params:
 * - mode: "quick" | "daily" (optional, cosmetic for now)
 * - maxPerDomain: number (default 5)
 * - userId: string (optional, defaults to "anonymous")
 */
export async function radarHandler(req: Request, res: Response): Promise<void> {
  try {
    // Parse query parameters
    const mode = (req.query.mode as string) || 'quick';
    const maxPerDomain = req.query.maxPerDomain
      ? parseInt(req.query.maxPerDomain as string, 10)
      : 5;
    const userId = (req.query.userId as string) || 'anonymous';

    // Build a simple UserProfile with safe defaults
    const profile: UserProfile = {
      id: userId,
      maxRiskLevel: 'medium' as RiskLevel,
      maxCapitalPerOpportunity: null,
      maxTimePerOpportunityMinutes: 60,
      preferredDomains: [],
      excludedDomains: [],
      preferredTags: [],
      excludedTags: [],
    };

    // Build the radar snapshot
    const snapshot = await buildRadarSnapshot(profile, maxPerDomain);

    // Return successful response
    res.json({
      ok: true,
      mode,
      profile,
      snapshot,
    });
  } catch (error) {
    // Handle errors gracefully
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error building radar snapshot:', errorMessage);

    res.status(500).json({
      ok: false,
      error: errorMessage,
    });
  }
}
