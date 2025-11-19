# Discord Message Templates - Communication Kit

This directory contains pre-built Discord message templates for deployment notifications, incident alerts, and operational updates. These templates can be used by automation scripts, CI/CD pipelines, and monitoring tools.

## 📁 Contents

- **[deployment-success.md](./deployment-success.md)** - Notify successful deployments
- **[deployment-failure.md](./deployment-failure.md)** - Alert on deployment failures
- **[dirty-repo-alert.md](./dirty-repo-alert.md)** - Warn about uncommitted changes in production
- **[incident-template.md](./incident-template.md)** - Structured incident notifications and updates
- **[weekly-summary-template.md](./weekly-summary-template.md)** - Weekly operations summary reports

## 🎯 Quick Start

### Using with curl (Shell Scripts)

The simplest way to use these templates is with `curl` from any shell script:

```bash
#!/bin/bash
WEBHOOK_URL="https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_TOKEN"

# Send a simple deployment success message
curl -H "Content-Type: application/json" -X POST -d '{
  "content": "✅ **Deployment Success** | Service: `web` | Env: `production` | Commit: `abc123f`"
}' "$WEBHOOK_URL"
```

### Using Templates with sed/awk

Replace placeholders dynamically:

```bash
#!/bin/bash
WEBHOOK_URL="https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_TOKEN"

# Read template and replace placeholders
MESSAGE=$(cat docs/discord-templates/deployment-success.md | \
  sed -n '/```json/,/```/p' | sed '1d;$d' | \
  sed "s/{{service_name}}/web/g" | \
  sed "s/{{environment}}/production/g" | \
  sed "s/{{commit_sha}}/$(git rev-parse --short HEAD)/g" | \
  sed "s/{{branch}}/$(git branch --show-current)/g" | \
  sed "s/{{deployer}}/$USER/g" | \
  sed "s/{{hostname}}/$(hostname)/g" | \
  sed "s|{{timestamp}}|$(date -u +%Y-%m-%dT%H:%M:%SZ)|g")

curl -H "Content-Type: application/json" -X POST -d "$MESSAGE" "$WEBHOOK_URL"
```

### Using the TypeScript Package

For TypeScript/Node.js projects, use the strongly-typed template package:

```bash
cd packages/shared-ops-templates
pnpm install
pnpm build
```

Then in your code:

```typescript
import {
  deploymentSuccess,
  deploymentFailure,
  dirtyRepoAlert,
  incidentNew,
  weeklySummary,
  toJSON,
} from '@slimy/shared-ops-templates';

// Create a deployment success message
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

## 🔧 Integration Examples

### Example 1: Deployment Script

Add to your `deploy.sh`:

```bash
#!/bin/bash
set -e

SERVICE="web"
ENV="production"
WEBHOOK_URL="${DISCORD_WEBHOOK_URL}"

# Run deployment
if ./scripts/deploy-service.sh "$SERVICE" "$ENV"; then
  # Success
  COMMIT=$(git rev-parse --short HEAD)
  BRANCH=$(git branch --show-current)

  curl -H "Content-Type: application/json" -X POST -d "{
    \"content\": \"✅ **Deployment Success** | Service: \`${SERVICE}\` | Env: \`${ENV}\` | Commit: \`${COMMIT}\` | Branch: \`${BRANCH}\`\"
  }" "$WEBHOOK_URL"
else
  # Failure
  ERROR=$(tail -20 deploy.log | sed 's/"/\\"/g' | tr '\n' ' ')

  curl -H "Content-Type: application/json" -X POST -d "{
    \"content\": \"❌ **Deployment Failed** @here\\nService: \`${SERVICE}\` | Env: \`${ENV}\`\\nError: \`\`\`${ERROR}\`\`\`\"
  }" "$WEBHOOK_URL"

  exit 1
fi
```

### Example 2: Git Dirt Watch Cron Job

Monitor production servers for uncommitted changes:

```bash
#!/bin/bash
# /usr/local/bin/git-dirt-watch.sh

REPO_PATH="/app/production"
WEBHOOK_URL="${DISCORD_WEBHOOK_URL}"

cd "$REPO_PATH"

