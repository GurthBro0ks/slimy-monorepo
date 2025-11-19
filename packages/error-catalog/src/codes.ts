/**
 * Slimy.ai Error Code Catalog
 *
 * Centralized error codes and metadata for all Slimy.ai services.
 * This catalog provides a type-safe way to work with error codes and
 * retrieve associated metadata.
 *
 * @module error-catalog
 * @version 1.0.0
 */

/**
 * Error code metadata structure
 */
export interface ErrorCodeInfo {
  /** Unique error code identifier (e.g., SLIMY_AUTH_001) */
  code: string;
  /** Short descriptive title */
  title: string;
  /** Detailed description of when this error occurs */
  description: string;
  /** Recommended HTTP status code */
  httpStatus: number;
  /** User-facing error message (safe to display to end users) */
  userMessage: string;
  /** Whether this error contains internal details that should not be exposed */
  internal: boolean;
  /** Service domain (AUTH, DISCORD, SNAIL, etc.) */
  domain: ErrorDomain;
}

/**
 * Service domains for error categorization
 */
export enum ErrorDomain {
  AUTH = 'AUTH',
  DISCORD = 'DISCORD',
  SNAIL = 'SNAIL',
  MINECRAFT = 'MINECRAFT',
  INFRA = 'INFRA',
  WEB = 'WEB',
  CHAT = 'CHAT',
}

/**
 * Error code enumeration for type safety
 */
export enum ErrorCode {
  // Authentication & Authorization (AUTH)
  SLIMY_AUTH_001 = 'SLIMY_AUTH_001',
  SLIMY_AUTH_002 = 'SLIMY_AUTH_002',
  SLIMY_AUTH_003 = 'SLIMY_AUTH_003',
  SLIMY_AUTH_004 = 'SLIMY_AUTH_004',
  SLIMY_AUTH_005 = 'SLIMY_AUTH_005',
  SLIMY_AUTH_006 = 'SLIMY_AUTH_006',
  SLIMY_AUTH_007 = 'SLIMY_AUTH_007',
  SLIMY_AUTH_008 = 'SLIMY_AUTH_008',
  SLIMY_AUTH_009 = 'SLIMY_AUTH_009',
  SLIMY_AUTH_010 = 'SLIMY_AUTH_010',

  // Discord Integration (DISCORD)
  SLIMY_DISCORD_001 = 'SLIMY_DISCORD_001',
  SLIMY_DISCORD_002 = 'SLIMY_DISCORD_002',
  SLIMY_DISCORD_003 = 'SLIMY_DISCORD_003',
  SLIMY_DISCORD_004 = 'SLIMY_DISCORD_004',
  SLIMY_DISCORD_005 = 'SLIMY_DISCORD_005',
  SLIMY_DISCORD_006 = 'SLIMY_DISCORD_006',
  SLIMY_DISCORD_007 = 'SLIMY_DISCORD_007',
  SLIMY_DISCORD_008 = 'SLIMY_DISCORD_008',
  SLIMY_DISCORD_009 = 'SLIMY_DISCORD_009',
  SLIMY_DISCORD_010 = 'SLIMY_DISCORD_010',
  SLIMY_DISCORD_011 = 'SLIMY_DISCORD_011',
  SLIMY_DISCORD_012 = 'SLIMY_DISCORD_012',

  // Snail Tools (SNAIL)
  SLIMY_SNAIL_001 = 'SLIMY_SNAIL_001',
  SLIMY_SNAIL_002 = 'SLIMY_SNAIL_002',
  SLIMY_SNAIL_003 = 'SLIMY_SNAIL_003',
  SLIMY_SNAIL_004 = 'SLIMY_SNAIL_004',
  SLIMY_SNAIL_005 = 'SLIMY_SNAIL_005',
  SLIMY_SNAIL_006 = 'SLIMY_SNAIL_006',
  SLIMY_SNAIL_007 = 'SLIMY_SNAIL_007',
  SLIMY_SNAIL_008 = 'SLIMY_SNAIL_008',

  // Minecraft Integration (MINECRAFT)
  SLIMY_MINECRAFT_001 = 'SLIMY_MINECRAFT_001',
  SLIMY_MINECRAFT_002 = 'SLIMY_MINECRAFT_002',
  SLIMY_MINECRAFT_003 = 'SLIMY_MINECRAFT_003',
  SLIMY_MINECRAFT_004 = 'SLIMY_MINECRAFT_004',
  SLIMY_MINECRAFT_005 = 'SLIMY_MINECRAFT_005',
  SLIMY_MINECRAFT_006 = 'SLIMY_MINECRAFT_006',
  SLIMY_MINECRAFT_007 = 'SLIMY_MINECRAFT_007',
  SLIMY_MINECRAFT_008 = 'SLIMY_MINECRAFT_008',
  SLIMY_MINECRAFT_009 = 'SLIMY_MINECRAFT_009',
  SLIMY_MINECRAFT_010 = 'SLIMY_MINECRAFT_010',

