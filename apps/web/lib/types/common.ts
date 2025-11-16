/**
 * Common Type Definitions
 *
 * Centralized type definitions to eliminate 'any' types throughout the codebase
 */

/**
 * JSON-serializable value types
 */
export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

/**
 * JSON object type
 */
export type JSONObject = { [key: string]: JSONValue };

/**
 * Generic API response wrapper
 */
export interface APIResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: JSONObject;
  };
  status: number;
  timestamp?: string;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  ok: true;
  data: T[];
  pagination: PaginationMeta;
  status: number;
}

/**
 * Generic error response
 */
export interface ErrorResponse {
  ok: false;
  code: string;
  message: string;
  status: number;
  details?: JSONObject;
}

/**
 * Request context type for API routes
 */
export interface RequestContext {
  params?: Record<string, string>;
  searchParams?: URLSearchParams;
  user?: {
    id: string;
    username?: string;
    roles?: string[];
  };
}

/**
 * Metric value types (for club analytics)
 */
export type MetricValue = string | number | boolean | Record<string, unknown>;

/**
 * HTTP method types
 */
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * Cache entry with TTL
 */
export interface CacheEntry<T> {
  value: T;
  expiresAt?: number;
  createdAt: number;
}

/**
 * Log level types
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Structured log entry
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: JSONObject;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Feature flag value types
 */
export type FeatureFlagValue = boolean | string | number | JSONObject;

/**
 * Webhook payload type
 */
export interface WebhookPayload {
  event: string;
  data: JSONObject;
  timestamp: string;
  signature?: string;
}

/**
 * Generic filter type for database queries
 */
export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'startsWith' | 'endsWith';

export interface Filter<T = unknown> {
  field: string;
  operator: FilterOperator;
  value: T;
}

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sort options
 */
export interface SortOptions {
  field: string;
  direction: SortDirection;
}

/**
 * Query options for list endpoints
 */
export interface QueryOptions {
  filters?: Filter[];
  sort?: SortOptions[];
  limit?: number;
  offset?: number;
  search?: string;
}

/**
 * Async result type
 */
export type AsyncResult<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/**
 * Optional type helper
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Required type helper
 */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Deep partial type
 */
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

/**
 * Type guard utilities
 */
export function isJSONObject(value: unknown): value is JSONObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isJSONValue(value: unknown): value is JSONValue {
  if (value === null) return true;
  if (typeof value === 'string') return true;
  if (typeof value === 'number') return true;
  if (typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.every(isJSONValue);
  if (isJSONObject(value)) {
    return Object.values(value).every(isJSONValue);
  }
  return false;
}

/**
 * Assert never (for exhaustive type checking)
 */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}
