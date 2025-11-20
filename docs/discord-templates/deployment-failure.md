# Deployment Failure Template

This template is used to alert a Discord channel when a deployment fails.

## Purpose
- Alert team immediately when deployments fail
- Provide error context and metadata
- Include actionable information for debugging
- Optionally tag on-call engineers or relevant team members

## Placeholders
- `{{service_name}}`: Name of the service/app that failed to deploy
- `{{environment}}`: Target environment (e.g., "production", "staging")
- `{{commit_sha}}`: Git commit SHA that was being deployed
- `{{branch}}`: Git branch name
- `{{deployer}}`: Username or system that triggered deployment
- `{{hostname}}`: Server/container hostname
- `{{timestamp}}`: ISO timestamp when failure occurred
- `{{error_snippet}}`: Short error message or stack trace (first few lines)
- `{{log_url}}`: Optional URL to full deployment logs
- `{{rollback_available}}`: "yes" or "no" - whether auto-rollback is possible

## Discord Webhook JSON Example (Rich Embed)

```json
{
  "username": "Deploy Bot",
  "avatar_url": "https://i.imgur.com/4M34hi2.png",
  "content": "@here ⚠️ Deployment failed for **{{service_name}}** in **{{environment}}**",
  "embeds": [
    {
      "title": "❌ Deployment Failed",
      "description": "**{{service_name}}** failed to deploy to **{{environment}}**",
      "color": 15158332,
      "fields": [
        {
          "name": "Commit",
          "value": "`{{commit_sha}}`",
          "inline": true
        },
        {
          "name": "Branch",
          "value": "{{branch}}",
          "inline": true
        },
        {
          "name": "Deployer",
          "value": "{{deployer}}",
          "inline": true
        },
        {
          "name": "Hostname",
          "value": "{{hostname}}",
          "inline": true
        },
        {
          "name": "Rollback Available",
          "value": "{{rollback_available}}",
          "inline": true
        },
        {
          "name": "Time",
          "value": "{{timestamp}}",
          "inline": true
        },
        {
          "name": "Error",
          "value": "```\n{{error_snippet}}\n```",
          "inline": false
        },
        {
          "name": "Logs",
          "value": "[View Full Logs]({{log_url}})",
          "inline": false
        }
      ],
      "footer": {
        "text": "slimy-monorepo deployment system"
      },
      "timestamp": "{{timestamp}}"
    }
  ]
}
```

## Simple Text-only Example

```json
{
  "content": "❌ **Deployment Failed** @here\nService: `{{service_name}}` | Env: `{{environment}}` | Commit: `{{commit_sha}}` | Branch: `{{branch}}`\nError: ```{{error_snippet}}```\nLogs: {{log_url}}"
}
```

## Minimal Alert Example

```json
{
  "content": "🚨 DEPLOY FAIL: {{service_name}} ({{environment}}) - {{error_snippet}}"
}
```

## Usage with curl

```bash
#!/bin/bash
WEBHOOK_URL="https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN"

# Capture error from deployment
ERROR_MSG=$(cat deploy-error.log | head -5 | sed 's/"/\\"/g')

# Build and send message
cat << EOF | curl -H "Content-Type: application/json" -X POST -d @- "$WEBHOOK_URL"
{
  "content": "@here ⚠️ Deployment failed for **web** in **production**",
  "embeds": [{
    "title": "❌ Deployment Failed",
    "description": "**web** failed to deploy to **production**",
    "color": 15158332,
    "fields": [
      {"name": "Commit", "value": "\`$(git rev-parse --short HEAD)\`", "inline": true},
      {"name": "Branch", "value": "$(git branch --show-current)", "inline": true},
      {"name": "Error", "value": "\`\`\`\n${ERROR_MSG}\n\`\`\`", "inline": false}
    ],
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  }]
}
EOF
```
