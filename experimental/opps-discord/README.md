# Opps-API Discord Integration Stubs

**Status: Experimental - NOT wired into the actual Slimy Discord bot yet**

This directory contains Discord command handler stubs for the opps-api radar functionality. These are ready-to-integrate handlers that can be imported into the actual Discord bot when ready.

## What's Inside

### API Client (`src/apiClient.ts`)
- Framework-agnostic HTTP client for the opps-api
- Configurable via `OPPS_API_BASE_URL` environment variable (defaults to `http://localhost:4010`)
- Main function: `fetchRadarSnapshot(params)` - fetches scored opportunities from the radar endpoint
- Built-in error handling and health checks

### Command Handlers
- **`src/commands/radarQuick.ts`** - Quick radar scan (3 items per domain)
- **`src/commands/radarDaily.ts`** - Daily comprehensive radar scan (5 items per domain)

Both commands:
- Use a generic `RadarCommandContext` interface for framework independence
- Format results to fit within Discord's 2000-character message limit
- Include friendly error messages when the opps-api is unavailable
- Support both plain text and rich embed responses

### Types (`src/types.ts`)
Type definitions matching the opps-api response schema:
- `RadarSnapshot` - Complete radar response
- `ScoredOpportunity` - Individual opportunity with score and metadata
- `RadarQueryParams` - Query parameters for the radar endpoint

## How to Integrate (Future Work)

These stubs are **NOT** currently registered with the Discord bot. To wire them up:

1. **Import the handlers** into your Discord bot command router:
   ```typescript
   import { handleRadarQuick } from '@slimy/opps-discord/commands/radarQuick';
   import { handleRadarDaily } from '@slimy/opps-discord/commands/radarDaily';
   ```

2. **Adapt the context** - Map your Discord.js (or other framework) interaction to the `RadarCommandContext`:
   ```typescript
   // Example with discord.js
   client.on('interactionCreate', async (interaction) => {
     if (interaction.commandName === 'radar-quick') {
       await handleRadarQuick({
         userId: interaction.user.id,
         userName: interaction.user.username,
         reply: (content) => interaction.reply(content),
         replyEmbed: (embed) => interaction.reply({ embeds: [embed] }),
       });
     }
   });
   ```

3. **Configure environment** - Set the opps-api URL:
   ```bash
   OPPS_API_BASE_URL=http://localhost:4010
   # or for production:
   OPPS_API_BASE_URL=https://opps-api.slimy.ai
   ```

4. **Register slash commands** - Add command definitions to your Discord bot:
   ```typescript
   const commands = [
     {
       name: 'radar-quick',
       description: 'Get a quick radar scan of current opportunities',
     },
     {
       name: 'radar-daily',
       description: 'Get your comprehensive daily radar summary',
     },
   ];
   ```

## Architecture Notes

- **No Discord.js dependency** - These handlers use a generic context interface, making them testable and framework-agnostic
- **Type-safe** - Full TypeScript support with strict mode enabled
- **Error resilient** - Graceful handling of API unavailability
- **Character limits** - Output is truncated to fit Discord's 2000-character message limit
- **Modular** - API client can be reused for other integrations (CLI, web, etc.)

## Development

```bash
# Type-check the code
pnpm type-check

# Build (compiles TypeScript)
pnpm build
```

## Testing Without a Bot

You can test the API client independently:

```typescript
import { fetchRadarSnapshot } from './src/apiClient.js';

const snapshot = await fetchRadarSnapshot({
  mode: 'quick',
  maxPerDomain: 3,
  discordUserId: 'test-user-123',
});

console.log(snapshot);
```

## Current Limitations

- Not registered with the actual Discord bot
- No authentication/authorization yet
- No rate limiting
- No user preference storage
- No scheduled daily digests

These will be addressed when integrating with the actual bot infrastructure.

## Related Services

- **opps-api** (`experimental/opps-api`) - The backend API that powers these commands
- **bot** (`apps/bot`) - The main Slimy Discord bot (not yet integrated)

---

**Remember:** This is experimental code. Do not expect these commands to work in the live Discord bot until proper integration is completed.
