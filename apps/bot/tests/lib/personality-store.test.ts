import {
  loadAdjustments,
  saveAdjustments,
  setAdjustment,
  clearAdjustment,
  getAllAdjustments,
  mergeAdjustments,
} from '../../src/lib/personality-store';
import fs from 'fs';

describe('personality-store', () => {
  describe('setAdjustment + loadAdjustments', () => {
    it('should set an adjustment and persist it', () => {
      const result = setAdjustment(`warmth-test-${Date.now()}`, 0.9, { updatedBy: 'test-user' });
      expect(result).toBeTruthy();
      expect((result as Record<string, unknown>).value).toBe(0.9);
    });

    it('should return null for empty parameter', () => {
      expect(setAdjustment('', 0.5)).toBeNull();
    });

    it('should update existing adjustment', () => {
      const key = `update-test-${Date.now()}`;
      setAdjustment(key, 0.5);
      setAdjustment(key, 0.9);
      const all = getAllAdjustments();
      const entry = all[key] as Record<string, unknown>;
      expect(entry.value).toBe(0.9);
    });
  });

  describe('clearAdjustment', () => {
    it('should remove an adjustment', () => {
      const key = `clear-test-${Date.now()}`;
      setAdjustment(key, 0.9);
      const result = clearAdjustment(key);
      expect(result).toBe(true);
    });

    it('should return false for non-existent adjustment', () => {
      expect(clearAdjustment(`nonexistent-${Date.now()}`)).toBe(false);
    });

    it('should return false for empty parameter', () => {
      expect(clearAdjustment('')).toBe(false);
    });
  });

  describe('getAllAdjustments', () => {
    it('should return all adjustments', () => {
      const key = `all-test-${Date.now()}`;
      setAdjustment(key, 0.9);
      const all = getAllAdjustments();
      expect(Object.keys(all)).toContain(key);
    });
  });

  describe('mergeAdjustments', () => {
    it('should merge adjustments into a config object', () => {
      const key = `merge-test-${Date.now()}`;
      setAdjustment(key, 0.9);
      const config = { name: 'slimy', version: 1 };
      const merged = mergeAdjustments(config);
      expect(merged.name).toBe('slimy');
      expect(merged.adjustments).toBeDefined();
    });
  });
});
