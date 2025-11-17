/**
 * Backend API Health Tests
 * Tests the admin-api health endpoint
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';

// Import the Express app without starting the HTTP server
// We need to mock environment variables before importing the app
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.NODE_ENV = 'test';

// Mock the database module to avoid real DB connections in tests
import { vi } from 'vitest';
vi.mock('../../apps/admin-api/lib/database', () => ({
  isConfigured: () => false,
  initialize: vi.fn(),
  close: vi.fn(),
}));

const app = require('../../apps/admin-api/src/app');

describe('Admin API - Health Endpoint', () => {
  it('GET /api/health should return 200 with status ok', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toMatchObject({
      ok: true,
      service: 'admin-api',
    });
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('env');
  });

  it('GET /api/ should return ok: true', async () => {
    const response = await request(app)
      .get('/api/')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toEqual({ ok: true });
  });

  it('GET /nonexistent should return 404', async () => {
    const response = await request(app)
      .get('/nonexistent')
      .expect(404);
  });
});
