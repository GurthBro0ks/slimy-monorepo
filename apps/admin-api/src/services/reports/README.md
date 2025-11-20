# Weekly Club Report Generator

Comprehensive weekly reporting system for club analytics.

## Features

- **Weekly Analytics Aggregation**: Pulls together club analytics data from the specified week
- **Summary Statistics**: Total members, average power delta, top performers
- **Multiple Output Formats**:
  - HTML for web dashboard display
  - Discord embeds for bot posting
  - JSON for API consumption

## Services

### `weeklyClubReport.js`

Main service for generating weekly club reports.

**Function**: `buildWeeklyClubReport(guildId, options)`

**Parameters**:
- `guildId` (string): The guild ID to generate report for
- `options.weekStart` (Date, optional): Week start date (defaults to current week Monday)

**Returns**: Promise<WeeklyReport>
```javascript
{
  guildId: string,
  weekStart: string, // ISO date
  weekEnd: string,   // ISO date
  summary: {
    totalMembers: number,
    avgPowerDelta: number,
    topGainers: Array<{ memberKey: string, powerDelta: number }>,
    topTierMembers: Array<{ memberKey: string, tier: string }>,
    totalAnalyses: number,
    avgConfidence: number
  },
  raw: { ... }, // Raw analytics data
  discordEmbeds: Array<DiscordEmbed>,
  html: string
}
```

## API Endpoints

### GET `/api/reports/weekly`

Generate and retrieve a weekly club report.

**Query Parameters**:
- `guildId` (required): Guild ID
- `weekStart` (optional): ISO date string for week start

**Example**:
```bash
GET /api/reports/weekly?guildId=guild-123&weekStart=2024-01-15T00:00:00Z
```

### POST `/api/reports/weekly/send-discord`

Generate report and send to Discord channel.

**Body**:
```json
{
  "guildId": "guild-123",
  "channelId": "channel-456",
  "weekStart": "2024-01-15T00:00:00Z" // optional
}
```

### GET `/api/reports/weekly/html`

Get just the HTML portion of the report.

**Query Parameters**:
- `guildId` (required): Guild ID
- `weekStart` (optional): ISO date string

## Frontend

### Page: `/club/reports/weekly`

Interactive UI for generating and viewing weekly reports:
- Configure guild and date range
- View summary statistics
- Download HTML report
- Send to Discord (when bot integration is complete)

## Discord Bot Command

### `/weeklyreport`

Slash command for posting reports directly in Discord.

**Options**:
- `week` (optional): Week start date in YYYY-MM-DD format

**Status**: Stub implementation - requires Discord bot integration

## TODO / Future Enhancements

### Data Integration
- [ ] Integrate with weekly deltas system (when implemented)
- [ ] Integrate with tiers system (when implemented)
- [ ] Integrate with seasons system (when implemented)
- [ ] Replace mock power delta calculations with real data
- [ ] Replace mock tier assignments with real data

### Features
- [ ] Add theming support (guild color schemes)
- [ ] Add localization support (multi-language reports)
- [ ] Add export to PDF
- [ ] Add email delivery option
- [ ] Add scheduled/automated report generation
- [ ] Add historical report comparison

### Discord Integration
- [ ] Wire up Discord bot client
- [ ] Implement actual Discord embed sending
- [ ] Add command permission checks
- [ ] Add rate limiting for Discord commands
- [ ] Add channel ID selection UI

### Performance
- [ ] Add caching for frequently accessed reports
- [ ] Optimize database queries
- [ ] Add pagination for large datasets
- [ ] Consider using a template engine (Handlebars/EJS) for complex HTML

### Safety
- [ ] Add rate limiting per guild
- [ ] Add input validation for custom date ranges
- [ ] Add access control (guild membership verification)
- [ ] Add audit logging for report generation

## Development

### Testing

```bash
# Test report generation
curl "http://localhost:3001/api/reports/weekly?guildId=test-guild"

# Test with specific week
curl "http://localhost:3001/api/reports/weekly?guildId=test-guild&weekStart=2024-01-15T00:00:00Z"
```

### Database Requirements

Requires the following database tables:
- `ClubAnalysis` - Club analytics records
- `ClubMetric` - Extracted metrics from analyses

Future requirements (when implemented):
- `WeeklyDeltas` - Weekly power delta calculations
- `MemberTiers` - Member tier assignments
- `Seasons` - Season tracking

### Dependencies

Backend (admin-api):
- `mysql2` - Database queries
- `zod` - Input validation
- `express` - Web framework

Frontend (web):
- Next.js 14 App Router
- React hooks
- Tailwind CSS + shadcn/ui components
