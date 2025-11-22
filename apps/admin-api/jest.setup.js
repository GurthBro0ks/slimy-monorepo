const path = require('path');
const dotenv = require('dotenv');

// Load local .env for tests if present and provide defaults so config validation passes.
dotenv.config({ path: path.resolve(__dirname, '.env') });
process.env.DISCORD_CLIENT_ID ||= '123456789012345678';
process.env.DISCORD_CLIENT_SECRET ||= 'test-discord-secret';
process.env.SESSION_SECRET ||= '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.JWT_SECRET ||= 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';
process.env.DATABASE_URL ||= 'postgresql://slimy:slimy@localhost:5432/slimy?schema=public';
process.env.CORS_ORIGIN ||= 'http://localhost';

const normalizeMemberKey = (input) => {
  if (!input) return null;
  return String(input).trim().toLowerCase().replace(/\s+/g, '-');
};

// Shim vendor-only libs that aren't present in the test bundle.
jest.mock('./lib/club-vision', () => ({
  classifyPage: jest.fn(async () => ({ type: 'total', score: 1 })),
  parseManageMembersImageEnsemble: jest.fn(async (_dataUrl, metric = 'total') => ({
    metric: metric || 'total',
    rows: [
      { canonical: 'test-member', display: 'Test Member', value: 1000 },
    ],
    ensembleMetadata: { totalMembers: 1, disagreements: [] },
  })),
}));

jest.mock('./lib/club-store', () => ({
  canonicalize: jest.fn((input) => normalizeMemberKey(input)),
}), { virtual: true });

jest.mock('./lib/club-sheets', () => ({
  pushLatest: jest.fn(async (guildId) => ({ guildId, pushed: true })),
  testSheetAccess: jest.fn(async (sheetId) => ({ title: `Sheet ${sheetId}` })),
}), { virtual: true });

jest.mock('../../lib/database', () => ({
  isConfigured: jest.fn(() => false),
  query: jest.fn(async () => []),
}), { virtual: true });

jest.mock('./lib/usage-openai', () => ({
  parseWindow: jest.fn((window = '7d', startDate = null, endDate = null) => ({
    window,
    startDate: startDate || new Date(0),
    endDate: endDate || new Date(0),
  })),
  fetchOpenAIUsage: jest.fn(async () => []),
  fetchLocalImageStats: jest.fn(async () => []),
  aggregateUsage: jest.fn(() => ({ totalTokens: 0, requests: 0 })),
}), { virtual: true });

jest.mock('./lib/week-anchor', () => ({
  getWeekAnchor: jest.fn(() => ({ start: new Date(0), end: new Date(0) })),
  getWeekId: jest.fn(() => 'week-0'),
}));

jest.mock('./lib/club-corrections', () => ({
  listCorrections: jest.fn(async () => []),
  addCorrection: jest.fn(async (payload) => ({ id: 'mock-correction', ...payload })),
  removeCorrection: jest.fn(async () => true),
}));

// Mock Google Sheets SDK and auth so tests don't require external packages.
jest.mock('@googleapis/sheets', () => {
  const mockSpreadsheetsGet = jest.fn(async () => ({ data: { sheets: [] } }));
  const mockValuesGet = jest.fn(async () => ({ data: { values: [] } }));
  const mockBatchUpdate = jest.fn(async () => ({ data: {} }));

  const sheetsFn = jest.fn(() => ({
    spreadsheets: {
      get: mockSpreadsheetsGet,
      values: {
        get: mockValuesGet,
        batchUpdate: mockBatchUpdate,
      },
    },
  }));

  return { sheets: sheetsFn };
}, { virtual: true });

jest.mock('google-auth-library', () => ({
  GoogleAuth: jest.fn().mockImplementation(() => ({
    getClient: jest.fn(async () => ({})),
  })),
}), { virtual: true });

const snailVisionPath = path.join(__dirname, "src/routes/../../../lib/snail-vision");
jest.mock(snailVisionPath, () => ({
  analyzeSnailDataUrl: jest.fn(async () => ({
    ok: true,
    results: [],
  })),
}), { virtual: true });

const snailRoutesPath = path.join(__dirname, "src/routes/snail");
jest.mock(snailRoutesPath, () => {
  const express = require('express');
  return express.Router();
});

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    on: jest.fn(),
    close: jest.fn(),
  })),
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn(),
  })),
  QueueScheduler: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn(),
  })),
}), { virtual: true });

jest.mock('ioredis', () => jest.fn().mockImplementation(() => ({
  on: jest.fn(),
  quit: jest.fn(),
})), { virtual: true });

const adminApiDatabasePath = path.join(__dirname, "src/routes/../../../lib/database");
jest.mock(adminApiDatabasePath, () => ({
  isConfigured: jest.fn(() => false),
  query: jest.fn(async () => []),
}), { virtual: true });

