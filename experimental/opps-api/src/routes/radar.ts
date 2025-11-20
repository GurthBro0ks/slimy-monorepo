/**
 * Radar snapshot endpoint handler
 */

import type { Request, Response } from 'express';
import { buildRadarSnapshot } from '../../opps-runtime/src/index.js';
import type { UserProfile } from '../../opps-core/src/index.js';

/**
 * GET /radar handler
 *
 * Query params:
 * - mode: "quick" | "daily" (optional, mostly cosmetic for now)
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

    // Build UserProfile with safe defaults
    const profile: UserProfile = {
      id: userId,
      maxRiskLevel: 'medium',
      maxCapitalPerOpportunity: null,
      maxTimePerOpportunityMinutes: 60,
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
    // Handle errors
    console.error('Error building radar snapshot:', error);
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
}
