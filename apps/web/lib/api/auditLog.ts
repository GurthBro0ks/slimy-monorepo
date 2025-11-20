/**
 * Audit Log API Client
 *
 * Client library for sending audit events to the Admin API.
 * This replaces the old file-based audit logging with centralized API-based logging.
 *
 * Usage:
 *   import { sendAuditEvent, fetchAuditLogs } from '@/lib/api/auditLog';
 *
 *   // Send an audit event
 *   await sendAuditEvent({
 *     action: 'guild.settings.update',
 *     resourceType: 'guild',
 *     resourceId: guildId,
 *     details: { changes },
 *   });
 */

import { adminApiClient, ApiResponse } from './admin-client';

/**
 * Audit log entry as returned by the API
 */
export interface AuditLog {
  id: string;
  userId: string | null;
  user?: {
    id: string;
    username: string | null;
    globalName: string | null;
    discordId?: string;
  } | null;
  action: string;
  resourceType: string;
  resourceId: string;
  details?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
  sessionId?: string | null;
  requestId?: string | null;
  timestamp: string;
  success: boolean;
  errorMessage?: string | null;
}

/**
 * Payload for creating an audit event
 */
export interface AuditEventPayload {
  userId?: string | null;
  guildId?: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  details?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  success?: boolean;
  errorMessage?: string;
  // These are auto-populated from request context if not provided:
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  requestId?: string;
}

/**
 * Filters for querying audit logs
 */
export interface AuditLogFilters {
  userId?: string;
  guildId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  success?: boolean;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

/**
 * API response for list endpoint
 */
interface ListAuditLogsResponse {
  ok: true;
  logs: AuditLog[];
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * API response for create endpoint
 */
interface CreateAuditLogResponse {
  ok: true;
  auditLog: AuditLog;
}

/**
 * API response for get endpoint
 */
interface GetAuditLogResponse {
  ok: true;
  log: AuditLog;
}

/**
 * API response for stats endpoint
 */
interface AuditLogStatsResponse {
  ok: true;
  stats: {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
    actionBreakdown: Array<{
      action: string;
      count: number;
    }>;
  };
}

/**
 * Send an audit event to the Admin API
 *
 * This is the primary function for logging audit events from the web app.
 *
 * @param payload - The audit event data
 * @returns Promise with the created audit log entry
 *
 * @example
 * ```ts
 * await sendAuditEvent({
 *   action: 'guild.settings.update',
 *   resourceType: 'guild',
 *   resourceId: guildId,
 *   details: {
 *     changed: ['sheetUrl', 'weekWindowDays'],
 *     oldValues: { sheetUrl: 'old' },
 *     newValues: { sheetUrl: 'new' }
 *   },
 * });
 * ```
 */
export async function sendAuditEvent(
  payload: AuditEventPayload
): Promise<ApiResponse<CreateAuditLogResponse>> {
  try {
    const response = await adminApiClient.post<CreateAuditLogResponse>(
      '/api/audit-log',
      payload
    );

    if (!response.ok) {
      // Log failure but don't throw - audit logging should not break core flows
      console.error('[AuditLog] Failed to send audit event:', {
        action: payload.action,
        resourceType: payload.resourceType,
        error: response.message,
      });
    }

    return response;
  } catch (error) {
    // Catch and log any unexpected errors
    console.error('[AuditLog] Unexpected error sending audit event:', error);
    return {
      ok: false,
      code: 'AUDIT_LOG_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch audit logs with optional filtering and pagination
 *
 * Requires admin role.
 *
 * @param filters - Optional filters and pagination params
 * @returns Promise with the audit logs and pagination info
 *
 * @example
 * ```ts
 * const result = await fetchAuditLogs({
 *   userId: 'user123',
 *   action: 'guild.settings.update',
 *   limit: 50,
 *   offset: 0,
 * });
 *
 * if (result.ok) {
 *   console.log(result.data.logs);
 *   console.log(result.data.pagination);
 * }
 * ```
 */
export async function fetchAuditLogs(
  filters?: AuditLogFilters
): Promise<ApiResponse<ListAuditLogsResponse>> {
  const queryParams = new URLSearchParams();

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  }

  const queryString = queryParams.toString();
  const path = queryString
    ? `/api/audit-log?${queryString}`
    : '/api/audit-log';

  return adminApiClient.get<ListAuditLogsResponse>(path);
}

/**
 * Fetch a specific audit log entry by ID
 *
 * Requires admin role.
 *
 * @param id - The audit log ID
 * @returns Promise with the audit log entry
 */
export async function fetchAuditLog(
  id: string
): Promise<ApiResponse<GetAuditLogResponse>> {
  return adminApiClient.get<GetAuditLogResponse>(`/api/audit-log/${id}`);
}

/**
 * Fetch audit log statistics
 *
 * Requires admin role.
 *
 * @param filters - Optional filters for the stats
 * @returns Promise with the audit log statistics
 */
export async function fetchAuditLogStats(
  filters?: Omit<AuditLogFilters, 'limit' | 'offset'>
): Promise<ApiResponse<AuditLogStatsResponse>> {
  const queryParams = new URLSearchParams();

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  }

  const queryString = queryParams.toString();
  const path = queryString
    ? `/api/audit-log/stats?${queryString}`
    : '/api/audit-log/stats';

  return adminApiClient.get<AuditLogStatsResponse>(path);
}

/**
 * Audit action constants (aligned with admin-api)
 *
 * These are common action types used across the application.
 * You can use custom action strings, but these provide consistency.
 */
export const AuditActions = {
  // Guild actions
  GUILD_CREATE: 'guild.create',
  GUILD_UPDATE: 'guild.update',
  GUILD_DELETE: 'guild.delete',
  GUILD_SETTINGS_UPDATE: 'guild.settings.update',
  GUILD_FLAGS_UPDATE: 'guild.flags.update',

  // Member actions
  MEMBER_ADD: 'member.add',
  MEMBER_REMOVE: 'member.remove',
  MEMBER_UPDATE: 'member.update',
  MEMBER_ROLE_UPDATE: 'member.role.update',

  // Code actions
  CODE_REPORT: 'code.report',
  CODE_VERIFY: 'code.verify',
  CODE_DELETE: 'code.delete',

  // Club analytics actions
  CLUB_ANALYSIS_CREATE: 'club.analysis.create',
  CLUB_ANALYSIS_DELETE: 'club.analysis.delete',
  CLUB_ANALYSIS_EXPORT: 'club.analysis.export',

  // Feature flag actions
  FEATURE_FLAG_UPDATE: 'feature.flag.update',

  // User actions
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_PREFERENCES_UPDATE: 'user.preferences.update',

  // Admin actions
  ADMIN_ACCESS: 'admin.access',
  ADMIN_CONFIG_UPDATE: 'admin.config.update',

  // System actions
  SYSTEM_CONFIG_UPDATE: 'system.config.update',
  SYSTEM_MAINTENANCE: 'system.maintenance',
} as const;

/**
 * Resource type constants
 *
 * These are common resource types used across the application.
 */
export const ResourceTypes = {
  USER: 'user',
  GUILD: 'guild',
  MEMBER: 'member',
  CODE: 'code',
  CLUB_ANALYSIS: 'club_analysis',
  FEATURE_FLAG: 'feature_flag',
  SYSTEM: 'system',
  SETTINGS: 'settings',
  CHANNEL: 'channel',
} as const;
