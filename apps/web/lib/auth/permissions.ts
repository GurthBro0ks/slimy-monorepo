/**
 * Guild Permission Validation
 *
 * Helpers for validating user access to guild-specific resources
 */

import { ServerAuthUser } from './server';
import { AuthorizationError, ValidationError } from '@/lib/errors';

/**
 * Validates that a user has access to a specific guild
 *
 * @param user - Authenticated user object from requireAuth()
 * @param guildId - Guild ID to validate access for
 * @throws {AuthorizationError} If user does not belong to the guild
 */
export function validateGuildAccess(user: ServerAuthUser, guildId: string): void {
  // Check if user.guilds exists and contains the requested guild
  const hasAccess = user.guilds?.some(g => g.id === guildId);

  if (!hasAccess) {
    throw new AuthorizationError(
      `You do not have access to guild ${guildId}`,
      { userId: user.id, requestedGuildId: guildId }
    );
  }
}

/**
 * Validates that a user has club role or higher
 *
 * @param user - Authenticated user object from requireAuth()
 * @throws {AuthorizationError} If user does not have club access
 */
export function requireClubRole(user: ServerAuthUser): void {
  const allowedRoles = ['club', 'admin'];

  if (!allowedRoles.includes(user.role)) {
    throw new AuthorizationError(
      'Club member access required',
      { userId: user.id, currentRole: user.role }
    );
  }
}

/**
 * Sanitizes guild ID to prevent path traversal and injection attacks
 *
 * @param guildId - Raw guild ID from request
 * @returns Sanitized guild ID
 * @throws {ValidationError} If guild ID format is invalid
 */
export function sanitizeGuildId(guildId: string): string {
  // Only allow alphanumeric characters, hyphens, and underscores
  const sanitized = guildId.replace(/[^a-zA-Z0-9_-]/g, '');

  if (!sanitized || sanitized !== guildId) {
    throw new ValidationError('Invalid guild ID format');
  }

  return sanitized;
}
