# @slimy/shared-ops-templates

> Strongly-typed Discord message templates for operations automation

This package provides TypeScript functions for generating Discord webhook payloads for deployments, incidents, and operational notifications. All templates are pure functions with no runtime side effects.

## 📦 Installation

This package is part of the slimy-monorepo and can be used internally:

```bash
cd packages/shared-ops-templates
pnpm install
pnpm build
```

## 🚀 Quick Start

```typescript
import { deploymentSuccess, toJSON } from '@slimy/shared-ops-templates';

// Generate a deployment success message
const payload = deploymentSuccess({
  service_name: 'web',
  environment: 'production',
  commit_sha: 'abc123f',
  branch: 'main',
  deployer: 'github-actions',
  hostname: 'web-prod-01',
  timestamp: new Date().toISOString(),
  duration: '2m 15s',
  commit_url: 'https://github.com/user/repo/commit/abc123f',
});

// Send to Discord
await fetch(process.env.DISCORD_WEBHOOK_URL!, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: toJSON(payload),
});
```

## 📚 API Reference

### Deployment Templates

#### `deploymentSuccess(data: DeploymentSuccessData): DiscordWebhookPayload`

Generate a rich embed for successful deployments.

```typescript
const payload = deploymentSuccess({
  service_name: 'api',
  environment: 'staging',
  commit_sha: 'a1b2c3d',
  branch: 'feature/new-api',
  deployer: 'john',
  hostname: 'api-staging-02',
  timestamp: '2025-01-19T10:30:00Z',
  duration: '1m 45s',
  commit_url: 'https://github.com/org/repo/commit/a1b2c3d', // optional
});
```

#### `deploymentSuccessSimple(data: DeploymentSuccessData): DiscordWebhookPayload`

Generate a simple text-only deployment success message.

#### `deploymentFailure(data: DeploymentFailureData): DiscordWebhookPayload`

Generate a rich embed for failed deployments.

```typescript
const payload = deploymentFailure({
  service_name: 'web',
  environment: 'production',
  commit_sha: 'x9y8z7w',
  branch: 'main',
  deployer: 'github-actions',
  hostname: 'web-prod-01',
  timestamp: '2025-01-19T11:00:00Z',
  error_snippet: 'Error: Connection refused at database.connect()',
  log_url: 'https://logs.example.com/deploy/123', // optional
  rollback_available: 'yes',
});
```

#### `deploymentFailureSimple(data: DeploymentFailureData): DiscordWebhookPayload`

Generate a simple text-only deployment failure message.

### Repository Alerts

#### `dirtyRepoAlert(data: DirtyRepoAlertData): DiscordWebhookPayload`

Alert when a repository has uncommitted changes.

```typescript
const payload = dirtyRepoAlert({
  hostname: 'web-prod-01',
  service_name: 'web',
  environment: 'production',
  branch: 'main',
  commit_sha: 'abc123f',
  uncommitted_files: 'config/settings.json, .env.local',
  untracked_files: 'temp.log',
  ahead_behind: 'ahead 2, behind 1', // optional
  timestamp: '2025-01-19T12:00:00Z',
  check_interval: 'hourly', // optional
});
```

#### `dirtyRepoAlertSimple(data: DirtyRepoAlertData): DiscordWebhookPayload`

Generate a simple text-only dirty repo alert.

### Incident Management

#### `incidentNew(data: IncidentData): DiscordWebhookPayload`

Declare a new incident.

```typescript
const payload = incidentNew({
  incident_id: 'INC-2025-001',
  severity: 'P0/Critical',
  status: 'INVESTIGATING',
  title: 'Database Connection Pool Exhausted',
  description: 'Primary database connection pool is maxed out',
  affected_services: 'web, api, worker',
  impact: 'Users unable to log in or access data',
  started_at: '2025-01-19T10:00:00Z',
  detected_at: '2025-01-19T10:05:00Z',
  incident_commander: '@oncall-engineer',
  action_items: '1. Scale database connections\n2. Investigate connection leaks',
});
```

**Severity levels:** `'P0/Critical'` | `'P1/High'` | `'P2/Medium'` | `'P3/Low'`

**Status values:** `'DETECTED'` | `'INVESTIGATING'` | `'IDENTIFIED'` | `'MONITORING'` | `'RESOLVED'`

#### `incidentUpdate(data: IncidentData): DiscordWebhookPayload`

Post an update to an ongoing incident.

```typescript
const payload = incidentUpdate({
  incident_id: 'INC-2025-001',
  severity: 'P0/Critical',
  status: 'IDENTIFIED',
  title: 'Database Connection Pool Exhausted',
  description: 'Root cause identified',
  root_cause: 'Connection leak in analytics service',
  action_items: 'Deploying fix to analytics service',
  customer_impact: 'Login degraded, some requests timing out',
  // ... other required fields
});
```

#### `incidentResolved(data: IncidentData): DiscordWebhookPayload`

Mark an incident as resolved.

