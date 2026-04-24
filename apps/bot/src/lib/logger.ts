import pino from 'pino';
import { hostname } from 'os';
import { mkdirSync, existsSync } from 'fs';

const LOG_DIR = '/home/slimy/logs';
const LOG_FILE = `${LOG_DIR}/bot.log`;
const IS_PROD = process.env.NODE_ENV === 'production';

if (!existsSync(LOG_DIR)) {
  mkdirSync(LOG_DIR, { recursive: true });
}

const fileDest = pino.destination({ dest: LOG_FILE, sync: false, mkdir: true });

const baseOpts: pino.LoggerOptions = {
  level: IS_PROD ? 'info' : 'debug',
  base: { service: 'slimy-bot', pid: process.pid, hostname: hostname() },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level(label) {
      return { level: label };
    },
  },
};

const pinoInstance = IS_PROD
  ? pino(baseOpts, fileDest)
  : pino(baseOpts, pino.transport({ target: 'pino-pretty', options: { colorize: true } }));

export interface LogContext {
  context?: string;
  guildId?: string;
  userId?: string;
  channelId?: string;
  [key: string]: string | number | boolean | undefined;
}

export function logInfo(message: string, context?: LogContext): void {
  pinoInstance.info({ msg: message, ...context });
}

export function logWarn(message: string, context?: LogContext): void {
  pinoInstance.warn({ msg: message, ...context });
}

export function logError(message: string, error?: Error, context?: LogContext): void {
  const merged: Record<string, unknown> = { ...context };
  if (error) {
    merged.err = { message: error.message, stack: error.stack };
  }
  pinoInstance.error({ msg: message, ...merged });
}

export function logDebug(message: string, context?: LogContext): void {
  pinoInstance.debug({ msg: message, ...context });
}

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

export default pinoInstance;
