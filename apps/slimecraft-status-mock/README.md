# slime.craft Server Status - Mock API & UI

This is an **isolated mock implementation** of the slime.craft server status monitoring system. It provides a complete API structure and dashboard UI using static JSON data, with no external dependencies or network calls.

## Purpose

This mock module serves as:

1. **Design Reference** - Establishes the data structure and TypeScript interfaces for the real implementation
2. **UI Prototype** - Demonstrates the dashboard layout and user experience
3. **Development Tool** - Allows frontend development without backend dependencies
4. **Testing Fixture** - Provides consistent test data for integration testing

## Directory Structure

```
apps/slimecraft-status-mock/
├── package.json                    # Minimal Node/TS project config
├── README.md                       # This file
└── src/
    ├── api/
    │   └── status.ts               # TypeScript API with interfaces and mock data access
    ├── data/
    │   └── sample-status.json      # Static mock data for all server statuses
    └── web/
        ├── index.html              # Dashboard UI
        └── styles.css              # Dashboard styling
```

## Mock Data Structure

The `sample-status.json` file contains comprehensive mock data for:

- **Java Edition Server**
  - Online status, version, protocol
  - Player count and player list
  - TPS (ticks per second) metrics
  - Memory usage statistics
  - Server uptime

- **Bedrock Edition Server**
  - Online status, version, protocol
  - Player count
  - Gamemode
  - Server uptime

- **Map Renderer (Squaremap)**
  - Service type and URL
  - Last render timestamp
  - World information (Overworld, Nether, End)
  - Player counts per world

- **System Performance**
  - Overall health status
  - CPU usage and core count
  - Disk usage
  - Warning/alert messages

## TypeScript API

### Core Interfaces

```typescript
import { getMockStatus, type ServerStatus } from './src/api/status';

// Get full status
const status: ServerStatus = getMockStatus();

// Individual getters
const javaStatus = getMockJavaStatus();
const bedrockStatus = getMockBedrockStatus();
const mapStatus = getMockMapStatus();
const performance = getMockPerformanceMetrics();
```

### Key Types

- `ServerStatus` - Root status object
- `JavaServerStatus` - Java server details
- `BedrockServerStatus` - Bedrock server details
- `MapStatus` - Map renderer information
- `PerformanceMetrics` - System health metrics
- `TPSMetrics` - TPS measurements
- `PlayerStats` - Player count and list

See `src/api/status.ts` for complete type definitions.

## Running the Mock Dashboard

### Option 1: Simple HTTP Server

```bash
cd apps/slimecraft-status-mock/src/web
python3 -m http.server 8080
# Visit http://localhost:8080
```

### Option 2: Vite Dev Server (Recommended)

```bash
cd apps/slimecraft-status-mock
pnpm install
pnpm dev
# Visit http://localhost:5173
```

### Option 3: Express API Server

Create `src/api/server.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import { getMockStatus } from './status';

const app = express();
app.use(cors());

app.get('/api/mock-status', (req, res) => {
  res.json(getMockStatus());
});

app.listen(3001, () => {
  console.log('Mock API running on http://localhost:3001');
});
```

Run with:
```bash
pnpm serve
```

## Integration Plan

### Phase 1: API Routes (Next.js App Router)

The mock API will be integrated into the main Next.js application under these routes:

#### Proposed API Endpoints

```
GET /api/server/java          # Java server status
GET /api/server/bedrock       # Bedrock server status
GET /api/server/all           # Combined server status
GET /api/map/status           # Map renderer status
GET /api/performance          # System performance metrics
```

#### Example Integration

```typescript
// apps/web/app/api/server/java/route.ts
import { NextResponse } from 'next/server';
import { getJavaServerStatus } from '@/lib/minecraft/status';

export async function GET() {
  try {
    // Real implementation would query actual server
    const status = await getJavaServerStatus();
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch server status' },
      { status: 500 }
    );
  }
}
```

### Phase 2: Real Implementation

Replace mock data sources with actual implementations:

1. **Java Server** - Use `minecraft-server-util` or custom ping protocol
2. **Bedrock Server** - Use Bedrock protocol query
3. **Map Data** - Query Squaremap API endpoints
4. **Performance** - Integrate with server monitoring tools