  // Infrastructure (INFRA)
  SLIMY_INFRA_001 = 'SLIMY_INFRA_001',
  SLIMY_INFRA_002 = 'SLIMY_INFRA_002',
  SLIMY_INFRA_003 = 'SLIMY_INFRA_003',
  SLIMY_INFRA_004 = 'SLIMY_INFRA_004',
  SLIMY_INFRA_005 = 'SLIMY_INFRA_005',
  SLIMY_INFRA_006 = 'SLIMY_INFRA_006',
  SLIMY_INFRA_007 = 'SLIMY_INFRA_007',
  SLIMY_INFRA_008 = 'SLIMY_INFRA_008',
  SLIMY_INFRA_009 = 'SLIMY_INFRA_009',
  SLIMY_INFRA_010 = 'SLIMY_INFRA_010',
  SLIMY_INFRA_011 = 'SLIMY_INFRA_011',
  SLIMY_INFRA_012 = 'SLIMY_INFRA_012',

  // Web Application (WEB)
  SLIMY_WEB_001 = 'SLIMY_WEB_001',
  SLIMY_WEB_002 = 'SLIMY_WEB_002',
  SLIMY_WEB_003 = 'SLIMY_WEB_003',
  SLIMY_WEB_004 = 'SLIMY_WEB_004',
  SLIMY_WEB_005 = 'SLIMY_WEB_005',
  SLIMY_WEB_006 = 'SLIMY_WEB_006',
  SLIMY_WEB_007 = 'SLIMY_WEB_007',
  SLIMY_WEB_008 = 'SLIMY_WEB_008',
  SLIMY_WEB_009 = 'SLIMY_WEB_009',
  SLIMY_WEB_010 = 'SLIMY_WEB_010',

  // Chat/AI (CHAT)
  SLIMY_CHAT_001 = 'SLIMY_CHAT_001',
  SLIMY_CHAT_002 = 'SLIMY_CHAT_002',
  SLIMY_CHAT_003 = 'SLIMY_CHAT_003',
  SLIMY_CHAT_004 = 'SLIMY_CHAT_004',
  SLIMY_CHAT_005 = 'SLIMY_CHAT_005',
  SLIMY_CHAT_006 = 'SLIMY_CHAT_006',
  SLIMY_CHAT_007 = 'SLIMY_CHAT_007',
  SLIMY_CHAT_008 = 'SLIMY_CHAT_008',
  SLIMY_CHAT_009 = 'SLIMY_CHAT_009',
  SLIMY_CHAT_010 = 'SLIMY_CHAT_010',
}

/**
 * Complete error code catalog with all metadata
 */
