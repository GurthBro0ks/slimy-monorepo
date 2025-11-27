/**
 * Request-scoped authentication context using AsyncLocalStorage
 *
 * This provides per-request caching to prevent multiple Admin API calls
 * when requireAuth() is called multiple times within the same request.
 */

import { AsyncLocalStorage } from 'async_hooks';
import type { ServerAuthUser } from './server';

interface RequestContext {
  user?: ServerAuthUser;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

/**
 * Get the cached authenticated user for this request
 */
export function getRequestUser(): ServerAuthUser | undefined {
  return requestContext.getStore()?.user;
}

/**
 * Cache the authenticated user for this request
 */
export function setRequestUser(user: ServerAuthUser): void {
  const store = requestContext.getStore();
  if (store) {
    store.user = user;
  }
}

/**
 * Clear the cached user for this request
 */
export function clearRequestUser(): void {
  const store = requestContext.getStore();
  if (store) {
    store.user = undefined;
  }
}