if [[ -n $(git status --porcelain) ]]; then
  HOSTNAME=$(hostname)
  SERVICE=$(basename "$REPO_PATH")
  MODIFIED=$(git status --porcelain | grep '^ M' | cut -c4- | tr '\n' ', ' | sed 's/,$//')
  UNTRACKED=$(git status --porcelain | grep '^??' | cut -c4- | tr '\n' ', ' | sed 's/,$//')

  curl -H "Content-Type: application/json" -X POST -d "{
    \"content\": \"⚠️ **Dirty Repo Alert**\\nHost: \`${HOSTNAME}\` | Service: \`${SERVICE}\`\\nModified: ${MODIFIED}\\nUntracked: ${UNTRACKED}\"
  }" "$WEBHOOK_URL"
fi
```

Add to crontab:

```bash
# Check for dirty repos every hour
0 * * * * /usr/local/bin/git-dirt-watch.sh >> /var/log/git-dirt-watch.log 2>&1
```

### Example 3: GitHub Actions Workflow

Use in `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy
        id: deploy
        run: ./scripts/deploy.sh

      - name: Notify Success
        if: success()
        run: |
          curl -H "Content-Type: application/json" -X POST -d '{
            "content": "✅ **Deployment Success** | Service: `web` | Env: `production` | Commit: `${{ github.sha }}` | By: ${{ github.actor }}"
          }' ${{ secrets.DISCORD_WEBHOOK_URL }}

      - name: Notify Failure
        if: failure()
        run: |
          curl -H "Content-Type: application/json" -X POST -d '{
            "content": "@here ❌ **Deployment Failed** | Service: `web` | Env: `production` | Commit: `${{ github.sha }}` | By: ${{ github.actor }}"
          }' ${{ secrets.DISCORD_WEBHOOK_URL }}
```

### Example 4: Incident Response

Declare and track incidents:

```bash
#!/bin/bash
# incident-declare.sh

INCIDENT_ID="INC-$(date +%Y%m%d-%H%M)"
WEBHOOK_URL="${DISCORD_WEBHOOK_URL}"

cat << EOF | curl -H "Content-Type: application/json" -X POST -d @- "$WEBHOOK_URL"
{
  "content": "@everyone 🚨 **CRITICAL INCIDENT DECLARED**",
  "embeds": [{
    "title": "🚨 P0/Critical: Database Connection Pool Exhausted",
    "description": "**Incident ID:** ${INCIDENT_ID}\n**Status:** INVESTIGATING",
    "color": 15158332,
    "fields": [
      {"name": "Affected Services", "value": "web, api", "inline": false},
      {"name": "Impact", "value": "Users unable to log in", "inline": false},
      {"name": "Incident Commander", "value": "@oncall", "inline": true},
      {"name": "Started At", "value": "$(date -u +%Y-%m-%dT%H:%M:%SZ)", "inline": true}
    ],
    "footer": {"text": "War room: #incident-${INCIDENT_ID}"},
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  }]
}
EOF

echo "Incident ${INCIDENT_ID} declared"
```

### Example 5: Weekly Summary (Cron)

Send weekly ops reports every Monday:

```bash
#!/bin/bash
# weekly-summary.sh

WEBHOOK_URL="${DISCORD_WEBHOOK_URL}"
WEEK_START=$(date -d "last monday" +%Y-%m-%d)
WEEK_END=$(date -d "last sunday" +%Y-%m-%d)

# Gather metrics from logs/database
TOTAL_DEPLOYS=23
SUCCESS_RATE=91

