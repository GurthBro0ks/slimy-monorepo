/**
 * PII Scrubber Utility
 * Ensures personally identifiable information is removed from public data.
 */

export interface RawStat {
  userId: string;
  userName: string;
  guildId: string;
  guildName: string;
  value: number;
  date: string;
}

export interface ScrubbedStat {
  guildId: string;
  guildName: string;
  value: number;
  date: string;
}

/**
 * Scrubs PII from a raw stat object.
 * @param rawStat The raw stat object.
 * @returns A scrubbed stat object.
 */
export function scrubStat(rawStat: RawStat): ScrubbedStat {
  return {
    guildId: rawStat.guildId,
    guildName: rawStat.guildName,
    value: rawStat.value,
    date: rawStat.date,
  };
}

/**
 * Scrubs PII from an array of raw stat objects.
 * @param rawStats The array of raw stat objects.
 * @returns An array of scrubbed stat objects.
 */
export function scrubStats(rawStats: RawStat[]): ScrubbedStat[] {
  return rawStats.map(scrubStat);
}

/**
 * Generates mock raw stats data for testing.
 */
export function getMockRawStats(guildId: string, guildName: string): RawStat[] {
  return [
    {
      userId: "user-123",
      userName: "JohnDoe#0001",
      guildId,
      guildName,
      value: 1500,
      date: "2024-10-20",
    },
    {
      userId: "user-456",
      userName: "JaneSmith#0002",
      guildId,
      guildName,
      value: 2000,
      date: "2024-10-21",
    },
  ];
}
