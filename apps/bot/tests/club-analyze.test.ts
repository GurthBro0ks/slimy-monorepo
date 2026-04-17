/**
 * Regression tests for club-analyze.ts
 *
 * 1. handleSave uses update() + followUp() (NOT reply()) to avoid InteractionAlreadyReplied
 * 2. Command has 10 attachment slots named image_1 through image_10
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MessageFlags } from 'discord.js';

const FIXED_SESSION_ID = '00000000-0000-0000-0000-000000000001';

const {
  mockSaveStagingRows,
  mockClearStaging,
  mockExtractRoster,
  mockDedupeRosterRows,
} = vi.hoisted(() => ({
  mockSaveStagingRows: vi.fn().mockResolvedValue(undefined),
  mockClearStaging: vi.fn().mockResolvedValue(undefined),
  mockExtractRoster: vi.fn().mockResolvedValue([
    {
      imageIndex: 0,
      rows: [
        { name: 'Alice', power: BigInt(1000) },
        { name: 'Bob', power: BigInt(2000) },
      ],
    },
  ]),
  mockDedupeRosterRows: vi.fn((rows) => rows),
}));

vi.mock('../src/services/club-staging.js', () => ({
  saveStagingRows: mockSaveStagingRows,
  clearStaging: mockClearStaging,
  loadStagingRows: vi.fn().mockResolvedValue([]),
  updateStagingRow: vi.fn().mockResolvedValue(undefined),
  getStagingStatus: vi.fn().mockResolvedValue(null),
}));

vi.mock('../src/services/roster-ocr.js', () => ({
  extractRoster: mockExtractRoster,
  dedupeRosterRows: mockDedupeRosterRows,
}));

vi.mock('uuid', () => ({
  v4: () => FIXED_SESSION_ID,
}));

import cmd from '../src/commands/club-analyze.js';

function createMockExecuteInteraction() {
  const mockAttachment = {
    url: 'https://example.com/screenshot.png',
    name: 'screenshot.png',
    contentType: 'image/png',
  };

  return {
    deferReply: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
    followUp: vi.fn().mockResolvedValue(undefined),
    guildId: 'guild-123',
    user: { id: 'user-456', username: 'TestUser' },
    options: {
      getString: vi.fn((name: string) => {
        if (name === 'metric') return 'sim';
        return null;
      }),
      getAttachment: vi.fn((name: string) => {
        if (name === 'image_1') return mockAttachment;
        return null;
      }),
    },
    isButton: () => false,
    isModalSubmit: () => false,
  } as unknown as import('discord.js').ChatInputCommandInteraction;
}

function createMockButtonInteraction(action: string, sessionId?: string, userId: string = 'user-456') {
  const sid = sessionId ?? FIXED_SESSION_ID;
  return {
    customId: `club-analyze:${action}:${sid}`,
    reply: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    followUp: vi.fn().mockResolvedValue(undefined),
    deferred: false,
    replied: false,
    user: { id: userId, username: userId === 'user-456' ? 'TestUser' : 'OtherUser' },
    isButton: () => true,
  } as unknown as import('discord.js').ButtonInteraction;
}

describe('club-analyze command schema', () => {
  it('has 10 attachment slots named image_1 through image_10', () => {
    const json = cmd.data.toJSON();
    const attachmentOptions = json.options.filter((o: { type: number }) => o.type === 11);
    expect(attachmentOptions).toHaveLength(10);
    for (let i = 0; i < 10; i++) {
      expect(attachmentOptions[i].name).toBe(`image_${i + 1}`);
    }
  });

  it('has a metric string option with sim and total choices', () => {
    const json = cmd.data.toJSON();
    const metricOpt = json.options.find((o: { name: string }) => o.name === 'metric');
    expect(metricOpt).toBeDefined();
    expect(metricOpt.type).toBe(3);
    const choices = metricOpt.choices.map((c: { value: string }) => c.value);
    expect(choices).toContain('sim');
    expect(choices).toContain('total');
  });
});

describe('handleSave interaction lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSaveStagingRows.mockResolvedValue(undefined);
    mockExtractRoster.mockResolvedValue([
      {
        imageIndex: 0,
        rows: [
          { name: 'Alice', power: BigInt(1000) },
          { name: 'Bob', power: BigInt(2000) },
        ],
      },
    ]);
    mockDedupeRosterRows.mockImplementation((rows) => rows);
  });

  async function setupSession(): Promise<void> {
    const execInteraction = createMockExecuteInteraction();
    await cmd.execute(execInteraction);
  }

  it('uses update + followUp (not reply) on successful save', async () => {
    await setupSession();

    const interaction = createMockButtonInteraction('save');
    await cmd.handleButton(interaction);

    expect(interaction.update).toHaveBeenCalledTimes(1);
    expect(interaction.followUp).toHaveBeenCalledTimes(1);
    expect(interaction.reply).not.toHaveBeenCalled();

    const followUpContent = (interaction.followUp as ReturnType<typeof vi.fn>).mock.calls[0][0].content;
    expect(followUpContent).toContain('Saved');
    expect(followUpContent).toContain('SIM');
  });

  it('calls saveStagingRows with correct guild, metric, and members', async () => {
    await setupSession();

    const interaction = createMockButtonInteraction('save');
    await cmd.handleButton(interaction);

    expect(mockSaveStagingRows).toHaveBeenCalledTimes(1);
    const [guildId, metric, userId, rows] = mockSaveStagingRows.mock.calls[0];
    expect(guildId).toBe('guild-123');
    expect(metric).toBe('sim');
    expect(rows.length).toBeGreaterThan(0);
  });

  it('uses reply in catch when error occurs before update (no response yet sent)', async () => {
    mockSaveStagingRows.mockRejectedValueOnce(new Error('DB down'));

    await setupSession();

    const interaction = createMockButtonInteraction('save');
    await cmd.handleButton(interaction);

    expect(interaction.update).not.toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalledTimes(1);
    const replyContent = (interaction.reply as ReturnType<typeof vi.fn>).mock.calls[0][0].content;
    expect(replyContent).toContain('Save failed');
    expect(replyContent).toContain('DB down');
  });

  it('catch block handles reply failure gracefully (no unhandled rejection)', async () => {
    mockSaveStagingRows.mockRejectedValueOnce(new Error('DB down'));

    await setupSession();

    const interaction = createMockButtonInteraction('save');
    (interaction.reply as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('interaction expired'));
    await cmd.handleButton(interaction);

    expect(interaction.reply).toHaveBeenCalledTimes(1);
  });

  it('returns session expired for unknown session', async () => {
    const interaction = createMockButtonInteraction('save', 'nonexistent-session');
    await cmd.handleButton(interaction);

    expect(interaction.reply).toHaveBeenCalledTimes(1);
    const replyContent = (interaction.reply as ReturnType<typeof vi.fn>).mock.calls[0][0].content;
    expect(replyContent).toContain('Session expired');
    expect(interaction.update).not.toHaveBeenCalled();
    expect(interaction.followUp).not.toHaveBeenCalled();
  });

  it('blocks non-invoker from tapping buttons', async () => {
    await setupSession();

    const interaction = createMockButtonInteraction('save', FIXED_SESSION_ID, 'other-user-999');
    await cmd.handleButton(interaction);

    expect(interaction.reply).toHaveBeenCalledTimes(1);
    const replyContent = (interaction.reply as ReturnType<typeof vi.fn>).mock.calls[0][0].content;
    expect(replyContent).toContain('Only TestUser can edit this scan');
    expect((interaction.reply as ReturnType<typeof vi.fn>).mock.calls[0][0].flags).toBe(MessageFlags.Ephemeral);
  });

  it('allows invoker to tap buttons normally', async () => {
    await setupSession();

    const interaction = createMockButtonInteraction('save', FIXED_SESSION_ID, 'user-456');
    await cmd.handleButton(interaction);

    expect(interaction.update).toHaveBeenCalled();
    expect(interaction.followUp).toHaveBeenCalled();
  });
});

describe('club-analyze visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExtractRoster.mockResolvedValue([
      {
        imageIndex: 0,
        rows: [
          { name: 'Alice', power: BigInt(1000) },
        ],
      },
    ]);
    mockDedupeRosterRows.mockImplementation((rows) => rows);
  });

  it('defers reply as PUBLIC (not ephemeral)', async () => {
    const interaction = createMockExecuteInteraction();
    await cmd.execute(interaction);

    const deferCall = (interaction.deferReply as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(deferCall).toHaveLength(0);
  });

  it('editReply sends PUBLIC review pages (no ephemeral flag)', async () => {
    const interaction = createMockExecuteInteraction();
    await cmd.execute(interaction);

    const editCalls = (interaction.editReply as ReturnType<typeof vi.fn>).mock.calls;
    const pageCall = editCalls.find((c: Array<Record<string, unknown>>) => c[0]?.embeds);
    expect(pageCall).toBeDefined();
    expect(pageCall![0].flags).toBeUndefined();
  });

  it('save followUp is PUBLIC (no ephemeral flag)', async () => {
    const interaction = createMockExecuteInteraction();
    await cmd.execute(interaction);

    const saveInteraction = createMockButtonInteraction('save');
    await cmd.handleButton(saveInteraction);

    const followUpCall = (saveInteraction.followUp as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(followUpCall[0].flags).toBeUndefined();
  });
});
