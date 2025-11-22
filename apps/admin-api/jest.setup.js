// Set up required environment variables for tests
process.env.DISCORD_CLIENT_ID ||= "1234567890123456789";
process.env.DISCORD_CLIENT_SECRET ||= "test-secret-with-minimum-length-requirement";
process.env.SESSION_SECRET ||= "test-session-secret-with-minimum-32-chars-required-for-security";
process.env.JWT_SECRET ||= "test-jwt-secret-with-minimum-32-characters-required-for-security";
process.env.OPENAI_API_KEY ||= "sk-test-key-for-validation";
process.env.CORS_ORIGIN ||= "http://localhost:3000";
process.env.DATABASE_URL ||= "postgresql://test:test@localhost:5432/test";

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

// Mock both possible paths to database module
jest.mock('./src/lib/database', () => mockDatabase);
jest.mock('./lib/database', () => mockDatabase);

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
  COOKIE_NAME: 'slimy_admin',
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
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  })),
  logError: jest.fn(),
}));

// Mock slimy-core to avoid missing lib dependencies
jest.mock('@slimy/core', () => ({
  parsePower: jest.fn((str) => parseInt(str) || 0),
  classifyPage: jest.fn(() => ({ type: 'unknown' })),
  canonicalize: jest.fn((data) => data),
  pushLatest: jest.fn(() => Promise.resolve()),
  testSheetAccess: jest.fn(() => Promise.resolve(true)),
}));

// Mock @slimy/core to avoid vendor dependency issues
jest.mock('@slimy/core', () => ({
  parseNumber: jest.fn((val) => {
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
  }),
  formatNumber: jest.fn((val) => String(val)),
}));

// Mock lib files to avoid monorepo root dependencies
jest.mock('./lib/week-anchor', () => ({
  weekStart: jest.fn(() => new Date('2025-01-01')),
  getCurrentWeek: jest.fn(() => 1),
}));

jest.mock('./lib/club-corrections', () => ({}));
jest.mock('./lib/club-vision', () => ({}));

// Mock cache middleware to avoid Redis/config dependencies
jest.mock('./src/middleware/cache', () => ({
  cache: jest.fn(() => (req, res, next) => next()),
}));
