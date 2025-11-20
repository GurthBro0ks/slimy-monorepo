# Minecraft Status Widget

A self-contained, embeddable React widget for displaying real-time Minecraft server status information.

## Purpose

This widget provides a reusable UI component for showing Minecraft server status across both Java and Bedrock editions. It can be embedded in:

- Server listing pages
- Dashboard views
- Community websites
- Admin panels
- Personal server homepages

## Files

- **spec.md**: Complete specification including props, visual design, and behavior
- **example-props.json**: Sample data for both Java and Bedrock servers
- **README.md**: This file - usage guide and integration examples

## Props Interface

```typescript
interface MinecraftStatusWidgetProps {
  // Required
  serverName: string;
  isOnline: boolean;
  serverType: 'java' | 'bedrock';

  // Optional
  currentPlayers?: number | null;
  maxPlayers?: number | null;
  motd?: string | null;
  host?: string | null;
  port?: number | null;
  version?: string | null;
  lastChecked?: string | null;
  favicon?: string | null; // Base64 encoded image (Java only)
}
```

## Usage Example

### Basic Usage

```tsx
import { MinecraftStatusWidget } from '@/widgets/minecraft-status';

function ServerDashboard() {
  return (
    <MinecraftStatusWidget
      serverName="My Awesome Server"
      isOnline={true}
      serverType="java"
      currentPlayers={42}
      maxPlayers={100}
      motd="Welcome to the server!"
      host="mc.example.com"
      port={25565}
    />
  );
}
```

### With Real-time Data

```tsx
'use client';

import { MinecraftStatusWidget } from '@/widgets/minecraft-status';
import { useMinecraftServerStatus } from '@/hooks/useMinecraftServerStatus';

function LiveServerStatus({ serverId }: { serverId: string }) {
  const status = useMinecraftServerStatus(serverId);

  if (!status) {
    return <div>Loading server status...</div>;
  }

  return (
    <MinecraftStatusWidget
      serverName={status.name}
      isOnline={status.online}
      serverType={status.type}
      currentPlayers={status.players?.online}
      maxPlayers={status.players?.max}
      motd={status.motd}
      host={status.host}
      port={status.port}
      version={status.version}
      lastChecked={status.lastChecked}
      favicon={status.favicon}
    />
  );
}
```

### Multiple Servers (Grid Layout)

```tsx
import { MinecraftStatusWidget } from '@/widgets/minecraft-status';

function ServerGrid({ servers }: { servers: MinecraftServer[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {servers.map((server) => (
        <MinecraftStatusWidget
          key={server.id}
          serverName={server.name}
          isOnline={server.isOnline}
          serverType={server.type}
          currentPlayers={server.currentPlayers}
          maxPlayers={server.maxPlayers}
          motd={server.motd}
          host={server.host}
          port={server.port}
        />
      ))}
    </div>
  );
}
```

## Component Pseudo-code

Here's how a future React component implementation might look:

```tsx
// widgets/minecraft-status/MinecraftStatusWidget.tsx

import React from 'react';
import { formatDistanceToNow } from 'date-fns';

interface MinecraftStatusWidgetProps {
  serverName: string;
  isOnline: boolean;
  serverType: 'java' | 'bedrock';
  currentPlayers?: number | null;
  maxPlayers?: number | null;
  motd?: string | null;
  host?: string | null;
  port?: number | null;
  version?: string | null;
  lastChecked?: string | null;
  favicon?: string | null;
}

export function MinecraftStatusWidget(props: MinecraftStatusWidgetProps) {
  const {
    serverName,
    isOnline,
    serverType,
    currentPlayers,
    maxPlayers,
    motd,
    host,
    port,
    version,
    lastChecked,
    favicon
  } = props;

  // Determine status color and styling
  const statusColor = isOnline ? 'green' : 'red';
  const statusText = isOnline ? 'Online' : 'Offline';

  // Calculate player capacity percentage
  const capacityPercent =
    currentPlayers !== null && maxPlayers !== null
      ? (currentPlayers / maxPlayers) * 100
      : null;

  // Determine capacity color
  const getCapacityColor = () => {
    if (capacityPercent === null || !isOnline) return 'gray';
    if (capacityPercent < 50) return 'green';
    if (capacityPercent < 90) return 'yellow';
    return 'red';
  };

  // Format server address
  const defaultPort = serverType === 'java' ? 25565 : 19132;
  const showPort = port && port !== defaultPort;
  const serverAddress = host
    ? `${host}${showPort ? ':' + port : ''}`
    : null;

  // Parse Minecraft formatting codes (§ codes)
  const parseMotd = (text: string) => {
    // Convert § codes to HTML/CSS
    // This is simplified - real implementation would handle all color codes
    return text
      .replace(/§l/g, '<strong>')
      .replace(/§r/g, '</strong>')
      .replace(/§[0-9a-fk-or]/g, '');
  };

  // Format relative time
  const relativeTime = lastChecked
    ? formatDistanceToNow(new Date(lastChecked), { addSuffix: true })
    : null;

  return (
    <div className={`
      widget-card
      border-2 rounded-lg p-4
      border-${statusColor}-500
      bg-${statusColor}-50
    `}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Server Icon */}
          {favicon ? (
            <img
              src={favicon}
              alt={serverName}
              className="w-8 h-8"
            />
          ) : (
            <div className="w-8 h-8 bg-gray-300 rounded">
              {/* Default Minecraft icon */}
            </div>
          )}

          {/* Server Name */}
          <h3 className="text-lg font-bold">{serverName}</h3>
        </div>

        {/* Status Badge */}
        <span className={`
          px-3 py-1 rounded-full text-sm font-medium
          bg-${statusColor}-500 text-white
        `}>
          {statusText}
        </span>
      </div>

      {/* Server Details (only if online) */}
      {isOnline && (
        <div className="space-y-2">
          {/* Player Count */}
          {currentPlayers !== null && maxPlayers !== null && (
            <div className="flex items-center gap-2">
              <span className="text-2xl">👥</span>
              <span className={`text-${getCapacityColor()}-600`}>
                {currentPlayers}/{maxPlayers} players
              </span>
            </div>
          )}

          {/* Server Address */}
          {serverAddress && (
            <div className="flex items-center gap-2">
              <span className="text-2xl">📍</span>
              <span className="font-mono text-sm">{serverAddress}</span>
            </div>
          )}

          {/* MOTD */}
          {motd && (
            <div className="flex items-start gap-2">
              <span className="text-2xl">📝</span>
              <p
                className="text-sm text-gray-600 italic line-clamp-2"
                dangerouslySetInnerHTML={{ __html: parseMotd(motd) }}
              />
            </div>
          )}
        </div>
      )}

      {/* Footer Metadata */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          {relativeTime && (
            <span>Last checked: {relativeTime}</span>
          )}
          {version && (
            <span className="px-2 py-1 bg-gray-200 rounded">
              {serverType === 'java' ? '☕' : '📱'} {version}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
```

## Data Fetching

The widget is designed to be presentational - it displays data passed via props. For actual server status data, you'll need to:

### Option 1: Server-Side Fetching (Recommended)

```tsx
// app/servers/[id]/page.tsx (Next.js App Router)

import { MinecraftStatusWidget } from '@/widgets/minecraft-status';

async function getServerStatus(id: string) {
  // Fetch from your API or directly ping Minecraft server
  const res = await fetch(`https://api.mcsrvstat.us/3/${id}`);
  const data = await res.json();

  return {
    serverName: data.hostname || id,
    isOnline: data.online,
    serverType: data.version ? 'java' : 'bedrock',
    currentPlayers: data.players?.online,
    maxPlayers: data.players?.max,
    motd: data.motd?.clean?.join('\n'),
    host: id,
    port: data.port,
    version: data.version,
    lastChecked: new Date().toISOString(),
    favicon: data.icon,
  };
}

export default async function ServerPage({ params }: { params: { id: string } }) {
  const status = await getServerStatus(params.id);

  return (
    <div className="container mx-auto p-6">
      <MinecraftStatusWidget {...status} />
    </div>
  );
}
```

### Option 2: Client-Side with Auto-Refresh

```tsx
'use client';

import { useState, useEffect } from 'react';
import { MinecraftStatusWidget } from '@/widgets/minecraft-status';

export function LiveMinecraftStatus({ serverId }: { serverId: string }) {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      const res = await fetch(`/api/minecraft/status/${serverId}`);
      const data = await res.json();
      setStatus(data);
    };

    // Fetch immediately
    fetchStatus();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);

    return () => clearInterval(interval);
  }, [serverId]);

  if (!status) return <div>Loading...</div>;

  return <MinecraftStatusWidget {...status} />;
}
```

## Integration Roadmap

1. **Phase 1**: Create the React component based on this spec
2. **Phase 2**: Implement MOTD parsing for Minecraft formatting codes
3. **Phase 3**: Add API route for server status fetching
4. **Phase 4**: Integrate with database for server management
5. **Phase 5**: Add interactivity (click to copy, refresh button, etc.)
6. **Phase 6**: Implement auto-refresh and WebSocket updates

## Testing

When implementing, test with:

- Online Java servers (with and without players)
- Online Bedrock servers
- Offline servers
- Servers with custom ports
- Servers with special characters in MOTD
- Servers at various capacity levels (empty, half-full, nearly full)

See `example-props.json` for test data.

## Styling

The component should be styled to:
- Work with both light and dark themes
- Be responsive (mobile-friendly)
- Use Tailwind CSS (or CSS modules)
- Match the overall design system of the application

Refer to `spec.md` for detailed color and typography specifications.