export const ERROR_CATALOG: Record<ErrorCode, ErrorCodeInfo> = {
  // AUTH Domain
  [ErrorCode.SLIMY_AUTH_001]: {
    code: ErrorCode.SLIMY_AUTH_001,
    title: 'Missing Authentication Token',
    description: 'Request lacks required authentication credentials (session cookie, bearer token, or API key)',
    httpStatus: 401,
    userMessage: 'Authentication required. Please log in to continue.',
    internal: false,
    domain: ErrorDomain.AUTH,
  },
  [ErrorCode.SLIMY_AUTH_002]: {
    code: ErrorCode.SLIMY_AUTH_002,
    title: 'Invalid Authentication Token',
    description: 'Provided authentication token is malformed or cryptographically invalid',
    httpStatus: 401,
    userMessage: 'Invalid authentication credentials. Please log in again.',
    internal: false,
    domain: ErrorDomain.AUTH,
  },
  [ErrorCode.SLIMY_AUTH_003]: {
    code: ErrorCode.SLIMY_AUTH_003,
    title: 'Expired Authentication Token',
    description: 'Authentication token has passed its expiration time',
    httpStatus: 401,
    userMessage: 'Your session has expired. Please log in again.',
    internal: false,
    domain: ErrorDomain.AUTH,
  },
  [ErrorCode.SLIMY_AUTH_004]: {
    code: ErrorCode.SLIMY_AUTH_004,
    title: 'Insufficient Permissions',
    description: 'User lacks required role or permission for the requested operation',
    httpStatus: 403,
    userMessage: "You don't have permission to perform this action.",
    internal: false,
    domain: ErrorDomain.AUTH,
  },
  [ErrorCode.SLIMY_AUTH_005]: {
    code: ErrorCode.SLIMY_AUTH_005,
    title: 'Discord OAuth Failed',
    description: 'Discord OAuth flow failed (invalid code, network error, or Discord API unavailable)',
    httpStatus: 502,
    userMessage: 'Failed to authenticate with Discord. Please try again.',
    internal: false,
    domain: ErrorDomain.AUTH,
  },
  [ErrorCode.SLIMY_AUTH_006]: {
    code: ErrorCode.SLIMY_AUTH_006,
    title: 'Session Creation Failed',
    description: 'Unable to create user session (database error, Redis unavailable)',
    httpStatus: 500,
    userMessage: 'Unable to establish session. Please try again.',
    internal: true,
    domain: ErrorDomain.AUTH,
  },
  [ErrorCode.SLIMY_AUTH_007]: {
    code: ErrorCode.SLIMY_AUTH_007,
    title: 'Invalid OAuth State',
    description: 'OAuth state parameter mismatch (potential CSRF attack or session issue)',
    httpStatus: 400,
    userMessage: 'Authentication request invalid. Please try logging in again.',
    internal: false,
    domain: ErrorDomain.AUTH,
  },
  [ErrorCode.SLIMY_AUTH_008]: {
    code: ErrorCode.SLIMY_AUTH_008,
    title: 'Account Suspended',
    description: 'User account has been suspended by an administrator',
    httpStatus: 403,
    userMessage: 'Your account has been suspended. Contact support for assistance.',
    internal: false,
    domain: ErrorDomain.AUTH,
  },
  [ErrorCode.SLIMY_AUTH_009]: {
    code: ErrorCode.SLIMY_AUTH_009,
    title: 'Invalid API Key',
    description: 'Provided API key is invalid or has been revoked',
    httpStatus: 401,
    userMessage: 'Invalid API key. Please check your credentials.',
    internal: false,
    domain: ErrorDomain.AUTH,
  },
  [ErrorCode.SLIMY_AUTH_010]: {
    code: ErrorCode.SLIMY_AUTH_010,
    title: 'Rate Limited - Authentication',
    description: 'Too many authentication attempts from this IP or user',
    httpStatus: 429,
    userMessage: 'Too many login attempts. Please try again later.',
    internal: false,
    domain: ErrorDomain.AUTH,
  },

  // DISCORD Domain
  [ErrorCode.SLIMY_DISCORD_001]: {
    code: ErrorCode.SLIMY_DISCORD_001,
    title: 'Guild Not Found',
    description: 'Requested Discord guild/server does not exist or bot is not a member',
    httpStatus: 404,
    userMessage: 'Server not found or bot not connected.',
    internal: false,
    domain: ErrorDomain.DISCORD,
  },
  [ErrorCode.SLIMY_DISCORD_002]: {
    code: ErrorCode.SLIMY_DISCORD_002,
    title: 'Member Not Found',
    description: 'Discord user is not a member of the specified guild',
    httpStatus: 404,
    userMessage: 'User not found in this server.',
    internal: false,
    domain: ErrorDomain.DISCORD,
  },
  [ErrorCode.SLIMY_DISCORD_003]: {
    code: ErrorCode.SLIMY_DISCORD_003,
    title: 'Discord API Rate Limited',
    description: 'Discord API rate limit exceeded',
    httpStatus: 429,
    userMessage: 'Discord service is busy. Please try again in a moment.',
    internal: false,
    domain: ErrorDomain.DISCORD,
  },
  [ErrorCode.SLIMY_DISCORD_004]: {
    code: ErrorCode.SLIMY_DISCORD_004,
    title: 'Insufficient Bot Permissions',
    description: 'Bot lacks required Discord permissions for the operation',
    httpStatus: 403,
    userMessage: 'Bot lacks necessary permissions. Contact server administrator.',
    internal: false,
    domain: ErrorDomain.DISCORD,
  },
  [ErrorCode.SLIMY_DISCORD_005]: {
    code: ErrorCode.SLIMY_DISCORD_005,
    title: 'Discord API Unavailable',
    description: 'Discord API is unreachable or returning errors',
    httpStatus: 502,
    userMessage: 'Discord service temporarily unavailable. Please try again later.',
    internal: false,
    domain: ErrorDomain.DISCORD,
  },
  [ErrorCode.SLIMY_DISCORD_006]: {
    code: ErrorCode.SLIMY_DISCORD_006,
    title: 'Invalid Discord ID',
    description: 'Provided Discord ID (guild, user, channel) is malformed',
    httpStatus: 400,
    userMessage: 'Invalid Discord ID format.',
    internal: false,
    domain: ErrorDomain.DISCORD,
  },
  [ErrorCode.SLIMY_DISCORD_007]: {
    code: ErrorCode.SLIMY_DISCORD_007,
    title: 'Channel Not Found',
    description: 'Specified Discord channel does not exist or bot cannot access it',
    httpStatus: 404,
    userMessage: 'Channel not found or inaccessible.',
    internal: false,
    domain: ErrorDomain.DISCORD,
  },
  [ErrorCode.SLIMY_DISCORD_008]: {
    code: ErrorCode.SLIMY_DISCORD_008,
    title: 'Role Not Found',
    description: 'Specified Discord role does not exist in the guild',
    httpStatus: 404,
    userMessage: 'Role not found in this server.',
    internal: false,
    domain: ErrorDomain.DISCORD,
  },
  [ErrorCode.SLIMY_DISCORD_009]: {
    code: ErrorCode.SLIMY_DISCORD_009,
    title: 'Webhook Creation Failed',
    description: 'Failed to create Discord webhook for notifications',
    httpStatus: 500,
    userMessage: 'Failed to set up Discord notifications.',
    internal: true,
    domain: ErrorDomain.DISCORD,
  },
  [ErrorCode.SLIMY_DISCORD_010]: {
    code: ErrorCode.SLIMY_DISCORD_010,
    title: 'Message Send Failed',
    description: 'Failed to send message to Discord channel',
    httpStatus: 500,
    userMessage: 'Failed to send Discord message.',
    internal: true,
    domain: ErrorDomain.DISCORD,
  },
  [ErrorCode.SLIMY_DISCORD_011]: {
    code: ErrorCode.SLIMY_DISCORD_011,
    title: 'Guild Sync Failed',
    description: 'Failed to synchronize guild data from Discord API',
    httpStatus: 502,
    userMessage: 'Failed to sync server data. Please try again.',
    internal: false,
    domain: ErrorDomain.DISCORD,
  },
  [ErrorCode.SLIMY_DISCORD_012]: {
    code: ErrorCode.SLIMY_DISCORD_012,
    title: 'Interaction Failed',
    description: 'Discord slash command or button interaction failed',
    httpStatus: 500,
    userMessage: 'Discord interaction failed. Please try again.',
    internal: true,
    domain: ErrorDomain.DISCORD,
  },

  // SNAIL Domain
  [ErrorCode.SLIMY_SNAIL_001]: {
    code: ErrorCode.SLIMY_SNAIL_001,
    title: 'Snail Event Not Found',
    description: 'Requested snail event does not exist',
    httpStatus: 404,
    userMessage: 'Snail event not found.',
    internal: false,
    domain: ErrorDomain.SNAIL,
  },
  [ErrorCode.SLIMY_SNAIL_002]: {
    code: ErrorCode.SLIMY_SNAIL_002,
    title: 'Invalid Snail Action',
    description: 'Attempted snail action is invalid or not allowed in current state',
    httpStatus: 400,
    userMessage: 'Invalid snail action.',
    internal: false,
    domain: ErrorDomain.SNAIL,
  },
  [ErrorCode.SLIMY_SNAIL_003]: {
    code: ErrorCode.SLIMY_SNAIL_003,
    title: 'Snail History Fetch Failed',
    description: 'Failed to retrieve snail event history from storage',
    httpStatus: 500,
    userMessage: 'Failed to load snail history. Please try again.',
    internal: true,
    domain: ErrorDomain.SNAIL,
  },
  [ErrorCode.SLIMY_SNAIL_004]: {
    code: ErrorCode.SLIMY_SNAIL_004,
    title: 'Snail Limit Exceeded',
    description: 'User has exceeded maximum number of concurrent snail operations',
    httpStatus: 429,
    userMessage: 'Too many active snail operations. Please wait for some to complete.',
    internal: false,
    domain: ErrorDomain.SNAIL,
  },
  [ErrorCode.SLIMY_SNAIL_005]: {
    code: ErrorCode.SLIMY_SNAIL_005,
    title: 'Snail State Invalid',
    description: 'Snail is in an invalid state for the requested operation',
    httpStatus: 409,
    userMessage: 'Snail cannot perform this action in its current state.',
    internal: false,
    domain: ErrorDomain.SNAIL,
  },
  [ErrorCode.SLIMY_SNAIL_006]: {
    code: ErrorCode.SLIMY_SNAIL_006,
    title: 'Snail Configuration Error',
    description: 'Snail tool configuration is invalid or missing',
    httpStatus: 500,
    userMessage: 'Snail tool misconfigured. Contact support.',
    internal: true,
    domain: ErrorDomain.SNAIL,
  },
  [ErrorCode.SLIMY_SNAIL_007]: {
    code: ErrorCode.SLIMY_SNAIL_007,
    title: 'Snail Event Creation Failed',
    description: 'Failed to create new snail event in database',
    httpStatus: 500,
    userMessage: 'Failed to create snail event. Please try again.',
    internal: true,
    domain: ErrorDomain.SNAIL,
  },
  [ErrorCode.SLIMY_SNAIL_008]: {
    code: ErrorCode.SLIMY_SNAIL_008,
    title: 'Snail User Not Authorized',
    description: 'User not authorized to perform snail operations',
    httpStatus: 403,
    userMessage: "You don't have access to snail tools.",
    internal: false,
    domain: ErrorDomain.SNAIL,
  },

  // MINECRAFT Domain
  [ErrorCode.SLIMY_MINECRAFT_001]: {
    code: ErrorCode.SLIMY_MINECRAFT_001,
    title: 'Server Not Found',
    description: 'Minecraft server not found in database or unavailable',
    httpStatus: 404,
    userMessage: 'Minecraft server not found.',
    internal: false,
    domain: ErrorDomain.MINECRAFT,
  },
  [ErrorCode.SLIMY_MINECRAFT_002]: {
    code: ErrorCode.SLIMY_MINECRAFT_002,
    title: 'Server Connection Failed',
    description: 'Cannot establish connection to Minecraft server',
    httpStatus: 502,
    userMessage: 'Unable to connect to Minecraft server.',
    internal: false,
    domain: ErrorDomain.MINECRAFT,
  },
  [ErrorCode.SLIMY_MINECRAFT_003]: {
    code: ErrorCode.SLIMY_MINECRAFT_003,
    title: 'Player Not Found',
    description: 'Minecraft player not found on server or in database',
    httpStatus: 404,
    userMessage: 'Player not found.',
    internal: false,
    domain: ErrorDomain.MINECRAFT,
  },
  [ErrorCode.SLIMY_MINECRAFT_004]: {
    code: ErrorCode.SLIMY_MINECRAFT_004,
    title: 'RCON Authentication Failed',
    description: 'Failed to authenticate with Minecraft server RCON',
    httpStatus: 401,
    userMessage: 'Failed to authenticate with Minecraft server.',
    internal: true,
    domain: ErrorDomain.MINECRAFT,
  },
  [ErrorCode.SLIMY_MINECRAFT_005]: {
    code: ErrorCode.SLIMY_MINECRAFT_005,
    title: 'Command Execution Failed',
    description: 'Minecraft server command execution failed',
    httpStatus: 500,
    userMessage: 'Failed to execute server command.',
    internal: true,
    domain: ErrorDomain.MINECRAFT,
  },
  [ErrorCode.SLIMY_MINECRAFT_006]: {
    code: ErrorCode.SLIMY_MINECRAFT_006,
    title: 'Server Offline',
    description: 'Minecraft server is offline or not responding',
    httpStatus: 503,
    userMessage: 'Minecraft server is currently offline.',
    internal: false,
    domain: ErrorDomain.MINECRAFT,
  },
  [ErrorCode.SLIMY_MINECRAFT_007]: {
    code: ErrorCode.SLIMY_MINECRAFT_007,
    title: 'Invalid Minecraft Username',
    description: 'Provided Minecraft username format is invalid',
    httpStatus: 400,
    userMessage: 'Invalid Minecraft username.',
    internal: false,
    domain: ErrorDomain.MINECRAFT,
  },
  [ErrorCode.SLIMY_MINECRAFT_008]: {
    code: ErrorCode.SLIMY_MINECRAFT_008,
    title: 'Whitelist Operation Failed',
    description: 'Failed to add/remove player from server whitelist',
    httpStatus: 500,
    userMessage: 'Failed to update server whitelist.',
    internal: true,
    domain: ErrorDomain.MINECRAFT,
  },
  [ErrorCode.SLIMY_MINECRAFT_009]: {
    code: ErrorCode.SLIMY_MINECRAFT_009,
    title: 'Server Full',
    description: 'Minecraft server has reached maximum player capacity',
    httpStatus: 503,
    userMessage: 'Server is full. Please try again later.',
    internal: false,
    domain: ErrorDomain.MINECRAFT,
  },
  [ErrorCode.SLIMY_MINECRAFT_010]: {
    code: ErrorCode.SLIMY_MINECRAFT_010,
    title: 'World Data Unavailable',
    description: 'Unable to retrieve Minecraft world data',
    httpStatus: 500,
    userMessage: 'Failed to load world data.',
    internal: true,
    domain: ErrorDomain.MINECRAFT,
  },

  // INFRA Domain
  [ErrorCode.SLIMY_INFRA_001]: {
    code: ErrorCode.SLIMY_INFRA_001,
    title: 'Database Connection Failed',
    description: 'Cannot establish connection to database',
    httpStatus: 503,
    userMessage: 'Service temporarily unavailable. Please try again later.',
    internal: true,
    domain: ErrorDomain.INFRA,
  },
  [ErrorCode.SLIMY_INFRA_002]: {
    code: ErrorCode.SLIMY_INFRA_002,
    title: 'Database Query Failed',
    description: 'Database query execution failed',
    httpStatus: 500,
    userMessage: 'An error occurred. Please try again.',
    internal: true,
    domain: ErrorDomain.INFRA,
  },
  [ErrorCode.SLIMY_INFRA_003]: {
    code: ErrorCode.SLIMY_INFRA_003,
    title: 'Redis Connection Failed',
    description: 'Cannot establish connection to Redis cache',
    httpStatus: 503,
    userMessage: 'Service temporarily unavailable. Please try again later.',
    internal: true,
    domain: ErrorDomain.INFRA,
  },
  [ErrorCode.SLIMY_INFRA_004]: {
    code: ErrorCode.SLIMY_INFRA_004,
    title: 'Cache Read Failed',
    description: 'Failed to read data from cache',
    httpStatus: 500,
    userMessage: 'An error occurred. Please try again.',
    internal: true,
    domain: ErrorDomain.INFRA,
  },
  [ErrorCode.SLIMY_INFRA_005]: {
    code: ErrorCode.SLIMY_INFRA_005,
    title: 'Cache Write Failed',
    description: 'Failed to write data to cache',
    httpStatus: 500,
    userMessage: 'An error occurred. Please try again.',
    internal: true,
    domain: ErrorDomain.INFRA,
  },
  [ErrorCode.SLIMY_INFRA_006]: {
    code: ErrorCode.SLIMY_INFRA_006,
    title: 'Configuration Missing',
    description: 'Required environment variable or configuration value is missing',
    httpStatus: 500,
    userMessage: 'Service misconfigured. Contact support.',
    internal: true,
    domain: ErrorDomain.INFRA,
  },
  [ErrorCode.SLIMY_INFRA_007]: {
    code: ErrorCode.SLIMY_INFRA_007,
    title: 'Rate Limit Exceeded - Global',
    description: 'Global rate limit exceeded for this endpoint',
    httpStatus: 429,
    userMessage: 'Too many requests. Please slow down and try again later.',
    internal: false,
    domain: ErrorDomain.INFRA,
  },
  [ErrorCode.SLIMY_INFRA_008]: {
    code: ErrorCode.SLIMY_INFRA_008,
    title: 'External API Unavailable',
    description: 'External API dependency is unavailable',
    httpStatus: 502,
    userMessage: 'External service unavailable. Please try again later.',
    internal: false,
    domain: ErrorDomain.INFRA,
  },
  [ErrorCode.SLIMY_INFRA_009]: {
    code: ErrorCode.SLIMY_INFRA_009,
    title: 'Network Timeout',
    description: 'Network request timed out',
    httpStatus: 504,
    userMessage: 'Request timed out. Please try again.',
    internal: false,
    domain: ErrorDomain.INFRA,
  },
  [ErrorCode.SLIMY_INFRA_010]: {
    code: ErrorCode.SLIMY_INFRA_010,
    title: 'Storage Full',
    description: 'Storage capacity exceeded',
    httpStatus: 507,
    userMessage: 'Storage capacity reached. Contact support.',
    internal: true,
    domain: ErrorDomain.INFRA,
  },
  [ErrorCode.SLIMY_INFRA_011]: {
    code: ErrorCode.SLIMY_INFRA_011,
    title: 'Migration Pending',
    description: 'Database migration is pending or in progress',
    httpStatus: 503,
    userMessage: 'Service maintenance in progress. Please try again later.',
    internal: true,
    domain: ErrorDomain.INFRA,
  },
  [ErrorCode.SLIMY_INFRA_012]: {
    code: ErrorCode.SLIMY_INFRA_012,
    title: 'Health Check Failed',
    description: 'Service health check failed',
    httpStatus: 503,
    userMessage: 'Service temporarily unavailable.',
    internal: true,
    domain: ErrorDomain.INFRA,
  },

  // WEB Domain
  [ErrorCode.SLIMY_WEB_001]: {
    code: ErrorCode.SLIMY_WEB_001,
    title: 'Resource Not Found',
    description: 'Requested web resource does not exist',
    httpStatus: 404,
    userMessage: 'Page not found.',
    internal: false,
    domain: ErrorDomain.WEB,
  },
  [ErrorCode.SLIMY_WEB_002]: {
    code: ErrorCode.SLIMY_WEB_002,
    title: 'Validation Failed',
    description: 'Form or request validation failed',
    httpStatus: 400,
    userMessage: 'Please check your input and try again.',
    internal: false,
    domain: ErrorDomain.WEB,
  },
  [ErrorCode.SLIMY_WEB_003]: {
    code: ErrorCode.SLIMY_WEB_003,
    title: 'File Upload Failed',
    description: 'File upload operation failed',
    httpStatus: 500,
    userMessage: 'Failed to upload file. Please try again.',
    internal: true,
    domain: ErrorDomain.WEB,
  },
  [ErrorCode.SLIMY_WEB_004]: {
    code: ErrorCode.SLIMY_WEB_004,
    title: 'File Too Large',
    description: 'Uploaded file exceeds size limit',
    httpStatus: 413,
    userMessage: 'File is too large. Maximum size is {limit}.',
    internal: false,
    domain: ErrorDomain.WEB,
  },
  [ErrorCode.SLIMY_WEB_005]: {
    code: ErrorCode.SLIMY_WEB_005,
    title: 'Invalid File Type',
    description: 'Uploaded file type is not allowed',
    httpStatus: 400,
    userMessage: 'File type not supported. Allowed types: {types}.',
    internal: false,
    domain: ErrorDomain.WEB,
  },
  [ErrorCode.SLIMY_WEB_006]: {
    code: ErrorCode.SLIMY_WEB_006,
    title: 'Session Expired',
    description: 'User session has expired',
    httpStatus: 401,
    userMessage: 'Your session has expired. Please refresh the page.',
    internal: false,
    domain: ErrorDomain.WEB,
  },
  [ErrorCode.SLIMY_WEB_007]: {
    code: ErrorCode.SLIMY_WEB_007,
    title: 'CSRF Token Invalid',
    description: 'CSRF token validation failed',
    httpStatus: 403,
    userMessage: 'Security validation failed. Please refresh and try again.',
    internal: false,
    domain: ErrorDomain.WEB,
  },
  [ErrorCode.SLIMY_WEB_008]: {
    code: ErrorCode.SLIMY_WEB_008,
    title: 'Concurrent Modification',
    description: 'Resource was modified by another user',
    httpStatus: 409,
    userMessage: 'This item was modified by another user. Please refresh and try again.',
    internal: false,
    domain: ErrorDomain.WEB,
  },
  [ErrorCode.SLIMY_WEB_009]: {
    code: ErrorCode.SLIMY_WEB_009,
    title: 'SSR Hydration Failed',
    description: 'Server-side rendering hydration mismatch',
    httpStatus: 500,
    userMessage: 'Page loading error. Please refresh.',
    internal: true,
    domain: ErrorDomain.WEB,
  },
  [ErrorCode.SLIMY_WEB_010]: {
    code: ErrorCode.SLIMY_WEB_010,
    title: 'API Client Error',
    description: 'Internal API client request failed',
    httpStatus: 500,
    userMessage: 'An error occurred. Please try again.',
    internal: true,
    domain: ErrorDomain.WEB,
  },

  // CHAT Domain
  [ErrorCode.SLIMY_CHAT_001]: {
    code: ErrorCode.SLIMY_CHAT_001,
    title: 'Conversation Not Found',
    description: 'Requested chat conversation does not exist',
    httpStatus: 404,
    userMessage: 'Conversation not found.',
    internal: false,
    domain: ErrorDomain.CHAT,
  },
  [ErrorCode.SLIMY_CHAT_002]: {
    code: ErrorCode.SLIMY_CHAT_002,
    title: 'Message Send Failed',
    description: 'Failed to send chat message',
    httpStatus: 500,
    userMessage: 'Failed to send message. Please try again.',
    internal: true,
    domain: ErrorDomain.CHAT,
  },
  [ErrorCode.SLIMY_CHAT_003]: {
    code: ErrorCode.SLIMY_CHAT_003,
    title: 'AI Service Unavailable',
    description: 'AI/LLM service is unavailable or returning errors',
    httpStatus: 502,
    userMessage: 'AI service temporarily unavailable. Please try again later.',
    internal: false,
    domain: ErrorDomain.CHAT,
  },
  [ErrorCode.SLIMY_CHAT_004]: {
    code: ErrorCode.SLIMY_CHAT_004,
    title: 'Context Length Exceeded',
    description: 'Chat context exceeds maximum token limit',
    httpStatus: 400,
    userMessage: 'Conversation is too long. Please start a new conversation.',
    internal: false,
    domain: ErrorDomain.CHAT,
  },
  [ErrorCode.SLIMY_CHAT_005]: {
    code: ErrorCode.SLIMY_CHAT_005,
    title: 'Rate Limited - Chat',
    description: 'User has exceeded chat message rate limit',
    httpStatus: 429,
    userMessage: "You're sending messages too quickly. Please wait a moment.",
    internal: false,
    domain: ErrorDomain.CHAT,
  },
  [ErrorCode.SLIMY_CHAT_006]: {
    code: ErrorCode.SLIMY_CHAT_006,
    title: 'Content Filtered',
    description: 'Message content violated content policy',
    httpStatus: 400,
    userMessage: 'Message contains inappropriate content.',
    internal: false,
    domain: ErrorDomain.CHAT,
  },
  [ErrorCode.SLIMY_CHAT_007]: {
    code: ErrorCode.SLIMY_CHAT_007,
    title: 'Invalid Message Format',
    description: 'Chat message format is invalid',
    httpStatus: 400,
    userMessage: 'Invalid message format.',
    internal: false,
    domain: ErrorDomain.CHAT,
  },
  [ErrorCode.SLIMY_CHAT_008]: {
    code: ErrorCode.SLIMY_CHAT_008,
    title: 'AI Response Generation Failed',
    description: 'Failed to generate AI response',
    httpStatus: 500,
    userMessage: 'Failed to generate response. Please try again.',
    internal: true,
    domain: ErrorDomain.CHAT,
  },
  [ErrorCode.SLIMY_CHAT_009]: {
    code: ErrorCode.SLIMY_CHAT_009,
    title: 'Conversation Archived',
    description: 'Cannot modify archived conversation',
    httpStatus: 403,
    userMessage: 'This conversation has been archived and cannot be modified.',
    internal: false,
    domain: ErrorDomain.CHAT,
  },
  [ErrorCode.SLIMY_CHAT_010]: {
    code: ErrorCode.SLIMY_CHAT_010,
    title: 'Maximum Conversations Reached',
    description: 'User has reached maximum number of concurrent conversations',
    httpStatus: 429,
    userMessage: 'Maximum conversation limit reached. Please close some conversations.',
    internal: false,
    domain: ErrorDomain.CHAT,
  },
};

