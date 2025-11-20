/**
 * Analytics Event Types
 *
 * This file declares known event types for autocomplete and type safety
 */

/**
 * Known analytics event types
 */
export type AnalyticsEventType =
  | "page_view"
  | "login_success"
  | "login_failed"
  | "logout"
  | "user_action"
  | "button_click"
  | "form_submit"
  | "api_call"
  | "error"
  | "navigation"
  | "search"
  | "file_upload"
  | "file_download"
  | "settings_changed"
  | "feature_used"
  | "session_start"
  | "session_end";

/**
 * Base analytics event structure
 */
export interface AnalyticsEvent {
  type: AnalyticsEventType | string;
  payload?: Record<string, any>;
  timestamp?: string;
  userId?: string;
  guildId?: string;
}

/**
 * Page view event payload
 */
export interface PageViewPayload {
  page: string;
  referrer?: string;
  path?: string;
  query?: Record<string, string>;
}

/**
 * User action event payload
 */
export interface UserActionPayload {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
}

/**
 * Error event payload
 */
export interface ErrorPayload {
  message: string;
  stack?: string;
  code?: string | number;
  severity?: "low" | "medium" | "high" | "critical";
  context?: Record<string, any>;
}

/**
 * Login event payload
 */
export interface LoginPayload {
  method?: "oauth" | "password" | "token" | "sso";
  provider?: string;
  success: boolean;
  reason?: string;
}

/**
 * Navigation event payload
 */
export interface NavigationPayload {
  from: string;
  to: string;
  method?: "link" | "button" | "redirect" | "back" | "forward";
}

/**
 * Search event payload
 */
export interface SearchPayload {
  query: string;
  category?: string;
  resultsCount?: number;
  filters?: Record<string, any>;
}

/**
 * Analytics event payloads by type
 */
export interface AnalyticsEventPayloads {
  page_view: PageViewPayload;
  user_action: UserActionPayload;
  error: ErrorPayload;
  login_success: LoginPayload;
  login_failed: LoginPayload;
  navigation: NavigationPayload;
  search: SearchPayload;
}

/**
 * Analytics API request body
 */
export interface AnalyticsEventRequest {
  type: AnalyticsEventType | string;
  payload?: Record<string, any>;
}

/**
 * Analytics API response
 */
export interface AnalyticsEventResponse {
  ok: boolean;
  message?: string;
  error?: string;
  event?: {
    type: string;
    timestamp: string;
  };
}

/**
 * Analytics options
 */
export interface AnalyticsOptions {
  userId?: string;
  guildId?: string;
  metadata?: Record<string, any>;
}