jest.mock('./lib/guild-personality', () => {
  const PRESETS = [
    { key: 'friendly', label: 'Friendly Helper', description: 'Mock preset' },
  ];

  return {
    PRESETS,
    getGuildPersona: jest.fn(async () => ({
      system_prompt: 'Mock prompt',
      presets: PRESETS,
    })),
    upsertGuildPersona: jest.fn(async (_guildId, profile) => ({
      system_prompt: 'Mock prompt',
      profile,
    })),
    resetToPreset: jest.fn(async (_guildId, preset) => ({
      preset: preset || 'friendly',
    })),
    defaultsFor: jest.fn(() => ({ system_prompt: 'Default prompt' })),
  };
}, { virtual: true });

jest.mock('@slimy/core', () => {
  const numparse = require('../../lib/numparse');
  const normalize = (input) => normalizeMemberKey(input);

  return {
    ingestScreenshots: jest.fn(async () => {}),
    verifyStats: jest.fn(async () => {}),
    recomputeLatest: jest.fn(async () => {}),
    pushSheet: jest.fn(async (guildId) => ({ guildId })),
    pushLatest: jest.fn(async (guildId) => ({ guildId })),
    testSheetAccess: jest.fn(async (sheetId) => ({ title: `Sheet ${sheetId}` })),
    usage: {
      parseWindow: jest.fn((window = '7d', startDate = null, endDate = null) => ({
        window,
        startDate: startDate || new Date(0),
        endDate: endDate || new Date(0),
      })),
      fetchOpenAIUsage: jest.fn(async () => []),
      fetchLocalImageStats: jest.fn(async () => []),
      aggregateUsage: jest.fn(() => ({ totalTokens: 0, requests: 0 })),
    },
    parsePower: numparse.parsePower,
    normalizeMemberKey: jest.fn((input) => normalize(input)),
    classifyPage: jest.fn(async () => ({ type: 'total', score: 1 })),
    canonicalize: jest.fn((input) => normalize(input)),
    getWeekAnchor: jest.fn(() => ({ start: new Date(0), end: new Date(0) })),
    getWeekId: jest.fn(() => 'week-0'),
  };
});

try {
  // Ensure config module sees the env populated; fall back to real module.
  jest.mock('./src/lib/config/index.js', () => {
    const real = jest.requireActual('./src/lib/config/index.js');
    return real;
  });
} catch (err) {
  // If the path changes, continue without mocking.
}

// Provide deterministic token verification for tests.
const sessionTokens = new Map([
  [
    'valid-token',
    {
      user: {
        id: 'test-user',
        username: 'TestUser',
        globalName: 'Test User',
        avatar: null,
        role: 'member',
        guilds: [{ id: 'guild-123' }],
      },
      session: {
        sub: 'test-user',
        username: 'TestUser',
        globalName: 'Test User',
        avatar: null,
        role: 'member',
        guilds: [{ id: 'guild-123' }],
      },
    },
  ],
  [
    'admin-token',
    {
      user: {
        id: 'test-admin',
        username: 'TestAdmin',
        globalName: 'Test Admin',
        avatar: null,
        role: 'admin',
        guilds: [{ id: 'guild-123' }],
      },
      session: {
        sub: 'test-admin',
        username: 'TestAdmin',
        globalName: 'Test Admin',
        avatar: null,
        role: 'admin',
        guilds: [{ id: 'guild-123' }],
      },
    },
  ],
  [
    'member-token',
    {
      user: {
        id: 'test-member',
        username: 'TestMember',
        globalName: 'Test Member',
        avatar: null,
        role: 'member',
        guilds: [{ id: 'guild-123' }],
      },
      session: {
        sub: 'test-member',
        username: 'TestMember',
        globalName: 'Test Member',
        avatar: null,
        role: 'member',
        guilds: [{ id: 'guild-123' }],
      },
    },
  ],
]);

jest.mock('./src/services/token', () => ({
  verifySessionToken: jest.fn((token) => {
    const payload = sessionTokens.get(token);
    if (!payload) {
      throw new Error('jwt malformed');
    }
    return payload;
  }),
  createSessionToken: jest.fn(),
  getCookieOptions: jest.fn(() => ({})),
}));

// Mock uuid to avoid ES module issues
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