/**
 * Get error information by code
 *
 * @param code - Error code to lookup
 * @returns Error code information or undefined if not found
 *
 * @example
 * ```typescript
 * const errorInfo = getErrorInfo(ErrorCode.SLIMY_AUTH_001);
 * console.log(errorInfo.userMessage); // "Authentication required. Please log in to continue."
 * ```
 */
export function getErrorInfo(code: ErrorCode | string): ErrorCodeInfo | undefined {
  return ERROR_CATALOG[code as ErrorCode];
}

/**
 * Get all error codes for a specific domain
 *
 * @param domain - Error domain to filter by
 * @returns Array of error code information for the domain
 *
 * @example
 * ```typescript
 * const authErrors = getErrorsByDomain(ErrorDomain.AUTH);
 * console.log(authErrors.length); // 10
 * ```
 */
export function getErrorsByDomain(domain: ErrorDomain): ErrorCodeInfo[] {
  return Object.values(ERROR_CATALOG).filter(error => error.domain === domain);
}

/**
 * Get all error codes with a specific HTTP status
 *
 * @param httpStatus - HTTP status code to filter by
 * @returns Array of error code information matching the status
 *
 * @example
 * ```typescript
 * const notFoundErrors = getErrorsByHttpStatus(404);
 * ```
 */
