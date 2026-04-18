import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetClubLeaderboard } = vi.hoisted(() => ({
  mockGetClubLeaderboard: vi.fn(),
}));

vi.mock("../src/lib/database.js", () => ({
  database: { getClubLeaderboard: mockGetClubLeaderboard },
}));

import cmd from "../src/commands/leaderboard.js";

function createInteraction(overrides: Record<string, unknown> = {}) {
  return {
    deferReply: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
    reply: vi.fn().mockResolvedValue(undefined),
    options: { getInteger: vi.fn().mockReturnValue(null) },
    guildId: "1176605506912141444",
    guild: { name: "TestGuild" },
    ...overrides,
  };
}

function makeLeaderboardData() {
  return {
    topSim: [
      { name_display: "LeUncSYT", sim_power: 23900760 },
      { name_display: "BR3W3R", sim_power: 15632071 },
      { name_display: "Stone", sim_power: 15439779 },
    ],
    topTotal: [
      { name_display: "LeUncSYT", total_power: 621097073 },
      { name_display: "BR3W3R", total_power: 506911285 },
      { name_display: "Traveler12521", total_power: 503771693 },
    ],
    memberCount: 69,
    latestAt: "2026-04-17 16:10:57",
  };
}

describe("leaderboard command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects DM usage (no guild)", async () => {
    const interaction = createInteraction({ guildId: null });
    await cmd.execute(interaction);

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining("only be used in a server"),
      }),
    );
  });

  it("shows club leaderboard with SIM and Total sections", async () => {
    mockGetClubLeaderboard.mockResolvedValue(makeLeaderboardData());

    const interaction = createInteraction();
    await cmd.execute(interaction);

    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(call.embeds).toBeDefined();
    const embed = call.embeds[0];
    const fields = embed.data.fields;
    expect(fields).toHaveLength(2);
    expect(fields[0].name).toBe("Top SIM Power");
    expect(fields[0].value).toContain("LeUncSYT");
    expect(fields[0].value).toContain("23.9M");
    expect(fields[1].name).toBe("Top Total Power");
    expect(fields[1].value).toContain("621.1M");
  });

  it("shows empty message when no club data", async () => {
    mockGetClubLeaderboard.mockResolvedValue({
      topSim: [],
      topTotal: [],
      memberCount: 0,
      latestAt: null,
    });

    const interaction = createInteraction();
    await cmd.execute(interaction);

    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(call.content).toContain("No club data");
  });

  it("passes custom limit option", async () => {
    mockGetClubLeaderboard.mockResolvedValue({
      topSim: [],
      topTotal: [],
      memberCount: 0,
      latestAt: null,
    });

    const interaction = createInteraction({
      options: { getInteger: vi.fn().mockReturnValue(25) },
    });
    await cmd.execute(interaction);

    expect(mockGetClubLeaderboard).toHaveBeenCalledWith(
      "1176605506912141444",
      25,
    );
  });

  it("handles API error gracefully", async () => {
    mockGetClubLeaderboard.mockRejectedValue(new Error("ECONNREFUSED"));

    const interaction = createInteraction();
    await cmd.execute(interaction);

    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(call.content).toContain("Failed to fetch leaderboard");
  });

  it("abbreviates power values correctly", async () => {
    mockGetClubLeaderboard.mockResolvedValue({
      topSim: [
        { name_display: "Big", sim_power: 1_234_567_890 },
        { name_display: "Mid", sim_power: 15_000_000 },
        { name_display: "Small", sim_power: 999 },
      ],
      topTotal: [
        { name_display: "Big", total_power: 1_234_567_890 },
      ],
      memberCount: 3,
      latestAt: null,
    });

    const interaction = createInteraction();
    await cmd.execute(interaction);

    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    const simField = call.embeds[0].data.fields[0].value;
    expect(simField).toContain("1.23B");
    expect(simField).toContain("15.0M");
    expect(simField).toContain("999");
  });

  it("footer shows member count and update timestamp", async () => {
    mockGetClubLeaderboard.mockResolvedValue(makeLeaderboardData());

    const interaction = createInteraction();
    await cmd.execute(interaction);

    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    const footerText = call.embeds[0].data.footer.text;
    expect(footerText).toContain("69 members total");
    expect(footerText).toContain("Updated:");
  });

  it("footer shows member count without timestamp when null", async () => {
    mockGetClubLeaderboard.mockResolvedValue({
      topSim: [{ name_display: "Solo", sim_power: 1000 }],
      topTotal: [{ name_display: "Solo", total_power: 5000 }],
      memberCount: 1,
      latestAt: null,
    });

    const interaction = createInteraction();
    await cmd.execute(interaction);

    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    const footerText = call.embeds[0].data.footer.text;
    expect(footerText).toBe("1 members total");
  });
});
