/**
 * Structured Logging System
 *
 * Provides structured JSON logging with support for multiple transports,
 * log levels, and contextual information.
 *
 * NOTE: File logging is only available in Node.js environment.
 * In browser environment, only console logging is available.
 */

import type { LogLevel, LogEntry, JSONObject } from '../types/common';

// Check if we're in a Node.js environment
const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;

// Dynamically import Node.js modules only in Node.js environment
let writeFileSync: any, mkdirSync: any, existsSync: any, join: any;
if (isNode && typeof window === 'undefined') {
  try {
    const fs = require('fs');
    const path = require('path');
    writeFileSync = fs.writeFileSync;
    mkdirSync = fs.mkdirSync;
    existsSync = fs.existsSync;
    join = path.join;
  } catch (e) {
    // Node modules not available
  }
}

/**
 * Logger configuration
 */
interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  logDirectory: string;
  prettyPrint: boolean;
  includeTimestamp: boolean;
  includeStackTrace: boolean;
}

/**
 * Log transport interface
 */
interface LogTransport {
  log(entry: LogEntry): void | Promise<void>;
}

/**
 * Console transport
 */
class ConsoleTransport implements LogTransport {
  private prettyPrint: boolean;

  constructor(prettyPrint: boolean = false) {
    this.prettyPrint = prettyPrint;
  }

  log(entry: LogEntry): void {
    const color = this.getColor(entry.level);
    const reset = '\x1b[0m';

    if (this.prettyPrint) {
      console.log(
        `${color}[${entry.level.toUpperCase()}]${reset} ${entry.timestamp} ${entry.message}`
      );
      if (entry.context && Object.keys(entry.context).length > 0) {
        console.log('  Context:', JSON.stringify(entry.context, null, 2));
      }
      if (entry.error) {
        console.error('  Error:', entry.error);
      }
    } else {
      console.log(JSON.stringify(entry));
    }
  }

  private getColor(level: LogLevel): string {
    const colors = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m',  // Green
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m', // Red
      fatal: '\x1b[35m', // Magenta
    };
    return colors[level] || '';
  }
}

/**
 * File transport (JSONL format)
 * Only works in Node.js environment
 */
class FileTransport implements LogTransport {
  private logDirectory: string;

  constructor(logDirectory: string) {
    this.logDirectory = logDirectory;
    if (isNode && typeof window === 'undefined' && existsSync && mkdirSync) {
      this.ensureLogDirectory();
    }
  }

  private ensureLogDirectory(): void {
    if (!existsSync || !mkdirSync) return;
    if (!existsSync(this.logDirectory)) {
      mkdirSync(this.logDirectory, { recursive: true });
    }
  }

  private getLogFilePath(level: LogLevel): string {
    if (!join) return '';
    const date = new Date().toISOString().split('T')[0];
    return join(this.logDirectory, `${level}-${date}.jsonl`);
  }

  log(entry: LogEntry): void {
    // Only write to file in Node.js environment
    if (!isNode || typeof window !== 'undefined' || !writeFileSync) {
      return;
    }

    try {
      const logLine = JSON.stringify(entry) + '\n';
      const logFile = this.getLogFilePath(entry.level);
      if (logFile) {
        writeFileSync(logFile, logLine, { flag: 'a' });
      }
    } catch (error) {
      console.error('Failed to write log to file:', error);
    }
  }
}

/**
 * Structured Logger
 */
export class Logger {
  private config: LoggerConfig;
  private transports: LogTransport[];
  private context: JSONObject;

  constructor(config?: Partial<LoggerConfig>, initialContext?: JSONObject) {
    // Determine default values based on environment
    const isBrowser = typeof window !== 'undefined';
    const nodeEnv = typeof process !== 'undefined' ? process.env.NODE_ENV : 'development';
    const logLevel = typeof process !== 'undefined' ? (process.env.LOG_LEVEL as LogLevel) : 'info';

    this.config = {
      level: logLevel || 'info',
      enableConsole: true,
      // Only enable file logging in Node.js production environment
      enableFile: !isBrowser && isNode && nodeEnv === 'production',
      logDirectory: 'logs',
      prettyPrint: nodeEnv !== 'production',
      includeTimestamp: true,
      includeStackTrace: true,
      ...config,
    };

    this.context = initialContext || {};
    this.transports = this.initializeTransports();
  }

  private initializeTransports(): LogTransport[] {
    const transports: LogTransport[] = [];

    if (this.config.enableConsole) {
      transports.push(new ConsoleTransport(this.config.prettyPrint));
    }

    if (this.config.enableFile) {
      transports.push(new FileTransport(this.config.logDirectory));
    }

    return transports;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal'];
    const configLevel = levels.indexOf(this.config.level);
    const messageLevel = levels.indexOf(level);
    return messageLevel >= configLevel;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: JSONObject,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: { ...this.context, ...context },
    };

    if (error && this.config.includeStackTrace) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return entry;
  }

  private async writeLog(entry: LogEntry): Promise<void> {
    const promises = this.transports.map((transport) => transport.log(entry));
    await Promise.all(promises);
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: JSONObject): void {
    if (this.shouldLog('debug')) {
      const entry = this.createLogEntry('debug', message, context);
      this.writeLog(entry);
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: JSONObject): void {
    if (this.shouldLog('info')) {
      const entry = this.createLogEntry('info', message, context);
      this.writeLog(entry);
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: JSONObject): void {
    if (this.shouldLog('warn')) {
      const entry = this.createLogEntry('warn', message, context);
      this.writeLog(entry);
    }
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, context?: JSONObject): void {
    if (this.shouldLog('error')) {
      const entry = this.createLogEntry('error', message, context, error);
      this.writeLog(entry);
    }
  }

  /**
   * Log fatal message
   */
  fatal(message: string, error?: Error, context?: JSONObject): void {
    if (this.shouldLog('fatal')) {
      const entry = this.createLogEntry('fatal', message, context, error);
      this.writeLog(entry);
    }
  }

  /**
   * Create child logger with additional context
   */
  child(context: JSONObject): Logger {
    return new Logger(this.config, { ...this.context, ...context });
  }

  /**
   * Add persistent context to logger
   */
  addContext(context: JSONObject): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Clear context
   */
  clearContext(): void {
    this.context = {};
  }
}

// Singleton instance
let loggerInstance: Logger | null = null;

/**
 * Get logger instance
 */
export function getLogger(context?: JSONObject): Logger {
  if (!loggerInstance) {
    loggerInstance = new Logger();
  }

  if (context) {
    return loggerInstance.child(context);
  }

  return loggerInstance;
}

/**
 * Request logger middleware
 */
export function createRequestLogger() {
  return (request: Request) => {
    const logger = getLogger({
      requestId: crypto.randomUUID(),
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    });

    const startTime = Date.now();

    return {
      logger,
      logResponse: (status: number, error?: Error) => {
        const duration = Date.now() - startTime;

        if (error) {
          logger.error('Request failed', error, {
            status,
            duration,
          });
        } else if (status >= 400) {
          logger.warn('Request completed with error', {
            status,
            duration,
          });
        } else {
          logger.info('Request completed', {
            status,
            duration,
          });
        }
      },
    };
  };
}
