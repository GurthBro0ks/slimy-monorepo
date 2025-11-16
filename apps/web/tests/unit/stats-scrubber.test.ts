import { describe, it, expect } from "vitest";
import { scrubStats, getMockRawStats } from "@/lib/stats-scrubber";

describe("PII Scrubber", () => {
  it("should remove userId and userName from raw stats", () => {
    const guildId = "test-guild-1";
    const guildName = "Test Guild";
    const rawStats = getMockRawStats(guildId, guildName);
    const scrubbedStats = scrubStats(rawStats);

    expect(scrubbedStats).toHaveLength(2);

    // Check first scrubbed stat
    expect(scrubbedStats[0]).not.toHaveProperty("userId");
    expect(scrubbedStats[0]).not.toHaveProperty("userName");
    expect(scrubbedStats[0]).toHaveProperty("guildId", guildId);
    expect(scrubbedStats[0]).toHaveProperty("guildName", guildName);
    expect(scrubbedStats[0]).toHaveProperty("value", 1500);

    // Check second scrubbed stat
    expect(scrubbedStats[1]).not.toHaveProperty("userId");
    expect(scrubbedStats[1]).not.toHaveProperty("userName");
    expect(scrubbedStats[1]).toHaveProperty("guildId", guildId);
    expect(scrubbedStats[1]).toHaveProperty("guildName", guildName);
    expect(scrubbedStats[1]).toHaveProperty("value", 2000);
  });
});
