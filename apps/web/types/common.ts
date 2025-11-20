/**
 * Common type definitions shared across the application
 */

/**
 * Log levels for the logging system
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Generic JSON-serializable object type
 */
export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

export type JSONObject = { [key: string]: JSONValue };

/**
 * Log entry structure
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
