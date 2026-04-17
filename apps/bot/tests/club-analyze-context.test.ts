/**
 * Tests for club-analyze-context.ts — context menu command
 * and club-analyze-flow.ts — shared flow service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApplicationCommandType } from 'discord.js';

const {
  mockRunClubAnalyze,
  mockExtractRoster,
  mockDedupeRosterRows,
} = vi.hoisted(() => ({
  mockRunClubAnalyze: vi.fn().mockResolvedValue('test-session-id'),
  mockExtractRoster: vi.fn().mockImplementation(async (_attachments: unknown, options: any) => {
    if (options?.onProgress) {
      options.onProgress(1, 1, 'test-image');
    }
    return [
      {
        imageIndex: 0,
        rows: [
          { name: 'Alice', power: BigInt(1000) },
          { name: 'Bob', power: BigInt(2000) },
        ],
      },
    ];
  }),
  mockDedupeRosterRows: vi.fn((rows) => rows),
}));

vi.mock('../src/services/roster-ocr.js', () => ({
  extractRoster: mockExtractRoster,
  dedupeRosterRows: mockDedupeRosterRows,
}));

vi.mock('../src/services/club-staging.js', () => ({
  saveStagingRows: vi.fn().mockResolvedValue(undefined),
  clearStaging: vi.fn().mockResolvedValue(undefined),
  loadStagingRows: vi.fn().mockResolvedValue([]),
  updateStagingRow: vi.fn().mockResolvedValue(undefined),
  getStagingStatus: vi.fn().mockResolvedValue(null),
}));

vi.mock('uuid', () => ({
  v4: () => 'test-uuid-' + Math.random().toString(36).slice(2, 8),
}));

// ─── Context Menu Command Tests ─────────────────────────────────────────────

describe('club-analyze-context command definition', () => {
  it('has type MESSAGE (3) and name "Analyze Club Roster"', async () => {
    const cmd = await import('../src/commands/club-analyze-context.js');
    const json = cmd.default.data.toJSON();
    expect(json.name).toBe('Analyze Club Roster');
    expect(json.type).toBe(ApplicationCommandType.Message);
  });
});

describe('club-analyze-context execute', () => {
  let mockInteraction: any;
  let mockAttachments: any[];

  beforeEach(() => {
    vi.clearAllMocks();
    mockAttachments = [];
    mockInteraction = {
      deferReply: vi.fn().mockResolvedValue(undefined),
      editReply: vi.fn().mockResolvedValue(undefined),
      reply: vi.fn().mockResolvedValue(undefined),
      guildId: 'guild-123',
      user: { id: 'user-456', username: 'TestUser' },
      targetMessage: {
        attachments: {
          values: () => mockAttachments,
        },
      },
    };
  });

  it('replies with error when no image attachments found', async () => {
    const cmd = await import('../src/commands/club-analyze-context.js');
    mockAttachments = [];
    await cmd.default.execute(mockInteraction);
    expect(mockInteraction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('No image attachments found'),
      }),
    );
  });

  it('shows metric buttons when exactly 1 image attachment', async () => {
    const cmd = await import('../src/commands/club-analyze-context.js');
    mockAttachments = [
      { contentType: 'image/png', url: 'https://example.com/img.png', name: 'img.png' },
    ];
    await cmd.default.execute(mockInteraction);
    const call = mockInteraction.editReply.mock.calls[0][0];
    expect(call.content).toContain('Found **1** screenshot');
    expect(call.components).toBeDefined();
    expect(call.components.length).toBe(1);
    expect(call.components[0].components.length).toBe(2);
  });

  it('shows metric buttons with 10 image attachments', async () => {
    const cmd = await import('../src/commands/club-analyze-context.js');
    mockAttachments = Array.from({ length: 10 }, (_, i) => ({
      contentType: 'image/png',
      url: `https://example.com/img${i}.png`,
      name: `img${i}.png`,
    }));
    await cmd.default.execute(mockInteraction);
    const call = mockInteraction.editReply.mock.calls[0][0];
    expect(call.content).toContain('Found **10** screenshots');
  });

  it('replies with error when more than 10 image attachments', async () => {
    const cmd = await import('../src/commands/club-analyze-context.js');
    mockAttachments = Array.from({ length: 11 }, (_, i) => ({
      contentType: 'image/png',
      url: `https://example.com/img${i}.png`,
      name: `img${i}.png`,
    }));
    await cmd.default.execute(mockInteraction);
    expect(mockInteraction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('Too many attachments'),
      }),
    );
  });

  it('filters out non-image attachments (PDF, video)', async () => {
    const cmd = await import('../src/commands/club-analyze-context.js');
    mockAttachments = [
      { contentType: 'application/pdf', url: 'https://example.com/doc.pdf', name: 'doc.pdf' },
      { contentType: 'image/png', url: 'https://example.com/img.png', name: 'img.png' },
      { contentType: 'video/mp4', url: 'https://example.com/vid.mp4', name: 'vid.mp4' },
    ];
    await cmd.default.execute(mockInteraction);
    const call = mockInteraction.editReply.mock.calls[0][0];
    expect(call.content).toContain('Found **1** screenshot');
  });
});

describe('club-analyze-context handleButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns false for wrong namespace prefix', async () => {
    const cmd = await import('../src/commands/club-analyze-context.js');
    const result = await cmd.default.handleButton({
      customId: 'club-analyze:save:session123',
      update: vi.fn(),
      reply: vi.fn(),
      followUp: vi.fn(),
      user: { id: 'user-456' },
    });
    expect(result).toBe(false);
  });

  it('returns false for unknown action within namespace', async () => {
    const cmd = await import('../src/commands/club-analyze-context.js');
    const result = await cmd.default.handleButton({
      customId: 'Analyze Club Roster:unknown:value:id',
      update: vi.fn(),
      reply: vi.fn(),
      followUp: vi.fn(),
      user: { id: 'user-456' },
    });
    expect(result).toBe(false);
  });

  it('replies with error for expired pending session', async () => {
    const cmd = await import('../src/commands/club-analyze-context.js');
    const mockReply = vi.fn().mockResolvedValue(undefined);
    const result = await cmd.default.handleButton({
      customId: 'Analyze Club Roster:metric:sim:nonexistent-pending-id',
      update: vi.fn(),
      reply: mockReply,
      followUp: vi.fn(),
      user: { id: 'user-456' },
    });
    expect(result).toBe(true);
    expect(mockReply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('Session expired'),
      }),
    );
  });

  it('blocks non-owner from selecting metric', async () => {
    const cmd = await import('../src/commands/club-analyze-context.js');

    const mockAttachments = [
      { contentType: 'image/png', url: 'https://example.com/img.png', name: 'img.png' },
    ];
    const mockEditReply = vi.fn().mockResolvedValue(undefined);
    const mockExecute = {
      deferReply: vi.fn().mockResolvedValue(undefined),
      editReply: mockEditReply,
      guildId: 'guild-123',
      user: { id: 'user-456', username: 'TestUser' },
      targetMessage: {
        attachments: { values: () => mockAttachments },
      },
    };
    await cmd.default.execute(mockExecute);

    // Extract pendingId from editReply components
    const metricCall = mockEditReply.mock.calls[0][0];
    const simButtonBuilder = metricCall.components[0].components[0];
    const simButtonJson = simButtonBuilder.toJSON ? simButtonBuilder.toJSON() : simButtonBuilder.data;
    const simButtonCustomId = simButtonJson.custom_id;
    const pendingId = simButtonCustomId.split(':')[3];

    // Try to select metric as different user
    const mockReply = vi.fn().mockResolvedValue(undefined);
    const result = await cmd.default.handleButton({
      customId: `Analyze Club Roster:metric:sim:${pendingId}`,
      update: vi.fn(),
      reply: mockReply,
      followUp: vi.fn(),
      user: { id: 'other-user-999' },
    });

    expect(result).toBe(true);
    expect(mockReply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('Only the person who started'),
      }),
    );
  });

  it('runs OCR and shows paginated UI on valid metric selection', async () => {
    const cmd = await import('../src/commands/club-analyze-context.js');

    // First execute to create pending session
    const mockAttachments = [
      { contentType: 'image/png', url: 'https://example.com/img.png', name: 'img.png' },
    ];
    const mockEditReply = vi.fn().mockResolvedValue(undefined);
    const mockExecute = {
      deferReply: vi.fn().mockResolvedValue(undefined),
      editReply: mockEditReply,
      guildId: 'guild-123',
      user: { id: 'user-456', username: 'TestUser' },
      targetMessage: {
        attachments: { values: () => mockAttachments },
      },
    };
    await cmd.default.execute(mockExecute);

    // Extract pendingId from editReply components
    const metricCall = mockEditReply.mock.calls[0][0];
    const simButtonBuilder = metricCall.components[0].components[0];
    const simButtonJson = simButtonBuilder.toJSON ? simButtonBuilder.toJSON() : simButtonBuilder.data;
    const simButtonCustomId = simButtonJson.custom_id;
    const pendingId = simButtonCustomId.split(':')[3];

    // Select sim metric as the owner
    const mockUpdate = vi.fn().mockResolvedValue(undefined);
    const mockFollowUp = vi.fn().mockResolvedValue(undefined);

    const result = await cmd.default.handleButton({
      customId: `Analyze Club Roster:metric:sim:${pendingId}`,
      update: mockUpdate,
      reply: vi.fn(),
      followUp: mockFollowUp,
      user: { id: 'user-456' },
    });

    expect(result).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('Processing'),
      }),
    );
    expect(mockFollowUp).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('Scanned'),
      }),
    );
    // FollowUp should have embeds and components (paginated UI)
    const followUpCall = mockFollowUp.mock.calls[0][0];
    expect(followUpCall.embeds).toBeDefined();
    expect(followUpCall.components).toBeDefined();
  });
});

// ─── Shared Flow Module Tests ───────────────────────────────────────────────

describe('club-analyze-flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExtractRoster.mockResolvedValue([
      {
        imageIndex: 0,
        rows: [
          { name: 'Alice', power: BigInt(1000) },
          { name: 'Bob', power: BigInt(2000) },
        ],
      },
    ]);
    mockDedupeRosterRows.mockImplementation((rows) =>
      rows.map((r: any) => ({ name: r.name, power: r.power })),
    );
  });

  it('runClubAnalyze creates a session and returns sessionId', async () => {
    const flow = await import('../src/services/club-analyze-flow.js');

    const sessionId = await flow.runClubAnalyze({
      metric: 'sim',
      attachments: [{ url: 'https://example.com/img.png', name: 'img.png' }],
      guildId: 'guild-123',
      userId: 'user-456',
      username: 'TestUser',
    });

    expect(sessionId).toBeTruthy();
    expect(flow.getSession(sessionId)).not.toBeNull();
    const session = flow.getSession(sessionId)!;
    expect(session.metric).toBe('sim');
    expect(session.pages.length).toBe(1);
    expect(session.canonicalMerged.length).toBe(2);
  });

  it('runClubAnalyze calls onProgress callback', async () => {
    const flow = await import('../src/services/club-analyze-flow.js');
    const onProgress = vi.fn();

    mockExtractRoster.mockImplementation(async (_attachments: unknown, options: any) => {
      if (options?.onProgress) {
        options.onProgress(1, 1, 'test-image');
      }
      return [
        {
          imageIndex: 0,
          rows: [
            { name: 'Alice', power: BigInt(1000) },
            { name: 'Bob', power: BigInt(2000) },
          ],
        },
      ];
    });

    await flow.runClubAnalyze({
      metric: 'sim',
      attachments: [{ url: 'https://example.com/img.png', name: 'img.png' }],
      guildId: 'guild-123',
      userId: 'user-456',
      username: 'TestUser',
      onProgress,
    });

    expect(onProgress).toHaveBeenCalled();
  });

  it('buildPageEmbed returns an embed with correct fields', async () => {
    const flow = await import('../src/services/club-analyze-flow.js');

    const sessionId = await flow.runClubAnalyze({
      metric: 'sim',
      attachments: [{ url: 'https://example.com/img.png', name: 'img.png' }],
      guildId: 'guild-123',
      userId: 'user-456',
      username: 'TestUser',
    });

    const session = flow.getSession(sessionId)!;
    const embed = flow.buildPageEmbed(session);
    expect(embed).toBeDefined();
    const json = embed.toJSON();
    expect(json.title).toContain('SIM');
    expect(json.fields!.length).toBe(2);
  });

  it('buildNavigationRow returns 2 action rows with correct buttons', async () => {
    const flow = await import('../src/services/club-analyze-flow.js');

    const sessionId = await flow.runClubAnalyze({
      metric: 'sim',
      attachments: [{ url: 'https://example.com/img.png', name: 'img.png' }],
      guildId: 'guild-123',
      userId: 'user-456',
      username: 'TestUser',
    });

    const session = flow.getSession(sessionId)!;
    const rows = flow.buildNavigationRow(session, sessionId);
    expect(rows.length).toBe(2);
    expect(rows[0].components.length).toBe(4); // prev, edit, save, next
    expect(rows[1].components.length).toBe(1); // cancel
  });

  it('pending context sessions are stored and retrieved', async () => {
    const flow = await import('../src/services/club-analyze-flow.js');

    const pending = {
      id: 'test-pending-id',
      guildId: 'guild-123',
      userId: 'user-456',
      username: 'TestUser',
      attachments: [{ url: 'https://example.com/img.png', name: 'img.png' }],
      createdAt: Date.now(),
    };

    flow.storePendingContext(pending);
    expect(flow.getPendingContextSession('test-pending-id')).toEqual(pending);

    flow.deletePendingContextSession('test-pending-id');
    expect(flow.getPendingContextSession('test-pending-id')).toBeNull();
  });

  it('cleanExpiredSessions removes expired sessions', async () => {
    const flow = await import('../src/services/club-analyze-flow.js');

    // Manually insert an expired session
    flow.sessions.set('expired-session', {
      interactionId: 'expired-session',
      guildId: 'guild-123',
      userId: 'user-456',
      username: 'TestUser',
      metric: 'sim',
      currentPage: 0,
      pages: [],
      canonicalMerged: [],
      dirty: false,
      createdAt: Date.now() - 61 * 60 * 1000, // 61 minutes ago
    });

    expect(flow.getSession('expired-session')).toBeNull();
  });
});
