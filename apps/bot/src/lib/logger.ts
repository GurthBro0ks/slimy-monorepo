/**
 * Centralized logging utility for the Discord bot
 * Wraps console methods with structured logging capabilities
 */

export interface LogContext {
  context?: string;
  guildId?: string;
  userId?: string;
  channelId?: string;
  [key: string]: string | number | boolean | undefined;
}

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

/**
 * Formats a log message with timestamp, level, and optional context
 */
function formatLog(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const parts = [`[${timestamp}]`, `[${level}]`, message];

  if (context) {
    const contextStr = Object.entries(context)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key}=${value}`)
      .join(' ');

    if (contextStr) {
      parts.push(`{${contextStr}}`);
    }
  }

  return parts.join(' ');
}

/**
 * Log an informational message
 */
export function logInfo(message: string, context?: LogContext): void {
  console.log(formatLog('INFO', message, context));
}

/**
 * Log a warning message
 */
export function logWarn(message: string, context?: LogContext): void {
  console.warn(formatLog('WARN', message, context));
}

/**
 * Log an error message
 */
export function logError(message: string, error?: Error, context?: LogContext): void {
  const errorContext = error ? {
    ...context,
    error: error.message,
    stack: error.stack?.split('\n')[0] || 'N/A',
  } : context;

  console.error(formatLog('ERROR', message, errorContext));

  // Log full stack trace separately for easier debugging
  if (error?.stack) {
    console.error(error.stack);
  }
}

/**
 * Log a debug message (only in development)
 */
export function logDebug(message: string, context?: LogContext): void {
  if (process.env.NODE_ENV !== 'production') {
    console.debug(formatLog('DEBUG', message, context));
  }
}

/**
 * Create a child logger with default context
 */
export function createLogger(defaultContext: LogContext) {
  return {
    info: (message: string, context?: LogContext) =>
      logInfo(message, { ...defaultContext, ...context }),
    warn: (message: string, context?: LogContext) =>
      logWarn(message, { ...defaultContext, ...context }),
    error: (message: string, error?: Error, context?: LogContext) =>
      logError(message, error, { ...defaultContext, ...context }),
    debug: (message: string, context?: LogContext) =>
      logDebug(message, { ...defaultContext, ...context }),
  };
}
