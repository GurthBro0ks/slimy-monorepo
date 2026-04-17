import { addCorrection, getCorrections } from '../../src/lib/club-corrections';

describe('club-corrections — stubs', () => {
  it('addCorrection should throw when DB not configured', async () => {
    const origDb = process.env.DB_HOST;
    delete process.env.DB_HOST;
    try {
      await expect(addCorrection({
        guildId: 'g1',
        weekId: 'w1',
        memberKey: 'alice',
        displayName: 'Alice',
        metric: 'total',
        value: 100,
      })).rejects.toThrow('not configured');
    } finally {
      process.env.DB_HOST = origDb;
    }
  });

  it('getCorrections should return empty when DB not configured', async () => {
    const origDb = process.env.DB_HOST;
    delete process.env.DB_HOST;
    try {
      const result = await getCorrections('g1', 'w1');
      expect(result).toEqual([]);
    } finally {
      process.env.DB_HOST = origDb;
    }
  });
});
