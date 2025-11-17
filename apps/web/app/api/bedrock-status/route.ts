import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface BedrockStatus {
  online: boolean;
  hostname?: string;
  port?: number;
  version?: string;
  protocol?: number;
  players?: {
    online: number;
    max: number;
  };
  motd?: string;
  gamemode?: string;
  latency?: number;
  error?: string;
}

export async function GET() {
  try {
    // Configuration for slime.craft server
    const hostname = process.env.BEDROCK_SERVER_HOST || 'slime.craft';
    const port = parseInt(process.env.BEDROCK_SERVER_PORT || '19132');

    // For now, we'll return a mock response
    // In production, this would use a Bedrock server query library
    // like bedrock-protocol or minecraft-server-util

    const startTime = Date.now();

    // Simulated server check
    // TODO: Implement actual Bedrock server status check using bedrock-protocol
    const status: BedrockStatus = {
      online: true,
      hostname,
      port,
      version: '1.21.3',
      protocol: 685,
      players: {
        online: 3,
        max: 20,
      },
      motd: 'Welcome to slime.craft - A chill place for weird science and creative builds',
      gamemode: 'Survival',
      latency: Date.now() - startTime,
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error checking Bedrock server status:', error);

    return NextResponse.json(
      {
        online: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      } as BedrockStatus,
      { status: 500 }
    );
  }
}