// Mock database to avoid initialization issues
const mockDatabase = {
  isConfigured: jest.fn(() => false),
  initialize: jest.fn(() => Promise.resolve(false)),
  getChatMessages: jest.fn(() => Promise.resolve([])),
  getClient: jest.fn(() => ({
    guild: {
      create: jest.fn(() => Promise.resolve({ id: 'guild-123', discordId: '123', name: 'Test Guild' })),
      findUnique: jest.fn(() => Promise.resolve({
        id: 'guild-123',
        discordId: '123',
        name: 'Test Guild',
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        userGuilds: [],
        _count: { userGuilds: 0, chatMessages: 0 }
      })),
      findMany: jest.fn(() => Promise.resolve([])),
      count: jest.fn(() => Promise.resolve(0)),
      update: jest.fn(() => Promise.resolve({ id: 'guild-123', discordId: '123', name: 'Updated Guild' })),
      delete: jest.fn(() => Promise.resolve({})),
    },
    userGuild: {
      create: jest.fn(() => Promise.resolve({
        userId: 'user-123',
        guildId: 'guild-123',
        roles: ['member'],
        user: { id: 'user-123', discordId: '123', username: 'testuser' }
      })),
      update: jest.fn(() => Promise.resolve({
        userId: 'user-123',
        guildId: 'guild-123',
        roles: ['moderator']
      })),
      delete: jest.fn(() => Promise.resolve({})),
      findUnique: jest.fn(() => Promise.resolve({
        userId: 'user-123',
        guildId: 'guild-123',
        roles: ['member']
      })),
      findMany: jest.fn(() => Promise.resolve([])),
      count: jest.fn(() => Promise.resolve(0)),
    },
    user: {
      findUnique: jest.fn(() => Promise.resolve({
        id: 'user-123',
        discordId: '123',
        username: 'testuser'
      })),
    },
  })),
  findOrCreateGuild: jest.fn(),
  findGuildByDiscordId: jest.fn(),
  findGuildById: jest.fn(),
  listGuilds: jest.fn(),
  countGuilds: jest.fn(),
  createGuild: jest.fn(),
  updateGuild: jest.fn(),
  deleteGuild: jest.fn(),
  updateGuildSettings: jest.fn(),
  addUserToGuild: jest.fn(),
  removeUserFromGuild: jest.fn(),
  getUserGuilds: jest.fn(),
  getGuildMembers: jest.fn(),
  countGuildMembers: jest.fn(),
  updateUserGuildRoles: jest.fn(),
  findUserById: jest.fn(() => Promise.resolve({ id: 'user-123', discordId: '123', username: 'testuser' })),
};

jest.mock('./src/lib/database', () => mockDatabase);

// Mock session store to avoid database dependencies
const mockSessions = new Map();

// Pre-populate test sessions
mockSessions.set('test-user', {
  guilds: [{ id: 'guild-123', name: 'Test Guild' }],
  role: 'member',
  accessToken: 'test-access',
  refreshToken: 'test-refresh',
});

mockSessions.set('test-admin', {
  guilds: [{ id: 'guild-123', name: 'Test Guild' }],
  role: 'admin',
  accessToken: 'test-access',
  refreshToken: 'test-refresh',
});

mockSessions.set('test-member', {
  guilds: [{ id: 'guild-123', name: 'Test Guild' }],
  role: 'member',
  accessToken: 'test-access',
  refreshToken: 'test-refresh',
});

mockSessions.set('test-club', {
  guilds: [{ id: 'guild-123', name: 'Test Guild' }],
  role: 'club',
  accessToken: 'test-access',
  refreshToken: 'test-refresh',
});

jest.mock('./lib/session-store', () => ({
  storeSession: jest.fn((userId, sessionData) => {
    mockSessions.set(userId, sessionData);
  }),
  getSession: jest.fn((userId) => {
    return mockSessions.get(userId) || null;
  }),
  clearSession: jest.fn((userId) => {
    mockSessions.delete(userId);
  }),
  activeSessionCount: jest.fn(() => mockSessions.size),
  getAllSessions: jest.fn(() => Object.fromEntries(mockSessions)),
}));

// Mock JWT functions
const mockTokens = new Map();

jest.mock('./lib/jwt', () => ({
  COOKIE_NAME: 'slimy_admin_token',
  verifySession: jest.fn((token) => {
    const decoded = mockTokens.get(token);
    if (decoded) {
      return decoded;
    }
    // For test tokens, return mock user data
    if (token === 'valid-token') {
      return {
        user: {
          id: 'test-user',
          username: 'TestUser',
          globalName: 'Test User',
          avatar: null,
          role: 'member',
          guilds: [{ id: 'guild-123' }],
        },
      };
    }
    if (token === 'admin-token') {
      return {
        user: {
          id: 'test-admin',
          username: 'TestAdmin',
          globalName: 'Test Admin',
          avatar: null,
          role: 'admin',
          guilds: [{ id: 'guild-123' }],
        },
      };
    }
    if (token === 'member-token') {
      return {
        user: {
          id: 'test-member',
          username: 'TestMember',
          globalName: 'Test Member',
          avatar: null,
          role: 'member',
          guilds: [{ id: 'guild-123' }],
        },
      };
    }
    throw new Error('jwt malformed');
  }),
  signSession: jest.fn((data) => {
    const token = `mock-jwt-${Date.now()}-${Math.random()}`;
    mockTokens.set(token, data);
    return token;
  }),
  setAuthCookie: jest.fn(),
  clearAuthCookie: jest.fn(),
}));

// Mock chat bot service
jest.mock('./src/services/chat-bot', () => ({
  askChatBot: jest.fn(() => Promise.resolve({ reply: 'Test reply' })),
}));

// Mock metrics
jest.mock('./src/lib/metrics', () => ({
  recordApiCall: jest.fn(),
  recordDatabaseQuery: jest.fn(),
  recordDatabaseConnection: jest.fn(),
  recordChatMessage: jest.fn(),
  recordError: jest.fn(),
}));

// Mock logger
jest.mock('./src/lib/logger', () => ({
  requestLogger: jest.fn((req, res, next) => next()),
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));
