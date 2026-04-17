import {
  sessions,
  cleanExpiredSessions,
  getSession,
  storePendingContext,
  getPendingContextSession,
  deletePendingContextSession,
  buildPageEmbed,
  buildNavigationRow,
  MAX_IMAGES,
  BUTTON_PREFIX,
} from '../../src/services/club-analyze-flow';
import type { ScanSession, Page } from '../../src/services/club-analyze-flow';

describe('club-analyze-flow — constants', () => {
  it('MAX_IMAGES should be 10', () => {
    expect(MAX_IMAGES).toBe(10);
  });

  it('BUTTON_PREFIX should be club-analyze', () => {
    expect(BUTTON_PREFIX).toBe('club-analyze');
  });
});

describe('club-analyze-flow — session store', () => {
  it('should return null for nonexistent session', () => {
    expect(getSession('nonexistent')).toBeNull();
  });

  it('should store and retrieve session', () => {
    const session: ScanSession = {
      interactionId: 'test-session-1',
      guildId: 'g1',
      userId: 'u1',
      username: 'testuser',
      metric: 'sim',
      currentPage: 0,
      pages: [{ screenshotFilename: 'test.png', rows: [] }],
      canonicalMerged: [],
      dirty: false,
      createdAt: Date.now(),
    };
    sessions.set('test-session-1', session);
    expect(getSession('test-session-1')).toBeTruthy();
    expect(getSession('test-session-1')!.metric).toBe('sim');
    sessions.delete('test-session-1');
  });

  it('should expire old sessions', () => {
    const session: ScanSession = {
      interactionId: 'expired-session',
      guildId: 'g1',
      userId: 'u1',
      username: 'testuser',
      metric: 'total',
      currentPage: 0,
      pages: [],
      canonicalMerged: [],
      dirty: false,
      createdAt: Date.now() - 61 * 60 * 1000,
    };
    sessions.set('expired-session', session);
    expect(getSession('expired-session')).toBeNull();
    expect(sessions.has('expired-session')).toBe(false);
  });
});

describe('club-analyze-flow — cleanExpiredSessions', () => {
  it('should remove expired sessions', () => {
    const session: ScanSession = {
      interactionId: 'to-clean',
      guildId: 'g1',
      userId: 'u1',
      username: 'testuser',
      metric: 'sim',
      currentPage: 0,
      pages: [],
      canonicalMerged: [],
      dirty: false,
      createdAt: Date.now() - 2 * 60 * 60 * 1000,
    };
    sessions.set('to-clean', session);
    cleanExpiredSessions();
    expect(sessions.has('to-clean')).toBe(false);
  });
});

describe('club-analyze-flow — pending context sessions', () => {
  afterEach(() => {
    deletePendingContextSession('pending-1');
  });

  it('should store and retrieve pending context', () => {
    const pending = {
      id: 'pending-1',
      guildId: 'g1',
      userId: 'u1',
      username: 'testuser',
      attachments: [{ url: 'https://example.com/img.png', name: 'img.png' }],
      createdAt: Date.now(),
    };
    storePendingContext(pending);
    const result = getPendingContextSession('pending-1');
    expect(result).toBeTruthy();
    expect(result!.userId).toBe('u1');
    expect(result!.attachments).toHaveLength(1);
  });

  it('should return null for nonexistent pending', () => {
    expect(getPendingContextSession('nonexistent')).toBeNull();
  });

  it('should delete pending context', () => {
    const pending = {
      id: 'pending-1',
      guildId: 'g1',
      userId: 'u1',
      username: 'testuser',
      attachments: [],
      createdAt: Date.now(),
    };
    storePendingContext(pending);
    deletePendingContextSession('pending-1');
    expect(getPendingContextSession('pending-1')).toBeNull();
  });

  it('should expire old pending context', () => {
    const pending = {
      id: 'pending-1',
      guildId: 'g1',
      userId: 'u1',
      username: 'testuser',
      attachments: [],
      createdAt: Date.now() - 61 * 60 * 1000,
    };
    storePendingContext(pending);
    expect(getPendingContextSession('pending-1')).toBeNull();
  });
});

describe('club-analyze-flow — buildPageEmbed', () => {
  it('should build embed with page data', () => {
    const session: ScanSession = {
      interactionId: 'embed-test',
      guildId: 'g1',
      userId: 'u1',
      username: 'testuser',
      metric: 'sim',
      currentPage: 0,
      pages: [{
        screenshotFilename: 'screenshot1.png',
        rows: [
          { name: 'Alice', power: BigInt(1000), edited: false },
          { name: 'Bob', power: BigInt(2000), edited: true },
        ],
      }],
      canonicalMerged: [],
      dirty: true,
      createdAt: Date.now(),
    };
    const embed = buildPageEmbed(session);
    expect(embed).toBeTruthy();
    const data = embed.toJSON();
    expect(data.title).toContain('SIM');
    expect(data.title).toContain('1/1');
  });
});

describe('club-analyze-flow — buildNavigationRow', () => {
  it('should build navigation buttons', () => {
    const session: ScanSession = {
      interactionId: 'nav-test',
      guildId: 'g1',
      userId: 'u1',
      username: 'testuser',
      metric: 'total',
      currentPage: 0,
      pages: [
        { screenshotFilename: 'p1.png', rows: [] },
        { screenshotFilename: 'p2.png', rows: [] },
      ],
      canonicalMerged: [],
      dirty: false,
      createdAt: Date.now(),
    };
    const rows = buildNavigationRow(session, 'nav-test');
    expect(rows).toHaveLength(2);
    const firstRow = rows[0].toJSON();
    expect(firstRow.components).toHaveLength(4);
  });

  it('should disable prev on first page', () => {
    const session: ScanSession = {
      interactionId: 'first-page',
      guildId: 'g1',
      userId: 'u1',
      username: 'testuser',
      metric: 'sim',
      currentPage: 0,
      pages: [
        { screenshotFilename: 'p1.png', rows: [] },
        { screenshotFilename: 'p2.png', rows: [] },
      ],
      canonicalMerged: [],
      dirty: false,
      createdAt: Date.now(),
    };
    const rows = buildNavigationRow(session, 'first-page');
    const firstRow = rows[0].toJSON();
    expect(firstRow.components[0].disabled).toBe(true);
    expect(firstRow.components[3].disabled).toBe(false);
  });
});
