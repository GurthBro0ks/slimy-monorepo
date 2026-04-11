/**
 * Unit tests for club-staging.ts
 * Tests the MySQL repository functions with mocked database.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted so mocks are available to vi.mock (which is hoisted to top)
const { mockDbExecute, mockDbQuery, mockPoolGetConnection, mockConnBeginTransaction, mockConnExecute, mockConnCommit, mockConnRollback, mockConnRelease } = vi.hoisted(() => ({
  mockDbExecute: vi.fn(),
  mockDbQuery: vi.fn(),
  mockPoolGetConnection: vi.fn(),
  mockConnBeginTransaction: vi.fn(),
  mockConnExecute: vi.fn(),
  mockConnCommit: vi.fn(),
  mockConnRollback: vi.fn(),
  mockConnRelease: vi.fn(),
}));

vi.mock('../src/lib/database.js', () => {
  const mockPool = {
    getConnection: mockPoolGetConnection,
    execute: mockDbExecute,
  };
  return {
    database: {
      execute: mockDbExecute,
      query: mockDbQuery,
      getPool: () => mockPool,
      isConfigured: () => true,
    },
  };
});

import {
  clearStaging,
  saveStagingRows,
  loadStagingRows,
  updateStagingRow,
  getStagingStatus,
} from '../src/services/club-staging.js';

function setupConnectionMock() {
  const mockConnection = {
    beginTransaction: mockConnBeginTransaction,
    execute: mockConnExecute,
    commit: mockConnCommit,
    rollback: mockConnRollback,
    release: mockConnRelease,
  };
  mockPoolGetConnection.mockResolvedValue(mockConnection);
  return mockConnection;
}

describe('club-staging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPoolGetConnection.mockReset();
    mockConnExecute.mockReset();
    mockConnBeginTransaction.mockReset();
    mockConnCommit.mockReset();
    mockConnRollback.mockReset();
    mockConnRelease.mockReset();
    mockDbExecute.mockReset();
    mockDbQuery.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('clearStaging', () => {
    it('deletes rows for the given guild and metric', async () => {
      mockDbExecute.mockResolvedValueOnce({ affectedRows: 5 });

      await clearStaging('guild123', 'sim');

      expect(mockDbExecute).toHaveBeenCalledWith(
        'DELETE FROM club_analyze_staging WHERE guild_id = ? AND metric = ?',
        ['guild123', 'sim'],
      );
    });

    it('deletes for total metric', async () => {
      mockDbExecute.mockResolvedValueOnce({ affectedRows: 3 });

      await clearStaging('guild456', 'total');

      expect(mockDbExecute).toHaveBeenCalledWith(
        'DELETE FROM club_analyze_staging WHERE guild_id = ? AND metric = ?',
        ['guild456', 'total'],
      );
    });
  });

  describe('saveStagingRows', () => {
    it('clears and re-inserts rows in a transaction', async () => {
      setupConnectionMock();
      mockConnExecute
        .mockResolvedValueOnce({ affectedRows: 0 }) // DELETE
        .mockResolvedValueOnce({ affectedRows: 2 }); // INSERT

      const rows = [
        { member_name: 'Stone', power_value: 14321191n },
        { member_name: 'Traveler12521', power_value: 14084498n },
      ];

      await saveStagingRows('guild123', 'sim', 'user456', rows);

      expect(mockConnBeginTransaction).toHaveBeenCalled();
      expect(mockConnExecute).toHaveBeenCalledTimes(2);
      expect(mockConnCommit).toHaveBeenCalled();
      expect(mockConnRelease).toHaveBeenCalled();
    });

    it('calls only DELETE when rows array is empty', async () => {
      // When rows is empty, saveStagingRows calls clearStaging() which uses
      // database.execute (pool-level), not connection.execute
      mockDbExecute.mockResolvedValueOnce({ affectedRows: 0 });

      await saveStagingRows('guild123', 'sim', 'user456', []);

      expect(mockDbExecute).toHaveBeenCalledTimes(1);
    });

    it('rolls back on insert failure', async () => {
      setupConnectionMock();
      mockConnExecute
        .mockResolvedValueOnce({ affectedRows: 0 }) // DELETE succeeds
        .mockRejectedValueOnce(new Error('Insert failed')); // INSERT fails

      const rows = [{ member_name: 'Stone', power_value: 14321191n }];

      await expect(saveStagingRows('guild123', 'sim', 'user456', rows)).rejects.toThrow('Insert failed');
      expect(mockConnRollback).toHaveBeenCalled();
      expect(mockConnRelease).toHaveBeenCalled();
    });
  });

  describe('loadStagingRows', () => {
    it('returns rows ordered by member_name', async () => {
      mockDbQuery.mockResolvedValueOnce([
        { member_name: 'Alice', power_value: '1000000', updated_at: new Date('2026-01-01') },
        { member_name: 'Bob', power_value: '2000000', updated_at: new Date('2026-01-02') },
      ]);

      const result = await loadStagingRows('guild123', 'sim');

      expect(mockDbQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT member_name, power_value, updated_at'),
        ['guild123', 'sim'],
      );
      expect(result).toHaveLength(2);
      expect(result[0].member_name).toBe('Alice');
      expect(result[0].power_value).toBe(1000000n);
      expect(result[1].member_name).toBe('Bob');
      expect(result[1].power_value).toBe(2000000n);
    });

    it('returns empty array when no staging rows exist', async () => {
      mockDbQuery.mockResolvedValueOnce([]);

      const result = await loadStagingRows('guild123', 'total');

      expect(result).toHaveLength(0);
    });
  });

  describe('updateStagingRow', () => {
    it('updates name and power for existing row without name change', async () => {
      setupConnectionMock();
      mockConnExecute.mockResolvedValueOnce({ affectedRows: 1 });

      await updateStagingRow('guild123', 'sim', 'Stone', 'Stone', 15000000n);

      expect(mockConnExecute).toHaveBeenCalledTimes(1);
      expect(mockConnExecute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE club_analyze_staging'),
        ['Stone', '15000000', 'guild123', 'sim', 'Stone'],
      );
      expect(mockConnCommit).toHaveBeenCalled();
    });

    it('checks for collision and updates when no conflict', async () => {
      setupConnectionMock();
      mockConnExecute
        .mockResolvedValueOnce([[{ cnt: 0 }]]) // collision check: no conflict
        .mockResolvedValueOnce({ affectedRows: 1 }); // UPDATE

      await updateStagingRow('guild123', 'sim', 'Stone_old', 'Stone_new', 15000000n);

      expect(mockConnExecute).toHaveBeenCalledTimes(2);
      expect(mockConnCommit).toHaveBeenCalled();
    });

    it('throws and rolls back when new name collides with existing row', async () => {
      setupConnectionMock();
      mockConnExecute.mockResolvedValueOnce([[{ cnt: 1 }]]); // collision found

      await expect(
        updateStagingRow('guild123', 'sim', 'Stone', 'Bob', 15000000n),
      ).rejects.toThrow('Name "Bob" already exists in staging for this scan');

      expect(mockConnRollback).toHaveBeenCalled();
    });
  });

  describe('getStagingStatus', () => {
    it('returns counts and latest timestamps for both metrics', async () => {
      mockDbQuery.mockResolvedValueOnce([
        { metric: 'sim', cnt: 55, latest: new Date('2026-04-10T12:00:00Z') },
        { metric: 'total', cnt: 55, latest: new Date('2026-04-10T12:05:00Z') },
      ]);

      const result = await getStagingStatus('guild123');

      expect(result.sim.count).toBe(55);
      expect(result.total.count).toBe(55);
      expect(result.sim.updated_at).toBeTruthy();
      expect(result.total.updated_at).toBeTruthy();
    });

    it('returns zero counts when no staging data exists', async () => {
      mockDbQuery.mockResolvedValueOnce([]);

      const result = await getStagingStatus('guild123');

      expect(result.sim.count).toBe(0);
      expect(result.total.count).toBe(0);
      expect(result.sim.updated_at).toBeNull();
      expect(result.total.updated_at).toBeNull();
    });

    it('handles partial data with only sim metric', async () => {
      mockDbQuery.mockResolvedValueOnce([
        { metric: 'sim', cnt: 30, latest: new Date('2026-04-10T12:00:00Z') },
      ]);

      const result = await getStagingStatus('guild123');

      expect(result.sim.count).toBe(30);
      expect(result.total.count).toBe(0);
      expect(result.total.updated_at).toBeNull();
    });
  });
});
