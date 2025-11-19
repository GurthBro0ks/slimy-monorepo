# Sample Data / Fixture Generator

This module generates realistic mock data for the Slimy.ai platform for use in local demos, testing, and development.

## Overview

The fixture generator creates mock data for all major entities in the Slimy.ai system:

- **Users** - Discord users with realistic usernames and profile data
- **Guilds** - Discord servers/clubs with settings and configurations
- **UserGuilds** - Membership relationships between users and guilds (with roles)
- **Club Analyses** - AI-generated club performance analyses with images and metrics
- **Screenshot Analyses** - AI-powered screenshot analysis results with data extraction
- **Stats** - User and guild statistics
- **Conversations & Messages** - Chat conversations and messages

## What This Script Does

The `generate-snail-club-fixtures.ts` script:

1. Generates realistic but **obviously fake** data (mock usernames, fake Discord IDs, etc.)
2. Writes JSON files to `tools/sample-data/output/*.json`
3. Does **NOT** write to any database
4. Does **NOT** make any API calls
5. Does **NOT** run automatically

## Usage

### Prerequisites

You need Node.js and either `ts-node` or `tsx` installed to run this TypeScript script.

```bash
# Install ts-node globally (if not already installed)
npm install -g ts-node

# OR install tsx
npm install -g tsx
```

### Running the Script

From the repository root:

```bash
# Using ts-node
ts-node tools/sample-data/generate-snail-club-fixtures.ts

# OR using tsx
tsx tools/sample-data/generate-snail-club-fixtures.ts

# OR make it executable and run directly
chmod +x tools/sample-data/generate-snail-club-fixtures.ts
./tools/sample-data/generate-snail-club-fixtures.ts
```

### Output

The script generates JSON files in `tools/sample-data/output/`:

```
tools/sample-data/output/
├── users.json                         # 16 mock users
├── guilds.json                        # 8 mock guilds/clubs
├── user-guilds.json                   # User-guild memberships
├── club-analyses.json                 # 20 club analyses
├── club-analysis-images.json          # Images for analyses
├── club-metrics.json                  # Performance metrics
├── screenshot-analyses.json           # 15 screenshot analyses
├── screenshot-data.json               # Extracted data points
├── screenshot-tags.json               # Tags for screenshots
├── screenshot-insights.json           # AI insights
├── screenshot-recommendations.json    # AI recommendations
├── stats.json                         # 50 statistics records
├── conversations.json                 # 10 conversations
└── chat-messages.json                 # Chat messages
```

## Generated Data Details

### Users (16 records)
Each user includes:
- Unique CUID and Discord ID
- Username and global name (e.g., "SpeedySnail42", "TurboSlug")
- Fake avatar URL
- Created/updated timestamps

### Guilds (8 records)
Each guild includes:
- Unique CUID and Discord ID
- Club name (e.g., "The Elite Snail Squad", "Slime Masters United")
- Settings JSON with features, timezone, welcome message
- Created/updated timestamps

### Club Analyses (20 records)
Each analysis includes:
- Associated guild and user
- Title and AI-generated summary
- Confidence score (0.7-0.99)
- 1-3 images with URLs and metadata
- 4-6 metrics with values, units, and categories:
  - `totalMembers`, `activeMembers` (membership)
  - `performanceScore`, `winRate`, `competitionRank` (performance)
  - `participationRate`, `averageSessionTime` (activity)

### Screenshot Analyses (15 records)
Each screenshot analysis includes:
- Screenshot type (game-stats, leaderboard, achievement, performance-metrics)
- AI model used (gpt-4-vision, claude-3-opus, gemini-pro-vision)
- Processing time and confidence score
- 3-6 data points extracted (level, score, rank, username, timestamp)
- 2-4 tags (high-performance, leaderboard-top-10, achievement-unlocked)
- 1-3 insights with priority and confidence
- 1-3 recommendations with impact/effort estimates

### Stats (50 records)
Statistics for users or guilds:
- Types: message_count, command_usage, session_duration, achievement_unlocked, level_up, competition_joined
- Numeric or float values
- Timestamps from the last 30 days

### Conversations & Messages
- 10 conversations with optional titles
- 3-8 messages per conversation
- Realistic message text
- 10% of messages marked as admin-only

## Using These Fixtures

### In Tests

You can load these JSON files in your test suites:

```typescript
import users from '../tools/sample-data/output/users.json';
import guilds from '../tools/sample-data/output/guilds.json';

describe('User Tests', () => {
  it('should process mock users', () => {
    const mockUser = users[0];
    // Use mockUser in your test
  });
});
```

### In Local Development

Load fixtures into your local database:

```typescript
// Example seed script (NOT included - you must create this yourself)
import { PrismaClient } from '@prisma/client';
import users from './tools/sample-data/output/users.json';

const prisma = new PrismaClient();

async function seed() {
  for (const user of users) {
    await prisma.user.create({ data: user });
  }
}
```

### In API Demos

Return fixture data directly from mock API endpoints:

```typescript
// Example mock endpoint
import clubAnalyses from './tools/sample-data/output/club-analyses.json';

app.get('/api/mock/club-analyses', (req, res) => {
  res.json(clubAnalyses);
});
```

## Important Notes

### Safety

- This script is **safe to run** - it only writes JSON files, no database or API calls
- All data is **obviously fake** (mock usernames, fake URLs, random IDs)
- The script must be **manually invoked** - it does not run automatically

### Customization

You can modify `generate-snail-club-fixtures.ts` to:
- Change the number of records generated
- Add new entity types
- Customize mock data values
- Add more realistic data patterns

### Integration

This module is **completely standalone**:
- It is NOT imported anywhere in the codebase
- It does NOT affect any existing code paths
- You must manually wire it into tests or demos as needed

### Schema Alignment

The fixtures are based on the Prisma schema in `apps/admin-api/prisma/schema.prisma`. If the schema changes, you may need to update this generator to match.

## Troubleshooting

### TypeScript Errors

If you get TypeScript errors about missing modules:

```bash
# Install Node.js types
npm install --save-dev @types/node

# Or run with --transpileOnly flag
ts-node --transpileOnly tools/sample-data/generate-snail-club-fixtures.ts
```

### Permission Errors

If you can't run the script:

```bash
# Make it executable
chmod +x tools/sample-data/generate-snail-club-fixtures.ts

# Then run it
./tools/sample-data/generate-snail-club-fixtures.ts
```

### Output Directory Issues

The script automatically creates `tools/sample-data/output/` if it doesn't exist. If you have permission issues, create it manually:

```bash
mkdir -p tools/sample-data/output
```

## Future Enhancements

Potential improvements for this fixture generator:

- Add support for more entity types (sessions, audit logs)
- Generate relational data that's more interconnected
- Add CLI arguments for customizing output (e.g., `--users=50`)
- Support different output formats (CSV, SQL, YAML)
- Add data validation against Prisma schema
- Generate realistic time series data for metrics

## License

This is part of the Slimy.ai codebase and follows the same license as the main project.
