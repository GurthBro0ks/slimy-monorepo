/**
 * E2E API Tests - Authentication
 *
 * Tests the authentication flow including:
 * - User session validation
 * - Role assignment
 * - Authentication error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/auth/me/route';
import { createMockResponse, createMockCookie } from './setup';

// Mock the API client
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

// Mock slimy config
vi.mock('@/slimy.config', () => ({
  getUserRole: vi.fn((roles: string[]) => {
    if (roles.includes('1178129227321712701') || roles.includes('1216250443257217124')) {
      return 'admin';
    }
    if (roles.includes('1178143391884775444')) {
      return 'club';
    }
    return 'user';
  }),
}));

describe('Auth API - /api/auth/me', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return user session with admin role', async () => {
    const { apiClient } = await import('@/lib/api-client');
    const mockUser = {
      user: {
        id: '123456789',
        name: 'Test Admin User',
      },
      guilds: [
        {
          id: 'guild-1',
          roles: ['1178129227321712701'], // Admin role
        },
      ],
    };

    // Mock successful API response
    vi.mocked(apiClient.get).mockResolvedValue({
      ok: true,
      data: mockUser,
      status: 200,
      headers: new Headers(),
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      user: {
        id: '123456789',
        name: 'Test Admin User',
      },
      role: 'admin',
      guilds: [
        {
          id: 'guild-1',
          roles: ['1178129227321712701'],
        },
      ],
    });

    expect(apiClient.get).toHaveBeenCalledWith('/api/auth/me', {
      useCache: false,
    });
  });

  it('should return user session with club role', async () => {
    const { apiClient } = await import('@/lib/api-client');
    const mockUser = {
      user: {
        id: '987654321',
        name: 'Test Club User',
      },
      guilds: [
        {
          id: 'guild-2',
          roles: ['1178143391884775444'], // Club role
        },
      ],
    };

    vi.mocked(apiClient.get).mockResolvedValue({
      ok: true,
      data: mockUser,
      status: 200,
      headers: new Headers(),
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      user: {
        id: '987654321',
        name: 'Test Club User',
      },
      role: 'club',
    });
  });

  it('should return user session with basic user role', async () => {
    const { apiClient } = await import('@/lib/api-client');
    const mockUser = {
      user: {
        id: '555555555',
        name: 'Test Regular User',
      },
      guilds: [
        {
          id: 'guild-3',
          roles: ['some-other-role'], // No special roles
        },
      ],
    };

    vi.mocked(apiClient.get).mockResolvedValue({
      ok: true,
      data: mockUser,
      status: 200,
      headers: new Headers(),
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.role).toBe('user');
  });

  it('should handle authentication failure', async () => {
    const { apiClient } = await import('@/lib/api-client');

    // Mock API error response
    vi.mocked(apiClient.get).mockResolvedValue({
      ok: false,
      code: 'UNAUTHORIZED',
      message: 'Not authenticated',
      status: 401,
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toMatchObject({
      ok: false,
      code: 'UNAUTHORIZED',
      message: 'Not authenticated',
    });
  });

  it('should handle server error', async () => {
    const { apiClient } = await import('@/lib/api-client');

    // Mock server error
    vi.mocked(apiClient.get).mockResolvedValue({
      ok: false,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      status: 500,
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toMatchObject({
      ok: false,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
  });

  it('should handle user without guilds', async () => {
    const { apiClient } = await import('@/lib/api-client');
    const mockUser = {
      user: {
        id: '111111111',
        name: 'User Without Guilds',
      },
      guilds: undefined,
    };

    vi.mocked(apiClient.get).mockResolvedValue({
      ok: true,
      data: mockUser,
      status: 200,
      headers: new Headers(),
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.role).toBe('user');
    expect(data.guilds).toBeUndefined();
  });
});
