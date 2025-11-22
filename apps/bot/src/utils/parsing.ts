/**
 * Parse a numeric string with common Discord formatting (commas, k/m suffix).
 * Used for parsing user-submitted numbers like "1.5k" or "1,500".
 */
export function parseNumber(input: string): number | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const cleaned = input.trim().toLowerCase().replace(/,/g, '');

  // Handle k/m suffix
  const multiplier = cleaned.endsWith('k')
    ? 1000
    : cleaned.endsWith('m')
    ? 1000000
    : 1;

  const numStr = multiplier > 1 ? cleaned.slice(0, -1) : cleaned;
  const parsed = parseFloat(numStr);

  if (isNaN(parsed)) {
    return null;
  }

  return parsed * multiplier;
}

/**
 * Validate that a Discord snowflake ID looks reasonable.
 */
export function isValidSnowflake(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false;
  }

  // Snowflakes are 17-19 digit numbers
  return /^\d{17,19}$/.test(id);
}

/**
 * Extract mentions from a Discord message content.
 * Returns array of user IDs mentioned.
 */
export function extractMentions(content: string): string[] {
  if (!content || typeof content !== 'string') {
    return [];
  }

  const mentionRegex = /<@!?(\d{17,19})>/g;
  const matches = content.matchAll(mentionRegex);

  return Array.from(matches, m => m[1]);
}
