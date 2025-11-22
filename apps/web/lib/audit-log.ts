/**
 * Audit Logging System
 *
 * Provides functionality to log administrative actions for security and compliance
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { isProduction } from '@/lib/config';

/**
 * Audit log entry interface
 */
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  username?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  changes?: AuditChanges;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure';
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Audit action types
 */
export enum AuditAction {
  // Guild actions
  GUILD_CREATE = 'guild.create',
  GUILD_UPDATE = 'guild.update',
  GUILD_DELETE = 'guild.delete',
  GUILD_SETTINGS_UPDATE = 'guild.settings.update',
  GUILD_FLAGS_UPDATE = 'guild.flags.update',

  // Member actions
  MEMBER_ADD = 'member.add',
  MEMBER_REMOVE = 'member.remove',
  MEMBER_UPDATE = 'member.update',
  MEMBER_ROLE_UPDATE = 'member.role.update',

  // Code actions
  CODE_REPORT = 'code.report',
  CODE_VERIFY = 'code.verify',
  CODE_DELETE = 'code.delete',

  // Club analytics actions
  CLUB_ANALYSIS_CREATE = 'club.analysis.create',
  CLUB_ANALYSIS_DELETE = 'club.analysis.delete',
  CLUB_ANALYSIS_EXPORT = 'club.analysis.export',

  // Feature flag actions
  FEATURE_FLAG_UPDATE = 'feature.flag.update',

  // User actions
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  USER_PREFERENCES_UPDATE = 'user.preferences.update',

  // Admin actions
  ADMIN_ACCESS = 'admin.access',
  ADMIN_CONFIG_UPDATE = 'admin.config.update',

  // System actions
  SYSTEM_CONFIG_UPDATE = 'system.config.update',
  SYSTEM_MAINTENANCE = 'system.maintenance',
}

/**
 * Audit changes interface
 */
export interface AuditChanges {
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  fields?: string[];
}

/**
 * Audit logger class
 */
export class AuditLogger {
  private logDirectory: string;

  constructor(logDirectory: string = 'data/audit-logs') {
    this.logDirectory = logDirectory;
    this.ensureLogDirectory();
  }

  /**
   * Ensure log directory exists
   */
  private ensureLogDirectory(): void {
    if (!existsSync(this.logDirectory)) {
      mkdirSync(this.logDirectory, { recursive: true });
    }
  }

  /**
   * Generate unique ID for log entry
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Get log file path for current date
   */
  private getLogFilePath(): string {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return join(this.logDirectory, `audit-${date}.jsonl`);
  }

  /**
   * Log an audit event
   */
  log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
    try {
      const fullEntry: AuditLogEntry = {
        id: this.generateId(),
        timestamp: new Date().toISOString(),
        ...entry,
      };

      // Write to JSONL file (one JSON object per line)
      const logLine = JSON.stringify(fullEntry) + '\n';
      const logFile = this.getLogFilePath();

      writeFileSync(logFile, logLine, { flag: 'a' });

      // Also log to console in development
      if (!isProduction) {
        console.log('[AUDIT]', {
          action: fullEntry.action,
          user: fullEntry.username || fullEntry.userId,
          resource: fullEntry.resource,
          status: fullEntry.status,
        });
      }
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }
  }

  /**
   * Log a successful action
   */
  logSuccess(
    userId: string,
    action: AuditAction,
    resource: string,
    options?: {
      username?: string;
      resourceId?: string;
      changes?: AuditChanges;
      ipAddress?: string;
      userAgent?: string;
      metadata?: Record<string, unknown>;
    }
  ): void {
    this.log({
      userId,
      action,
      resource,
      status: 'success',
      ...options,
    });
  }

  /**
   * Log a failed action
   */
  logFailure(
    userId: string,
    action: AuditAction,
    resource: string,
    errorMessage: string,
    options?: {
      username?: string;
      resourceId?: string;
      ipAddress?: string;
      userAgent?: string;
      metadata?: Record<string, unknown>;
    }
  ): void {
    this.log({
      userId,
      action,
      resource,
      status: 'failure',
      errorMessage,
      ...options,
    });
  }

  /**
   * Helper to extract request metadata
   */
  static getRequestMetadata(request: Request): {
    ipAddress?: string;
    userAgent?: string;
  } {
    return {
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    };
  }

  /**
   * Helper to create change tracking object
   */
  static trackChanges(
    before: Record<string, unknown>,
    after: Record<string, unknown>
  ): AuditChanges {
    const fields = Object.keys(after).filter(
      (key) => JSON.stringify(before[key]) !== JSON.stringify(after[key])
    );

    return {
      before,
      after,
      fields,
    };
  }
}

// Singleton instance
let auditLoggerInstance: AuditLogger | null = null;

/**
 * Get audit logger instance
 */
export function getAuditLogger(): AuditLogger {
  if (!auditLoggerInstance) {
    auditLoggerInstance = new AuditLogger();
  }
  return auditLoggerInstance;
}

/**
 * Helper function to log audit event
 */
export function auditLog(
  userId: string,
  action: AuditAction,
  resource: string,
  options?: {
    username?: string;
    resourceId?: string;
    changes?: AuditChanges;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
    status?: 'success' | 'failure';
    errorMessage?: string;
  }
): void {
  const logger = getAuditLogger();

  if (options?.status === 'failure' && options.errorMessage) {
    logger.logFailure(userId, action, resource, options.errorMessage, options);
  } else {
    logger.logSuccess(userId, action, resource, options);
  }
}

/**
 * Middleware to automatically log admin actions
 */
export function withAuditLog<TContext = unknown>(
  action: AuditAction,
  resource: string,
  options?: {
    extractResourceId?: (request: Request, context?: TContext) => string | undefined;
    extractChanges?: (request: Request, context?: TContext) => Promise<AuditChanges | undefined>;
  }
) {
  return function <THandler extends (request: Request, context?: TContext) => Promise<Response>>(
    handler: THandler
  ): THandler {
    return (async (request: Request, context?: TContext) => {
      const logger = getAuditLogger();
      const requestMetadata = AuditLogger.getRequestMetadata(request);

      // Extract user from request (you may need to adjust this based on your auth implementation)
      const userId = request.headers.get('x-user-id') || 'unknown';
      const username = request.headers.get('x-username') || undefined;

      // Extract resource ID if extractor provided
      const resourceId = options?.extractResourceId?.(request, context);

      // Extract changes if extractor provided
      const changes = await options?.extractChanges?.(request, context);

      try {
        // Execute the handler
        const response = await handler(request, context);

        // Log successful action
        logger.logSuccess(userId, action, resource, {
          username,
          resourceId,
          changes,
          ...requestMetadata,
        });

        return response;
      } catch (error) {
        // Log failed action
        logger.logFailure(
          userId,
          action,
          resource,
          error instanceof Error ? error.message : 'Unknown error',
          {
            username,
            resourceId,
            ...requestMetadata,
            metadata: { error: String(error) },
          }
        );

        // Re-throw the error
        throw error;
      }
    }) as THandler;
  };
}