```typescript
const payload = incidentResolved({
  incident_id: 'INC-2025-001',
  severity: 'P0/Critical',
  status: 'RESOLVED',
  title: 'Database Connection Pool Exhausted',
  description: 'Fix deployed and verified',
  started_at: '2025-01-19T10:00:00Z',
  detected_at: '2025-01-19T10:05:00Z',
  resolved_at: '2025-01-19T11:30:00Z',
  duration: '1h 30m',
  root_cause: 'Connection leak in analytics service',
  action_items: 'Schedule post-mortem for tomorrow',
  // ... other required fields
});
```

### Weekly Reports

#### `weeklySummary(data: WeeklySummaryData): DiscordWebhookPayload`

Generate a comprehensive weekly operations summary.

```typescript
const payload = weeklySummary({
  week_start: '2025-01-13',
  week_end: '2025-01-19',
  total_deployments: 45,
  successful_deployments: 42,
  failed_deployments: 3,
  success_rate: 93,
  total_incidents: 2,
  incident_breakdown: 'P0: 1, P1: 1',
  total_downtime: 90,
  most_deployed_service: 'web (18 deploys)',
  deployment_list: '• web: 18\n• api: 15\n• worker: 12',
  incident_list: '• INC-001: Database issue (90m)\n• INC-002: Cache storm (15m)',
  top_contributors: '• alice (12)\n• bob (10)\n• charlie (8)',
  system_health: 'Healthy ✅',
  alerts_fired: 156,
  alerts_resolved: 152,
  notable_changes: '• Upgraded database to v14\n• Implemented new caching layer',
});
```

#### `weeklySummaryCompact(data: WeeklySummaryData): DiscordWebhookPayload`

Generate a compact weekly summary.

## 🛠️ Utility Functions

### `toJSON(payload: DiscordWebhookPayload): string`

Convert a payload to formatted JSON string.

```typescript
const json = toJSON(payload);
console.log(json);
```

### `escapeMarkdown(text: string): string`

Escape Discord markdown special characters.

```typescript
const escaped = escapeMarkdown('User *input* with _special_ chars');
// "User \\*input\\* with \\_special\\_ chars"
```

### `truncateFieldValue(text: string, maxLength?: number): string`

Truncate text to fit Discord field value limits (default 1024 chars).

```typescript
const truncated = truncateFieldValue(longErrorMessage, 500);
```

## 🎨 Constants

### `DISCORD_COLORS`

Pre-defined color constants for embeds:

```typescript
import { DISCORD_COLORS } from '@slimy/shared-ops-templates';

console.log(DISCORD_COLORS.SUCCESS); // 3066993 (green)
console.log(DISCORD_COLORS.ERROR);   // 15158332 (red)
console.log(DISCORD_COLORS.WARNING); // 16776960 (yellow)
console.log(DISCORD_COLORS.INFO);    // 3447003 (blue)
```

## 📖 Usage Examples

### Node.js Script

```typescript
import { deploymentSuccess, toJSON } from '@slimy/shared-ops-templates';
import { execSync } from 'child_process';

async function notifyDeployment() {
  const commit = execSync('git rev-parse --short HEAD').toString().trim();
  const branch = execSync('git branch --show-current').toString().trim();

  const payload = deploymentSuccess({
    service_name: 'web',
    environment: process.env.NODE_ENV || 'development',
    commit_sha: commit,
    branch,
    deployer: process.env.USER || 'unknown',
    hostname: require('os').hostname(),
    timestamp: new Date().toISOString(),
    duration: '2m 30s',
  });

  await fetch(process.env.DISCORD_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: toJSON(payload),
  });
}

notifyDeployment().catch(console.error);
```

### Express.js Middleware

```typescript
import express from 'express';
import { deploymentFailure, toJSON } from '@slimy/shared-ops-templates';

const app = express();

// Error handler that notifies Discord
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const payload = deploymentFailure({
    service_name: 'api',
    environment: process.env.NODE_ENV!,
    commit_sha: process.env.GIT_COMMIT || 'unknown',
    branch: process.env.GIT_BRANCH || 'unknown',
    deployer: 'api-server',
    hostname: require('os').hostname(),
    timestamp: new Date().toISOString(),
    error_snippet: err.stack?.split('\n').slice(0, 5).join('\n') || err.message,
    rollback_available: 'no',
  });

  fetch(process.env.DISCORD_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: toJSON(payload),
  }).catch(console.error);

  res.status(500).json({ error: 'Internal Server Error' });
});
```

## 📝 TypeScript Types

All data interfaces are exported:

```typescript
import type {
  DeploymentSuccessData,
  DeploymentFailureData,
  DirtyRepoAlertData,
  IncidentData,
  IncidentSeverity,
  IncidentStatus,
  WeeklySummaryData,
  DiscordWebhookPayload,
  DiscordEmbed,
} from '@slimy/shared-ops-templates';
```

## 🔗 Related

- [Markdown Templates](../../docs/discord-templates/README.md) - Markdown template documentation
- [Discord Webhook API](https://discord.com/developers/docs/resources/webhook)

## 📄 License

Part of slimy-monorepo.
