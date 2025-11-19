/**
 * @slimy/shared-logging
 *
 * A simple, structured logging utility for the slimy-monorepo.
 * Provides consistent log formatting across all services.
 *
 * Features:
 * - Structured log output with level, message, context, and timestamp
 * - Type-safe context metadata
 * - No global state or side effects
 * - Lightweight wrapper around console.*
 */

/**
 * Log level type
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Error context for structured error logging
 */
export interface ErrorContext {
  name: string;
  message: string;
  stack?: string;
  code?: string | number;
  [key: string]: any;
}

/**
 * Structured context for logs
 */
export interface LogContext {
  // Service identification
  service?: string;

  // Request correlation
  requestId?: string;
  correlationId?: string;

  // Entity identifiers
  userId?: string;
  guildId?: string;
  channelId?: string;
  messageId?: string;

  // Operation details
  operation?: string;
  duration?: number;

  // Error details
  error?: ErrorContext;

  // Additional metadata
  [key: string]: any;
}

/**
 * Structured log entry
 */
export interface LogEntry {
  level: LogLevel;
  msg: string;
  timestamp: string;
  context?: LogContext;
}

/**
 * Serializes an Error object to a plain object for logging
 */
function serializeError(error: Error | any): ErrorContext {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(('code' in error) && { code: (error as any).code })
    };
  }

  // Handle non-Error objects
  if (typeof error === 'object' && error !== null) {
    return {
      name: error.name || 'UnknownError',
      message: error.message || String(error),
      ...error
    };
  }

  // Handle primitive values
  return {
    name: 'UnknownError',
    message: String(error)
  };
}

/**
 * Creates a structured log entry
 */
function createLogEntry(
  level: LogLevel,
  msg: string,
  context?: LogContext
): LogEntry {
  return {
    level,
    msg,
    timestamp: new Date().toISOString(),
    ...(context && { context })
  };
}

/**
 * Formats a log entry for console output
 */
function formatLogEntry(entry: LogEntry): string {
  return JSON.stringify(entry);
}

/**
 * Writes a log entry to the appropriate console method
 */
function writeLog(entry: LogEntry): void {
  const formatted = formatLogEntry(entry);

  switch (entry.level) {
    case 'debug':
      console.debug(formatted);
      break;
    case 'info':
      console.info(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'error':
      console.error(formatted);
      break;
    default:
      console.log(formatted);
  }
}

/**
 * Logs a debug message
 *
 * @param msg - Human-readable message
 * @param context - Optional structured context
 *
 * @example
 * logDebug('User session loaded', {
 *   service: 'web',
 *   operation: 'session.load',
 *   userId: '12345'
 * });
 */
export function logDebug(msg: string, context?: LogContext): void {
  const entry = createLogEntry('debug', msg, context);
  writeLog(entry);
}

/**
 * Logs an info message
 *
 * @param msg - Human-readable message
 * @param context - Optional structured context
 *
 * @example
 * logInfo('API request completed', {
 *   service: 'admin-api',
 *   operation: 'stats.get',
 *   requestId: 'req-123',
 *   duration: 42
 * });
 */
export function logInfo(msg: string, context?: LogContext): void {
  const entry = createLogEntry('info', msg, context);
  writeLog(entry);
}

/**
 * Logs a warning message
 *
 * @param msg - Human-readable message
 * @param context - Optional structured context
 *
 * @example
 * logWarn('Rate limit approaching', {
 *   service: 'bot',
 *   operation: 'discord.api',
 *   remaining: 5,
 *   limit: 100
 * });
 */
export function logWarn(msg: string, context?: LogContext): void {
  const entry = createLogEntry('warn', msg, context);
  writeLog(entry);
}

/**
 * Logs an error message
 *
 * @param msg - Human-readable message
 * @param context - Optional structured context
 *
 * @example
 * // With an Error object
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   logError('Operation failed', {
 *     service: 'web',
 *     operation: 'data.fetch',
 *     error: serializeError(error)
 *   });
 * }
 *
 * // With custom error context
 * logError('Validation failed', {
 *   service: 'admin-api',
 *   operation: 'user.update',
 *   error: {
 *     name: 'ValidationError',
 *     message: 'Invalid email format',
 *     code: 'INVALID_EMAIL'
 *   }
 * });
 */
export function logError(msg: string, context?: LogContext): void {
  const entry = createLogEntry('error', msg, context);
  writeLog(entry);
}

/**
 * Creates a logger instance bound to a specific service and operation
 *
 * Useful for reducing repetition when logging multiple messages
 * for the same service/operation.
 *
 * @param baseContext - Context to include in all logs from this logger
 *
 * @example
 * const logger = createLogger({
 *   service: 'admin-api',
 *   operation: 'auth.login',
 *   requestId: 'req-456'
 * });
 *
 * logger.info('Login started');
 * logger.info('User authenticated', { userId: '12345' });
 * logger.error('Login failed', {
 *   error: {
 *     name: 'AuthError',
 *     message: 'Invalid credentials'
 *   }
 * });
 */
export function createLogger(baseContext: LogContext) {
  return {
    debug: (msg: string, context?: LogContext) =>
      logDebug(msg, { ...baseContext, ...context }),

    info: (msg: string, context?: LogContext) =>
      logInfo(msg, { ...baseContext, ...context }),

    warn: (msg: string, context?: LogContext) =>
      logWarn(msg, { ...baseContext, ...context }),

    error: (msg: string, context?: LogContext) =>
      logError(msg, { ...baseContext, ...context })
  };
}

/**
 * Re-export serializeError for convenience
 */
export { serializeError };

/**
 * Default export with all logging functions
 */
export default {
  debug: logDebug,
  info: logInfo,
  warn: logWarn,
  error: logError,
  createLogger,
  serializeError
};