export function getErrorsByHttpStatus(httpStatus: number): ErrorCodeInfo[] {
  return Object.values(ERROR_CATALOG).filter(error => error.httpStatus === httpStatus);
}

/**
 * Check if an error code exists in the catalog
 *
 * @param code - Error code to check
 * @returns True if the error code exists
 *
 * @example
 * ```typescript
 * if (isValidErrorCode('SLIMY_AUTH_001')) {
 *   // Handle known error
 * }
 * ```
 */
export function isValidErrorCode(code: string): code is ErrorCode {
  return code in ERROR_CATALOG;
}

/**
 * Format error message with dynamic values
 *
 * @param code - Error code
 * @param replacements - Object with replacement values for placeholders
 * @returns Formatted user message
 *
 * @example
 * ```typescript
 * const message = formatErrorMessage(ErrorCode.SLIMY_WEB_004, { limit: '10MB' });
 * // Returns: "File is too large. Maximum size is 10MB."
 * ```
 */
export function formatErrorMessage(
  code: ErrorCode | string,
  replacements?: Record<string, string>
): string {
  const errorInfo = getErrorInfo(code as ErrorCode);
  if (!errorInfo) {
    return 'An unknown error occurred.';
  }

  let message = errorInfo.userMessage;
  if (replacements) {
    Object.entries(replacements).forEach(([key, value]) => {
      message = message.replace(`{${key}}`, value);
    });
  }

  return message;
}

