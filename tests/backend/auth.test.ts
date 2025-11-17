/**
 * Backend API Auth Tests
 * Tests the admin-api authentication endpoints
 */

import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

// Set up environment variables before importing the app
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.NODE_ENV = 'test';

// Mock the database module
vi.mock('../../apps/admin-api/lib/database', () => ({
  isConfigured: () => false,
  initialize: vi.fn(),
  close: vi.fn(),
}));

const app = require('../../apps/admin-api/src/app');

describe('Admin API - Auth Endpoints', () => {
  describe('GET /api/auth/me', () => {
    it('should return 401 for unauthorized request', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toMatchObject({
        error: expect.any(String),
      });
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', 'auth-token=invalid-token-here')
        .expect(401);

      expect(response.body).toMatchObject({
        error: expect.any(String),
      });
    });
  });

  describe('POST /api/auth/login', () => {
    it('should reject login without credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should allow logout even without auth', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body).toMatchObject({
        ok: true,
      });
    });
  });
});
