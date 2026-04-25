import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockListTroopsSorted } = vi.hoisted(() => ({
  mockListTroopsSorted: vi.fn(),
}));

vi.mock('../src/lib/sim-wars-troop-store.js', () => ({
  listTroopsSorted: mockListTroopsSorted,
  buildTroopCsv: (rows: Array<Record<string, unknown>>) => {
    const headers = [
      'player_name', 'troop_power', 'troop_hp', 'troop_attack', 'troop_defense',
      'troop_rush', 'troop_leadership_current', 'troop_leadership_max',
      'troop_crit_dmg_reduc_pct', 'troop_fire_dmg', 'troop_water_dmg',
      'troop_earth_dmg', 'troop_wind_dmg', 'troop_poison_dmg', 'latest_at',
    ];
    const lines: string[] = [headers.join(',')];
    for (const row of rows) {
      const vals = headers.map(h => {
        const v = row[h];
        if (v === null || v === undefined) return '';
        const s = String(v);
        return s.includes(',') || s.includes('"') || s.includes('\n')
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      });
      lines.push(vals.join(','));
    }
    return lines.join('\n');
  },
}));

import cmd from '../src/commands/war-push.js';

function makeRows(): Array<Record<string, unknown>> {
  return [
    { player_name: 'DoctorDave', troop_power: 208227068, troop_hp: 1000000, troop_attack: 500000, troop_defense: 400000, troop_rush: 300000, troop_leadership_current: 790, troop_leadership_max: 790, troop_crit_dmg_reduc_pct: 10.00, troop_fire_dmg: 6000000, troop_water_dmg: 5000000, troop_earth_dmg: 4000000, troop_wind_dmg: 3000000, troop_poison_dmg: 2000000, latest_at: '2026-04-25T02:16:25.000Z' },
    { player_name: 'Stone', troop_power: 15439779, troop_hp: 800000, troop_attack: 450000, troop_defense: 350000, troop_rush: 250000, troop_leadership_current: 1979, troop_leadership_max: 1979, troop_crit_dmg_reduc_pct: 20.80, troop_fire_dmg: 5500000, troop_water_dmg: 4500000, troop_earth_dmg: 3500000, troop_wind_dmg: 2500000, troop_poison_dmg: 1500000, latest_at: '2026-04-25T01:53:54.000Z' },
    { player_name: 'RapidJiggle', troop_power: 10000000, troop_hp: 600000, troop_attack: 300000, troop_defense: 200000, troop_rush: 150000, troop_leadership_current: 500, troop_leadership_max: 500, troop_crit_dmg_reduc_pct: 15.50, troop_fire_dmg: 4000000, troop_water_dmg: 3000000, troop_earth_dmg: 2000000, troop_wind_dmg: 1000000, troop_poison_dmg: 500000, latest_at: '2026-04-25T01:00:00.000Z' },
  ];
}

function createInteraction(overrides: Record<string, unknown> = {}) {
  return {
    deferReply: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
    reply: vi.fn().mockResolvedValue(undefined),
    options: {
      getString: vi.fn().mockReturnValue(null),
      getInteger: vi.fn().mockReturnValue(null),
      getBoolean: vi.fn().mockReturnValue(null),
    },
    guildId: '1176605506912141444',
    ...overrides,
  };
}

