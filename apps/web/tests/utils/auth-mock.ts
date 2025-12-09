/**
 * Authentication mocking utilities for tests
 */

import { vi } from 'vitest';
import type { ServerAuthUser } from '@/lib/auth/server';

type TestServerAuthUser = ServerAuthUser & { email?: string };

/**
 * Default mock user for tests with admin role
 */
export const mockAuthUser: TestServerAuthUser = {
  id: 'test-user-123',
  username: 'Test User',
  email: 'test@example.com',
  role: 'admin',
  guilds: [
    {
      id: 'guild-123',
      roles: ['1178129227321712701'],
    },
  ],
};

/**
 * Create a mock requireAuth that returns a successful authentication
 *
 * @param user Optional partial user object to override defaults
 */
export function mockRequireAuthSuccess(user: Partial<TestServerAuthUser> = {}) {
  return vi.fn().mockResolvedValue({
    ...mockAuthUser,
    ...user,
  });
}

/**
 * Create a mock requireAuth that throws an authentication error
 *
 * @param message Optional error message
 */
export function mockRequireAuthFailure(message = 'User not authenticated') {
  const { AuthenticationError } = require('@/lib/errors');
  return vi.fn().mockRejectedValue(new AuthenticationError(message));
}
