/**
 * Date/Time Formatting Utilities for Web UI
 *
 * Policy: APIs return timestamps in UTC ISO 8601 format.
 * UI converts to user's local time for display using these helpers.
 *
 * Uses date-fns for consistent, locale-aware formatting.
 */

import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

/**
 * Parse an ISO string or Date into a Date object
 * @param value - ISO string, Date object, or timestamp
 * @returns Date object or null if invalid
 */
function parseDate(value: string | Date | number | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;

  try {
    // If it's a string, parse as ISO
    if (typeof value === 'string') {
      const date = parseISO(value);
      return isValid(date) ? date : null;
    }

    // If it's a number (timestamp), create Date
    if (typeof value === 'number') {
      const date = new Date(value);
      return isValid(date) ? date : null;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Format a date for display in the user's local time
 * Default format: "Nov 19, 2025 9:20 PM"
 * @param value - ISO string, Date, or timestamp
 * @param formatStr - date-fns format string (default: "MMM d, yyyy h:mm a")
 * @returns Formatted date string or fallback
 */
export function formatDateTime(
  value: string | Date | number | null | undefined,
  formatStr: string = 'MMM d, yyyy h:mm a'
): string {
  const date = parseDate(value);
  if (!date) return '—';

  try {
    return format(date, formatStr);
  } catch {
    return '—';
  }
}

/**
 * Format a date (without time) for display
 * Default format: "Nov 19, 2025"
 * @param value - ISO string, Date, or timestamp
 * @param formatStr - date-fns format string (default: "MMM d, yyyy")
 * @returns Formatted date string or fallback
 */
export function formatDate(
  value: string | Date | number | null | undefined,
  formatStr: string = 'MMM d, yyyy'
): string {
  const date = parseDate(value);
  if (!date) return '—';

  try {
    return format(date, formatStr);
  } catch {
    return '—';
  }
}

/**
 * Format a time (without date) for display
 * Default format: "9:20 PM"
 * @param value - ISO string, Date, or timestamp
 * @param formatStr - date-fns format string (default: "h:mm a")
 * @returns Formatted time string or fallback
 */
export function formatTime(
  value: string | Date | number | null | undefined,
  formatStr: string = 'h:mm a'
): string {
  const date = parseDate(value);
  if (!date) return '—';

  try {
    return format(date, formatStr);
  } catch {
    return '—';
  }
}

/**
 * Format a relative time (e.g., "3 minutes ago", "2 hours ago")
 * @param value - ISO string, Date, or timestamp
 * @param addSuffix - Include "ago" suffix (default: true)
 * @returns Formatted relative time string or fallback
 */
export function formatRelativeTime(
  value: string | Date | number | null | undefined,
  addSuffix: boolean = true
): string {
  const date = parseDate(value);
  if (!date) return '—';

  try {
    return formatDistanceToNow(date, { addSuffix });
  } catch {
    return '—';
  }
}

/**
 * Format a timestamp with date and time in a compact format
 * Format: "11/19/25, 9:20 PM"
 * @param value - ISO string, Date, or timestamp
 * @returns Formatted timestamp or fallback
 */
export function formatTimestampCompact(
  value: string | Date | number | null | undefined
): string {
  const date = parseDate(value);
  if (!date) return '—';

  try {
    return format(date, 'MM/dd/yy, h:mm a');
  } catch {
    return '—';
  }
}

/**
 * Format a timestamp with full date, time, and timezone
 * Format: "Nov 19, 2025 9:20:15 PM PST"
 * @param value - ISO string, Date, or timestamp
 * @returns Formatted timestamp with timezone or fallback
 */
export function formatTimestampFull(
  value: string | Date | number | null | undefined
): string {
  const date = parseDate(value);
  if (!date) return '—';

  try {
    // Use native toLocaleString for timezone abbreviation
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });
  } catch {
    return '—';
  }
}

/**
 * Format a date for ISO display (useful for debugging/exports)
 * Returns the original ISO string
 * @param value - ISO string, Date, or timestamp
 * @returns ISO 8601 string or fallback
 */
export function formatISO(
  value: string | Date | number | null | undefined
): string {
  const date = parseDate(value);
  if (!date) return '—';

  try {
    return date.toISOString();
  } catch {
    return '—';
  }
}

/**
 * Get a date slug for URLs or file names (YYYY-MM-DD)
 * Uses local date for user-facing slugs
 * @param value - ISO string, Date, or timestamp
 * @returns Date slug or null
 */
export function getDateSlug(
  value: string | Date | number | null | undefined
): string | null {
  const date = parseDate(value);
  if (!date) return null;

  try {
    return format(date, 'yyyy-MM-dd');
  } catch {
    return null;
  }
}

/**
 * Format examples for documentation:
 *
 * formatDateTime("2025-11-19T21:20:15.000Z")         → "Nov 19, 2025 9:20 PM" (in PST)
 * formatDate("2025-11-19T21:20:15.000Z")             → "Nov 19, 2025"
 * formatTime("2025-11-19T21:20:15.000Z")             → "9:20 PM"
 * formatRelativeTime("2025-11-19T21:20:15.000Z")     → "3 minutes ago"
 * formatTimestampCompact("2025-11-19T21:20:15.000Z") → "11/19/25, 9:20 PM"
 * formatTimestampFull("2025-11-19T21:20:15.000Z")    → "Nov 19, 2025 9:20:15 PM PST"
 * formatISO("2025-11-19T21:20:15.000Z")              → "2025-11-19T21:20:15.000Z"
 * getDateSlug("2025-11-19T21:20:15.000Z")            → "2025-11-19"
 */
