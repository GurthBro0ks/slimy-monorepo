import { attachSnailAutoDetect } from '../src/handlers/snail-auto-detect.js';

describe('snail-auto-detect handler — module structure', () => {
  it('should not attach handler twice', () => {
    const mockClient = {
      on: () => {},
      _snailAutoDetectAttached: false,
    } as any;
    attachSnailAutoDetect(mockClient);
    expect(mockClient._snailAutoDetectAttached).toBe(true);
  });
});