#### Example Real Implementation

```typescript
// lib/minecraft/java-status.ts
import { status } from 'minecraft-server-util';
import type { JavaServerStatus } from '@slimecraft/status-mock';

export async function getJavaServerStatus(): Promise<JavaServerStatus> {
  const result = await status('play.slime.craft', 25565);

  return {
    status: 'online',
    host: 'play.slime.craft',
    port: 25565,
    version: result.version.name,
    protocol: result.version.protocol,
    players: {
      online: result.players.online,
      max: result.players.max,
      list: result.players.sample || []
    },
    motd: result.motd.clean,
    // ... map remaining fields
  };
}
```

### Phase 3: Frontend Integration

The HTML/CSS dashboard can be converted to React components:

```typescript
// components/ServerStatusCard.tsx
import { useServerStatus } from '@/hooks/useServerStatus';

export function JavaServerCard() {
  const { data, isLoading, error } = useServerStatus('/api/server/java');

  if (isLoading) return <CardSkeleton />;
  if (error) return <ErrorCard error={error} />;

  return (
    <Card>
      <CardHeader>
        <h2>Java Edition Server</h2>
        <StatusBadge status={data.status} />
      </CardHeader>
      <CardBody>
        <InfoRow label="Players" value={`${data.players.online} / ${data.players.max}`} />
        <InfoRow label="TPS" value={data.tps.current.toFixed(1)} />
        {/* ... */}
      </CardBody>
    </Card>
  );
}
```

### Phase 4: Real-time Updates

Add WebSocket or Server-Sent Events for live updates:

```typescript
// hooks/useRealtimeStatus.ts
import { useEffect, useState } from 'react';
import type { ServerStatus } from '@slimecraft/status-mock';

export function useRealtimeStatus() {
  const [status, setStatus] = useState<ServerStatus | null>(null);

  useEffect(() => {
    const eventSource = new EventSource('/api/status/stream');

    eventSource.onmessage = (event) => {
      setStatus(JSON.parse(event.data));
    };

    return () => eventSource.close();
  }, []);

  return status;
}
```

## Migration Checklist

When integrating this mock into the real application:

- [ ] Copy TypeScript interfaces to shared types package
- [ ] Implement real server status queries
- [ ] Create Next.js API routes matching the proposed structure
- [ ] Convert HTML/CSS to React components
- [ ] Add error handling and loading states
- [ ] Implement caching strategy (Redis/memory)
- [ ] Add rate limiting to prevent server spam
- [ ] Set up monitoring and alerting
- [ ] Create admin dashboard for configuration
- [ ] Add authentication for sensitive endpoints

## Environment Variables (Future)

```env
# Minecraft Server Configuration
JAVA_SERVER_HOST=play.slime.craft
JAVA_SERVER_PORT=25565
BEDROCK_SERVER_HOST=bedrock.slime.craft
BEDROCK_SERVER_PORT=19132

# Map Configuration
MAP_SERVICE_URL=https://map.slime.craft
MAP_API_KEY=your_api_key_here

# Cache Configuration
REDIS_URL=redis://localhost:6379
STATUS_CACHE_TTL=30

# Rate Limiting
STATUS_RATE_LIMIT=60
```

## Testing

Use the mock data for consistent testing:

```typescript
import { describe, it, expect } from 'vitest';
import { getMockStatus, getTPSHealth } from './src/api/status';

describe('Server Status', () => {
  it('should return valid status structure', () => {
    const status = getMockStatus();
    expect(status.servers.java.status).toBe('online');
    expect(status.servers.bedrock.players.online).toBeGreaterThan(0);
  });

  it('should calculate TPS health correctly', () => {
    expect(getTPSHealth(19.8)).toBe('healthy');
    expect(getTPSHealth(18.5)).toBe('degraded');
    expect(getTPSHealth(15.0)).toBe('critical');
  });
});
```

## Notes

- This module is **completely isolated** and makes **no network calls**
- All data is static and defined in `sample-status.json`
- The dashboard auto-refreshes every 30 seconds (but shows same data)
- Ready to be wired into the real Next.js app when backend is ready

## License

MIT - Part of the slimy-monorepo project
