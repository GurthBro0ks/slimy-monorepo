/**
 * Snail Events Utility
 * Logic for reading and parsing file-backed snail event data.
 */

import { readFileSync } from "fs";
import { join } from "path";

export interface SnailEvent {
  id: string;
  timestamp: string;
  type: string;
  title: string;
  details: string;
}

const EVENTS_FILE = join(process.cwd(), "data/snail-events.json");
const MAX_EVENTS = 50;

/**
 * Fetches and sorts the latest snail events.
 */
export function getLatestSnailEvents(): SnailEvent[] {
  try {
    const content = readFileSync(EVENTS_FILE, "utf-8");
    const events: SnailEvent[] = JSON.parse(content);

    // Sort by timestamp (newest first)
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Limit to MAX_EVENTS
    return events.slice(0, MAX_EVENTS);
  } catch (error) {
    console.error("Failed to read snail events file:", error);
    return [];
  }
}