describe('war-push command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects DM usage (no guild)', async () => {
    const interaction = createInteraction({ guildId: null });
    await cmd.execute(interaction);

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('only be used in a server'),
      }),
    );
  });

  it('shows empty message when no troop data', async () => {
    mockListTroopsSorted.mockResolvedValue([]);

    const interaction = createInteraction();
    await cmd.execute(interaction);

    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.content).toContain('No Sim Wars troop data');
  });

  it('returns embed with players sorted by power descending', async () => {
    mockListTroopsSorted.mockResolvedValue(makeRows());

    const interaction = createInteraction();
    await cmd.execute(interaction);

    expect(mockListTroopsSorted).toHaveBeenCalledWith(
      '1176605506912141444',
      'power',
      undefined,
    );

    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.embeds).toBeDefined();
    const embedData = call.embeds[0].data;
    expect(embedData.title).toBe('Sim Wars Troop Sheet');
    expect(embedData.description).toContain('**3** scanned players');
    expect(embedData.description).toContain('Sorted by **Power**');
    expect(embedData.description).toContain('CSV attached');
  });

  it('sorts by attack when sort option is attack', async () => {
    mockListTroopsSorted.mockResolvedValue(makeRows());

    const interaction = createInteraction({
      options: {
        getString: vi.fn().mockReturnValue('attack'),
        getInteger: vi.fn().mockReturnValue(null),
        getBoolean: vi.fn().mockReturnValue(null),
      },
    });
    await cmd.execute(interaction);

    expect(mockListTroopsSorted).toHaveBeenCalledWith(
      '1176605506912141444',
      'attack',
      undefined,
    );
  });

  it('sorts by leadership when sort option is leadership', async () => {
    mockListTroopsSorted.mockResolvedValue(makeRows());

    const interaction = createInteraction({
      options: {
        getString: vi.fn().mockReturnValue('leadership'),
        getInteger: vi.fn().mockReturnValue(null),
        getBoolean: vi.fn().mockReturnValue(null),
      },
    });
    await cmd.execute(interaction);

    expect(mockListTroopsSorted).toHaveBeenCalledWith(
      '1176605506912141444',
      'leadership',
      undefined,
    );
  });

  it('passes limit option to store', async () => {
    mockListTroopsSorted.mockResolvedValue(makeRows());

    const interaction = createInteraction({
      options: {
        getString: vi.fn().mockReturnValue(null),
        getInteger: vi.fn().mockReturnValue(10),
        getBoolean: vi.fn().mockReturnValue(null),
      },
    });
    await cmd.execute(interaction);

    expect(mockListTroopsSorted).toHaveBeenCalledWith(
      '1176605506912141444',
      'power',
      10,
    );
  });

  it('attaches CSV file with exact raw values', async () => {
    const rows = makeRows();
    mockListTroopsSorted.mockResolvedValue(rows);

    const interaction = createInteraction();
    await cmd.execute(interaction);

    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.files).toBeDefined();
    expect(call.files).toHaveLength(1);
    const file = call.files[0];
    expect(file.name).toContain('sim-wars-war-sheet');
    expect(file.name).toContain('.csv');

    const csvContent = file.attachment.toString('utf-8');
    expect(csvContent).toContain('player_name,troop_power');
    expect(csvContent).toContain('DoctorDave,208227068');
    expect(csvContent).toContain('Stone,15439779');
    expect(csvContent).toContain('20.8');
    expect(csvContent).toContain('1979');
  });

  it('CSV escapes player names with commas or quotes', async () => {
    const rows: Array<Record<string, unknown>> = [
      { player_name: 'Dave "The Rock" Johnson', troop_power: 100, troop_hp: 200, troop_attack: 300, troop_defense: 400, troop_rush: 500, troop_leadership_current: 100, troop_leadership_max: 100, troop_crit_dmg_reduc_pct: 10.00, troop_fire_dmg: 1000, troop_water_dmg: 2000, troop_earth_dmg: 3000, troop_wind_dmg: 4000, troop_poison_dmg: 5000, latest_at: '2026-04-25T01:00:00.000Z' },
      { player_name: 'Jane, Smith', troop_power: 200, troop_hp: 300, troop_attack: 400, troop_defense: 500, troop_rush: 600, troop_leadership_current: 200, troop_leadership_max: 200, troop_crit_dmg_reduc_pct: 15.00, troop_fire_dmg: 2000, troop_water_dmg: 3000, troop_earth_dmg: 4000, troop_wind_dmg: 5000, troop_poison_dmg: 6000, latest_at: '2026-04-25T01:00:00.000Z' },
    ];
    mockListTroopsSorted.mockResolvedValue(rows);

    const interaction = createInteraction();
    await cmd.execute(interaction);

    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const csvContent = call.files[0].attachment.toString('utf-8');

    expect(csvContent).toContain('"Dave ""The Rock"" Johnson"');
    expect(csvContent).toContain('"Jane, Smith"');
  });

  it('defers ephemeral by default', async () => {
    mockListTroopsSorted.mockResolvedValue(makeRows());

    const interaction = createInteraction();
    await cmd.execute(interaction);

    expect(interaction.deferReply).toHaveBeenCalledWith(
      expect.objectContaining({ flags: expect.any(Number) }),
    );
  });

  it('defers without ephemeral when public is true', async () => {
    mockListTroopsSorted.mockResolvedValue(makeRows());

    const interaction = createInteraction({
      options: {
        getString: vi.fn().mockReturnValue(null),
        getInteger: vi.fn().mockReturnValue(null),
        getBoolean: vi.fn().mockReturnValue(true),
      },
    });
    await cmd.execute(interaction);

    expect(interaction.deferReply).toHaveBeenCalledWith(
      expect.objectContaining({ flags: undefined }),
    );
  });

  it('handles database error gracefully', async () => {
    mockListTroopsSorted.mockRejectedValue(new Error('DB down'));

    const interaction = createInteraction();
    await cmd.execute(interaction);

    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.content).toContain('Failed to export war sheet');
  });

  it('includes all 13 stat columns plus player_name and latest_at in CSV header', async () => {
    mockListTroopsSorted.mockResolvedValue(makeRows());

    const interaction = createInteraction();
    await cmd.execute(interaction);

    const call = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const csvContent = call.files[0].attachment.toString('utf-8');
    const headerLine = csvContent.split('\n')[0];

    expect(headerLine).toContain('player_name');
    expect(headerLine).toContain('troop_power');
    expect(headerLine).toContain('troop_leadership_current');
    expect(headerLine).toContain('troop_leadership_max');
    expect(headerLine).toContain('troop_crit_dmg_reduc_pct');
    expect(headerLine).toContain('troop_poison_dmg');
    expect(headerLine).toContain('latest_at');
  });
});
