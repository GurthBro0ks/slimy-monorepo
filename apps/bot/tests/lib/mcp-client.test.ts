import { mcpClient } from '../../src/lib/mcp-client';

describe('mcp-client — module structure', () => {
  it('should export callTool function', () => {
    expect(typeof mcpClient.callTool).toBe('function');
  });

  it('should export getUserStats function', () => {
    expect(typeof mcpClient.getUserStats).toBe('function');
  });

  it('should export getGuildActivity function', () => {
    expect(typeof mcpClient.getGuildActivity).toBe('function');
  });

  it('should export getSnailLeaderboard function', () => {
    expect(typeof mcpClient.getSnailLeaderboard).toBe('function');
  });

  it('should export healthCheck function', () => {
    expect(typeof mcpClient.healthCheck).toBe('function');
  });

  it('callTool should throw for unknown server', async () => {
    await expect(mcpClient.callTool('unknown_server', 'tool', {})).rejects.toThrow('Unknown MCP server');
  });

  it('callTool should throw when no auth token', async () => {
    const origToken = process.env.MCP_AUTH_TOKEN;
    delete process.env.MCP_AUTH_TOKEN;
    try {
      await expect(mcpClient.callTool('club_analytics', 'get_user_stats', { userId: '123' })).rejects.toThrow('authentication token');
    } finally {
      process.env.MCP_AUTH_TOKEN = origToken;
    }
  });
});
