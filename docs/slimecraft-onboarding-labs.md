# Slime.Craft Labs Page - Onboarding & Status

## Overview

This document describes the Slime.Craft onboarding page created under the `/labs/slimecraft` route. This page provides server information, live status monitoring, and instructions for joining the Minecraft server from both Java and Bedrock editions.

## Page Location

**Route:** `/labs/slimecraft`
**File:** `apps/web/app/labs/slimecraft/page.tsx`

## Features

### 1. Server Status Display
- Real-time server status (online/offline)
- Current player count and maximum capacity
- Server version information
- Server address and port information

### 2. Connection Instructions

#### Java Edition (PC)
1. Launch Minecraft Java Edition
2. Click on **Multiplayer**
3. Click **Add Server**
4. Enter server details:
   - Server Name: `slime.craft`
   - Server Address: `mc.slimyai.xyz`
5. Click **Done**, then join the server

#### Bedrock Edition (Xbox, Switch, Mobile, Windows 10/11)
1. Launch Minecraft Bedrock Edition
2. Go to **Play** tab
3. Click **Servers** tab at the top
4. Scroll down and click **Add Server**
5. Enter server details:
   - Server Name: `slime.craft`
   - Server Address: `mc.slimyai.xyz`
   - Port: `19132`
6. Click **Save**, then join the server

**Note:** Console players may need to add the server through the Xbox app or use third-party tools like BedrockConnect.

## Implementation Details

### Server Information
- **Host:** `mc.slimyai.xyz`
- **Java Port:** `25565` (default)
- **Bedrock Port:** `19132`

### Status API Endpoint

The page is designed to fetch status from `/api/bedrock-status`, which is referenced in the Caddyfile configuration:

**Location:** `infra/docker/Caddyfile.slimy-nuc2:10`

```caddy
@bedrock_api_slime path /api/bedrock-status /api/bedrock-status/*
reverse_proxy @bedrock_api_slime 127.0.0.1:3000 {
  flush_interval -1
}
```

### Current Status Hook

**File:** `apps/web/app/labs/slimecraft/useBedrockStatus.ts`

The `useBedrockStatus` hook is currently returning **mock data** because the API endpoint has not been implemented yet.

**Expected API Response Shape:**
```typescript
interface ServerStatus {
  online: boolean;
  players?: {
    online: number;
    max: number;
  };
  version?: string;
  motd?: string;
  latency?: number;
}
```

## TODOs

### 1. Implement Real Status API
Create the bedrock status API endpoint:

**File to create:** `apps/web/app/api/bedrock-status/route.ts`

**Suggested implementation:**
```typescript
import { NextResponse } from 'next/server';
import { status } from 'minecraft-server-util'; // or similar library

export async function GET() {
  try {
    const result = await status('mc.slimyai.xyz', 25565);

    return NextResponse.json({
      online: true,
      players: {
        online: result.players.online,
        max: result.players.max,
      },
      version: result.version.name,
      motd: result.motd.clean,
      latency: result.roundTripLatency,
    });
  } catch (error) {
    return NextResponse.json(
      { online: false, error: 'Server unreachable' },
      { status: 503 }
    );
  }
}
```

**Dependencies needed:**
```bash
pnpm add minecraft-server-util
```

### 2. Wire into Main Navigation
Once the page is tested and the status API is working:
- Add link to main navigation header
- Consider adding to the home page features grid
- Add to site footer links

### 3. Environment Configuration
Consider adding server configuration to environment variables:
```env
MINECRAFT_SERVER_HOST=mc.slimyai.xyz
MINECRAFT_JAVA_PORT=25565
MINECRAFT_BEDROCK_PORT=19132
```

### 4. Enhanced Features (Future)
- Player list (if enabled on server)
- Server MOTD display
- Online/offline player history charts
- Server performance metrics
- Discord integration for server events
- Whitelist application form

## Testing

To test the page locally:

1. Start the development server:
   ```bash
   pnpm dev
   ```

2. Navigate to: `http://localhost:3000/labs/slimecraft`

3. Verify:
   - Page loads without errors
   - Mock status data displays correctly
   - Connection instructions are clear and readable
   - Responsive design works on mobile and desktop

## Integration with Existing Codebase

This implementation follows existing patterns:
- Uses shadcn/ui components (Card, Badge, Button)
- Follows Tailwind CSS styling conventions
- Uses "use client" directive for client-side interactivity
- Matches the neon-green, purple, and blue color scheme
- Uses lucide-react icons

**No existing code was modified** - this is a completely isolated feature under the `/labs` namespace.

## Related Files

- `apps/web/app/labs/slimecraft/page.tsx` - Main page component
- `apps/web/app/labs/slimecraft/useBedrockStatus.ts` - Status fetching hook
- `infra/docker/Caddyfile.slimy-nuc2` - Server configuration referencing the API endpoint

## Questions?

For questions or issues with the Slime.Craft page, check:
1. This documentation file
2. Code comments in the implementation files
3. TODOs marked in the codebase
