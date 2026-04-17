import { database } from '../../src/lib/database';

describe('database — isConfigured', () => {
  it('should return false when env vars are missing', () => {
    const saved = {
      DB_HOST: process.env.DB_HOST,
      DB_USER: process.env.DB_USER,
      DB_PASSWORD: process.env.DB_PASSWORD,
      DB_NAME: process.env.DB_NAME,
    };
    delete process.env.DB_HOST;
    delete process.env.DB_USER;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_NAME;

    try {
      expect(database.isConfigured()).toBe(false);
    } finally {
      Object.assign(process.env, saved);
    }
  });

  it('should return true when all env vars are set', () => {
    const saved = {
      DB_HOST: process.env.DB_HOST,
      DB_USER: process.env.DB_USER,
      DB_PASSWORD: process.env.DB_PASSWORD,
      DB_NAME: process.env.DB_NAME,
    };
    process.env.DB_HOST = 'localhost';
    process.env.DB_USER = 'test';
    process.env.DB_PASSWORD = 'test';
    process.env.DB_NAME = 'testdb';

    try {
      expect(database.isConfigured()).toBe(true);
    } finally {
      Object.assign(process.env, saved);
    }
  });
});

describe('database — parseJSON', () => {
  it('should parse valid JSON string', () => {
    expect(database.parseJSON('{"a":1}', {})).toEqual({ a: 1 });
  });

  it('should return fallback for null', () => {
    expect(database.parseJSON(null, 'fallback')).toBe('fallback');
  });

  it('should return fallback for undefined', () => {
    expect(database.parseJSON(undefined, 'fallback')).toBe('fallback');
  });

  it('should return object as-is', () => {
    const obj = { a: 1 };
    expect(database.parseJSON(obj, {})).toBe(obj);
  });

  it('should return fallback for invalid JSON', () => {
    expect(database.parseJSON('not json', 'fallback')).toBe('fallback');
  });
});

describe('database — getPool should throw when not configured', () => {
  it('should throw descriptive error', () => {
    const saved = {
      DB_HOST: process.env.DB_HOST,
      DB_USER: process.env.DB_USER,
      DB_PASSWORD: process.env.DB_PASSWORD,
      DB_NAME: process.env.DB_NAME,
    };
    delete process.env.DB_HOST;
    delete process.env.DB_USER;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_NAME;

    try {
      expect(() => database.getPool()).toThrow('not configured');
    } finally {
      Object.assign(process.env, saved);
    }
  });
});
