/**
 * MCP analytics client for Discord Bot.
 * Ported from /opt/slimy/app/services/mcp-client.js
 */

interface MCPServers {
  [key: string]: string;
}

const MCP_SERVERS: MCPServers = {
  club_analytics: process.env.MCP_CLUB_ANALYTICS_URL || "http://localhost:3091",
  google_sheets: process.env.MCP_GOOGLE_SHEETS_URL || "http://localhost:3092",
  mysql_data: process.env.MCP_MYSQL_DATA_URL || "http://localhost:3093",
};

function getAuthToken(): string {
  return process.env.MCP_AUTH_TOKEN || "";
}

async function callTool(
  serverName: string,
  toolName: string,
  args: Record<string, unknown>,
  authToken?: string,
): Promise<unknown> {
  const serverUrl = MCP_SERVERS[serverName];
  if (!serverUrl) throw new Error(`Unknown MCP server: ${serverName}`);

  const token = authToken || getAuthToken();
  if (!token) throw new Error("No authentication token available");

  const mcpRequest = {
    jsonrpc: "2.0",
    id: Date.now(),
    method: "tools/call",
    params: { name: toolName, arguments: args },
  };

  try {
    const response = await fetch(`${serverUrl}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(mcpRequest),
    });

    if (!response.ok) {
      throw new Error(`MCP HTTP error: ${response.status}`);
    }

    const data = (await response.json()) as {
      error?: { message?: string };
      result?: unknown;
    };
    if (data.error) throw new Error(`MCP Error: ${data.error.message}`);
    return data.result;
  } catch (err) {
    console.error(
      `[MCP Client] Error calling ${serverName}/${toolName}:`,
      (err as Error).message,
    );
    throw err;
  }
}

async function getUserStats(
  userId: string,
  guildId: string | null = null,
  period = "30d",
  authToken?: string,
): Promise<unknown> {
  return callTool("club_analytics", "get_user_stats", { userId, guildId, period }, authToken);
}

async function getGuildActivity(
  guildId: string,
  period = "7d",
  authToken?: string,
): Promise<unknown> {
  return callTool("club_analytics", "get_guild_activity", { guildId, period }, authToken);
}

async function getSnailLeaderboard(
  guildId: string | null = null,
  limit = 50,
  authToken?: string,
): Promise<unknown> {
  return callTool("club_analytics", "get_snail_leaderboard", { guildId, limit }, authToken);
}

async function createUserSheet(
  userId: string,
  title?: string,
  authToken?: string,
): Promise<unknown> {
  return callTool("google_sheets", "create_user_sheet", { userId, title }, authToken);
}

async function appendSnailData(
  spreadsheetId: string,
  data: Record<string, unknown>,
  authToken?: string,
): Promise<unknown> {
  return callTool("google_sheets", "append_snail_data", { spreadsheetId, data }, authToken);
}

async function getSheetData(
  spreadsheetId: string,
  range?: string,
  limit?: number,
  authToken?: string,
): Promise<unknown> {
  return callTool("google_sheets", "get_sheet_data", { spreadsheetId, range, limit }, authToken);
}

async function queryUsers(
  filters: Record<string, unknown>,
  authToken?: string,
): Promise<unknown> {
  return callTool("mysql_data", "query_users", filters, authToken);
}

async function queryMemories(
  filters: Record<string, unknown>,
  authToken?: string,
): Promise<unknown> {
  return callTool("mysql_data", "query_memories", filters, authToken);
}

async function healthCheck(): Promise<Record<string, unknown>> {
  const results: Record<string, unknown> = {};

  for (const [serverName, serverUrl] of Object.entries(MCP_SERVERS)) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${serverUrl}/health`, { signal: controller.signal });
      clearTimeout(timeout);
      results[serverName] = {
        healthy: response.status === 200,
        status: (await response.json().catch(() => null)),
      };
    } catch (err) {
      results[serverName] = {
        healthy: false,
        error: (err as Error).message,
      };
    }
  }

  return results;
}

export const mcpClient = {
  callTool,
  getUserStats,
  getGuildActivity,
  getSnailLeaderboard,
  createUserSheet,
  appendSnailData,
  getSheetData,
  queryUsers,
  queryMemories,
  healthCheck,
};

export default mcpClient;
