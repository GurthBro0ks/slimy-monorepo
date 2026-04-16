/**
 * Club QA corrections — admin overrides for bad OCR.
 * Ported from /opt/slimy/app/lib/club-corrections.js
 * Stub implementation.
 */

import { database } from './database.js';

interface AddCorrectionOpts {
  guildId: string;
  weekId: string;
  memberKey: string;
  displayName: string;
  metric: 'total' | 'sim';
  value: string | number;
  reason?: string;
  source?: string;
  createdBy?: string;
}

export async function addCorrection(opts: AddCorrectionOpts): Promise<{ id: number; replaced: boolean }> {
  if (!database.isConfigured()) {
    throw new Error("Database not configured for club corrections.");
  }

  console.warn("[club-corrections] addCorrection stub called:", opts);
  // In a full implementation, this would write to club_corrections table
  return { id: 0, replaced: false };
}

export async function getCorrections(_guildId: string, _weekId: string): Promise<unknown[]> {
  if (!database.isConfigured()) return [];
  console.warn("[club-corrections] getCorrections stub called");
  return [];
}