/**
 * Create a standardized error response object
 *
 * @param code - Error code
 * @param details - Optional additional error details (only included if error is not internal)
 * @returns Error response object
 *
 * @example
 * ```typescript
 * return NextResponse.json(
 *   createErrorResponse(ErrorCode.SLIMY_AUTH_001),
 *   { status: getErrorInfo(ErrorCode.SLIMY_AUTH_001).httpStatus }
 * );
 * ```
 */
export function createErrorResponse(
  code: ErrorCode | string,
  details?: unknown
): {
  ok: false;
  code: string;
  message: string;
  details?: unknown;
} {
  const errorInfo = getErrorInfo(code as ErrorCode);
  if (!errorInfo) {
    return {
      ok: false,
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred.',
    };
  }

  const response: {
    ok: false;
    code: string;
    message: string;
    details?: unknown;
  } = {
    ok: false,
    code: errorInfo.code,
    message: errorInfo.userMessage,
  };

  // Only include details if the error is not marked as internal
  if (!errorInfo.internal && details) {
    response.details = details;
  }

  return response;
}

/**
 * Get all error codes as an array
 *
 * @returns Array of all error codes
 */
export function getAllErrorCodes(): ErrorCode[] {
  return Object.values(ErrorCode);
}

/**
 * Get catalog statistics
 *
 * @returns Statistics about the error catalog
 */
export function getCatalogStats(): {
  total: number;
  byDomain: Record<ErrorDomain, number>;
  byHttpStatus: Record<number, number>;
  internal: number;
  public: number;
} {
  const errors = Object.values(ERROR_CATALOG);

  const byDomain = {} as Record<ErrorDomain, number>;
  const byHttpStatus: Record<number, number> = {};
  let internal = 0;
  let publicCount = 0;

  errors.forEach(error => {
    // Count by domain
    byDomain[error.domain] = (byDomain[error.domain] || 0) + 1;

    // Count by HTTP status
    byHttpStatus[error.httpStatus] = (byHttpStatus[error.httpStatus] || 0) + 1;

    // Count internal vs public
    if (error.internal) {
      internal++;
    } else {
      publicCount++;
    }
  });

  return {
    total: errors.length,
    byDomain,
    byHttpStatus,
    internal,
    public: publicCount,
  };
}
