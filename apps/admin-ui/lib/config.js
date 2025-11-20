/**
 * Admin API Configuration
 *
 * Centralized configuration for accessing the admin API base URL.
 * This ensures consistent handling of the NEXT_PUBLIC_ADMIN_API_BASE
 * environment variable across the admin-ui application.
 */

/**
 * Get the admin API base URL
 *
 * @param {Object} options - Configuration options
 * @param {boolean} options.required - Whether to throw an error if URL is not configured (default: false)
 * @param {boolean} options.allowEmpty - Whether to allow empty string as valid value (default: true)
 * @param {string} options.fallback - Fallback URL if env var is not set
 * @returns {string} The admin API base URL
 * @throws {Error} If required is true and URL is not configured
 *
 * @example
 * // Basic usage (allows empty string for production proxy setup)
 * const baseUrl = getAdminApiBase();
 *
 * @example
 * // Require a value (useful for direct API calls that need an explicit URL)
 * const baseUrl = getAdminApiBase({ required: true });
 *
 * @example
 * // Use a custom fallback
 * const baseUrl = getAdminApiBase({ fallback: 'http://localhost:3080' });
 */
export function getAdminApiBase(options = {}) {
  const {
    required = false,
    allowEmpty = true,
    fallback = undefined
  } = options;

  const baseUrl = process.env.NEXT_PUBLIC_ADMIN_API_BASE;

  // If baseUrl is explicitly set (even to empty string), use it
  if (baseUrl !== undefined && baseUrl !== null) {
    // Check if empty string is allowed
    if (!allowEmpty && baseUrl === '') {
      if (fallback !== undefined) {
        return fallback;
      }
      if (required) {
        throw new Error(
          'NEXT_PUBLIC_ADMIN_API_BASE is set to empty string but allowEmpty is false. ' +
          'Please set NEXT_PUBLIC_ADMIN_API_BASE to a valid URL or check your configuration.'
        );
      }
    }
    return baseUrl;
  }

  // baseUrl is undefined/null
  if (fallback !== undefined) {
    return fallback;
  }

  if (required) {
    throw new Error(
      'NEXT_PUBLIC_ADMIN_API_BASE environment variable is not set. ' +
      'Please configure this in your .env file or environment. ' +
      'For development: http://localhost:3080, For production: https://admin.slimyai.xyz or "" (empty) if using proxy.'
    );
  }

  // Default to empty string (works with Next.js rewrites/Caddy proxy)
  return '';
}

/**
 * Build a full API URL from a path
 *
 * @param {string} path - API path (e.g., '/api/auth/me')
 * @param {Object} options - Options to pass to getAdminApiBase
 * @returns {string} Full API URL
 *
 * @example
 * const url = buildApiUrl('/api/auth/me');
 * // Returns: 'http://localhost:3080/api/auth/me' (in dev)
 * // Returns: '/api/auth/me' (in prod with empty baseUrl)
 */
export function buildApiUrl(path, options = {}) {
  const baseUrl = getAdminApiBase(options);

  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // If baseUrl is empty, just return the path (for proxy scenarios)
  if (!baseUrl) {
    return normalizedPath;
  }

  // Remove trailing slash from baseUrl if present
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

  return `${normalizedBase}${normalizedPath}`;
}

/**
 * Get the default admin API base URL based on environment
 * This matches the behavior in next.config.js
 *
 * @returns {string} Default base URL
 */
export function getDefaultAdminApiBase() {
  if (typeof window !== 'undefined') {
    // Client-side: use the env var that was baked in at build time
    return process.env.NEXT_PUBLIC_ADMIN_API_BASE || '';
  }

  // Server-side: check actual environment
  return process.env.NODE_ENV === 'production'
    ? ''
    : 'http://localhost:3080';
}
