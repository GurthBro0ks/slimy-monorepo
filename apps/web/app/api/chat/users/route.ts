import { NextRequest, NextResponse } from 'next/server';

// TODO: Import MCP client when available
// import { MCPClient } from '@/lib/mcp-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const guildId = searchParams.get('guildId');

    if (!guildId) {
      return NextResponse.json(
        { error: 'Guild ID is required' },
        { status: 400 }
      );
    }

    // TODO: Connect to MCP chat.service
    // const mcpClient = new MCPClient();
    // const users = await mcpClient.callTool('chat.service', 'getOnlineUsers', {
    //   guildId
    // });

    // Placeholder response
    const users = [
      { id: '1', username: 'Alex', color: '#06b6d4', status: 'online' },
      { id: '2', username: 'Brooke', color: '#ec4899', status: 'online' },
      { id: '3', username: 'Chris', color: '#eab308', status: 'online' },
      { id: '4', username: 'Devon', color: '#8b5cf6', status: 'online' },
    ];

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