curl -H "Content-Type: application/json" -X POST -d "{
  \"embeds\": [{
    \"title\": \"📊 Weekly Operations Summary\",
    \"description\": \"**Week of ${WEEK_START} - ${WEEK_END}**\",
    \"color\": 3447003,
    \"fields\": [
      {\"name\": \"📦 Deployments\", \"value\": \"**Total:** ${TOTAL_DEPLOYS}\\n**Success Rate:** ${SUCCESS_RATE}%\", \"inline\": true}
    ]
  }]
}" "$WEBHOOK_URL"
```

Crontab entry:

```bash
# Send weekly summary every Monday at 9 AM
0 9 * * 1 /usr/local/bin/weekly-summary.sh >> /var/log/weekly-summary.log 2>&1
```

## 📝 Template Placeholders

### Common Placeholders

All templates use `{{placeholder}}` syntax:

| Placeholder | Description | Example |
|------------|-------------|---------|
| `{{service_name}}` | Service/app name | `web`, `api`, `admin` |
| `{{environment}}` | Deployment environment | `production`, `staging`, `dev` |
| `{{commit_sha}}` | Git commit SHA | `abc123f` |
| `{{branch}}` | Git branch | `main`, `develop` |
| `{{hostname}}` | Server hostname | `web-prod-01` |
| `{{timestamp}}` | ISO 8601 timestamp | `2025-01-19T10:30:00Z` |
| `{{deployer}}` | Username/system | `github-actions`, `john` |

See individual template files for complete placeholder documentation.

## 🎨 Discord Embed Colors

Discord uses decimal color codes:

- **Green (Success)**: `3066993`
- **Red (Error)**: `15158332`
- **Yellow (Warning)**: `16776960`
- **Blue (Info)**: `3447003`

## 🔐 Security Best Practices

### Webhook URL Protection

**Never commit webhook URLs to git!** Use environment variables:

```bash
# .env (add to .gitignore)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/123/abc

# In scripts
WEBHOOK_URL="${DISCORD_WEBHOOK_URL:-}"
if [[ -z "$WEBHOOK_URL" ]]; then
  echo "Error: DISCORD_WEBHOOK_URL not set"
  exit 1
fi
```

### Input Sanitization

Always escape user input to prevent injection:

```bash
# Bad - vulnerable to injection
MESSAGE="Deployed by $USER_INPUT"

# Good - escape special characters
MESSAGE="Deployed by $(echo "$USER_INPUT" | sed 's/"/\\"/g')"
```

### Rate Limiting

Discord webhooks have rate limits (30 requests/min per webhook). For high-frequency alerts, batch messages or use a queue.

## 🔗 Related Resources

- [Discord Webhook Documentation](https://discord.com/developers/docs/resources/webhook)
- [Discord Embed Visualizer](https://discohook.org/) - Test your embeds
- [Markdown Guide](https://support.discord.com/hc/en-us/articles/210298617-Markdown-Text-101-Chat-Formatting-Bold-Italic-Underline-)

## 📦 TypeScript Package Reference

The `@slimy/shared-ops-templates` package provides:

### Functions

- `deploymentSuccess(data)` - Rich deployment success embed
- `deploymentSuccessSimple(data)` - Simple text notification
- `deploymentFailure(data)` - Rich deployment failure embed
- `deploymentFailureSimple(data)` - Simple failure notification
- `dirtyRepoAlert(data)` - Dirty repository warning
- `dirtyRepoAlertSimple(data)` - Simple dirty repo alert
- `incidentNew(data)` - New incident declaration
- `incidentUpdate(data)` - Incident status update
- `incidentResolved(data)` - Incident resolution
- `weeklySummary(data)` - Comprehensive weekly report
- `weeklySummaryCompact(data)` - Compact weekly report

### Utilities

- `toJSON(payload)` - Convert payload to JSON string
- `escapeMarkdown(text)` - Escape Discord markdown
- `truncateFieldValue(text, maxLength)` - Truncate to Discord limits

### Types

All functions are strongly typed with TypeScript interfaces:

- `DeploymentSuccessData`
- `DeploymentFailureData`
- `DirtyRepoAlertData`
- `IncidentData`
- `WeeklySummaryData`
- `DiscordWebhookPayload`
- `DiscordEmbed`

See [discordTemplates.ts](../../packages/shared-ops-templates/src/discordTemplates.ts) for full API documentation.

## 🤝 Contributing

When adding new templates:

1. Create a new `.md` file in this directory
2. Include explanation, placeholders, and JSON examples
3. Add corresponding TypeScript function in `packages/shared-ops-templates/src/discordTemplates.ts`
4. Update this README with usage examples

## 📄 License

These templates are part of the slimy-monorepo and follow the same license.
