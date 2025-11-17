/**
 * Analytics Client
 *
 * Provides a simple interface for recording analytics events
 * to the admin-api analytics endpoint.
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

export interface AnalyticsEvent {
  type: AnalyticsEventType | string;
  payload?: Record<string, any>;
}

export interface AnalyticsOptions {
  /**
   * Whether to send the event asynchronously without waiting for response
   * @default true
   */
  async?: boolean;
  /**
   * Whether to log the event to console in development
   * @default true
   */
  debug?: boolean;
}

const ANALYTICS_ENDPOINT = "/api/analytics/event";
const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Record an analytics event
 *
 * @param type - The event type (e.g., "page_view", "login_success")
 * @param payload - Additional event data/payload
 * @param options - Analytics options
 */
export async function recordEvent(
  type: AnalyticsEventType | string,
  payload?: Record<string, any>,
  options: AnalyticsOptions = {}
): Promise<void> {
  const { async = true, debug = isDevelopment } = options;

  // Validate event type
  if (!type || typeof type !== "string") {
    console.error("[Analytics] Invalid event type:", type);
    return;
  }

  const event: AnalyticsEvent = {
    type,
    payload: payload || {},
  };

  // Log in development
  if (debug) {
    console.log("[Analytics] Recording event:", event);
  }

  try {
    const promise = fetch(ANALYTICS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include cookies for authentication
      body: JSON.stringify(event),
    });

    // If async is false, wait for the response
    if (!async) {
      const response = await promise;
      if (!response.ok) {
        console.error("[Analytics] Failed to record event:", response.statusText);
      }
    } else {
      // Fire and forget - don't block on response
      promise.catch((error) => {
        if (debug) {
          console.error("[Analytics] Error recording event:", error);
        }
      });
    }
  } catch (error) {
    // Silently fail in production, log in development
    if (debug) {
      console.error("[Analytics] Error recording event:", error);
    }
  }
}

/**
 * Record a page view event
 *
 * @param page - Page path or name
 * @param data - Additional page data
 */
export function recordPageView(page: string, data?: Record<string, any>): void {
  recordEvent("page_view", {
    page,
    referrer: typeof document !== "undefined" ? document.referrer : undefined,
    url: typeof window !== "undefined" ? window.location.href : undefined,
    ...data,
  });
}

/**
 * Record a user action event
 *
 * @param action - Action name
 * @param data - Additional action data
 */
export function recordAction(action: string, data?: Record<string, any>): void {
  recordEvent("user_action", {
    action,
    timestamp: new Date().toISOString(),
    ...data,
  });
}

/**
 * Record a button click event
 *
 * @param buttonName - Name or ID of the button
 * @param data - Additional button data
 */
export function recordButtonClick(buttonName: string, data?: Record<string, any>): void {
  recordEvent("button_click", {
    button: buttonName,
    ...data,
  });
}

/**
 * Record a navigation event
 *
 * @param from - Source page
 * @param to - Destination page
 * @param data - Additional navigation data
 */
export function recordNavigation(from: string, to: string, data?: Record<string, any>): void {
  recordEvent("navigation", {
    from,
    to,
    ...data,
  });
}

/**
 * Record an error event
 *
 * @param error - Error object or message
 * @param data - Additional error data
 */
export function recordError(error: Error | string, data?: Record<string, any>): void {
  const errorData =
    typeof error === "string"
      ? { message: error }
      : {
          message: error.message,
          stack: error.stack,
          name: error.name,
        };

  recordEvent("error", {
    ...errorData,
    ...data,
  });
}

/**
 * Record a login event
 *
 * @param success - Whether login was successful
 * @param data - Additional login data
 */
export function recordLogin(success: boolean, data?: Record<string, any>): void {
  recordEvent(success ? "login_success" : "login_failed", {
    success,
    timestamp: new Date().toISOString(),
    ...data,
  });
}

/**
 * Record a search event
 *
 * @param query - Search query
 * @param data - Additional search data
 */
export function recordSearch(query: string, data?: Record<string, any>): void {
  recordEvent("search", {
    query,
    timestamp: new Date().toISOString(),
    ...data,
  });
}

/**
 * Analytics object with all tracking methods
 */
export const analytics = {
  recordEvent,
  recordPageView,
  recordAction,
  recordButtonClick,
  recordNavigation,
  recordError,
  recordLogin,
  recordSearch,
};

export default analytics;
