# Deployment Success Template

This template is used to notify a Discord channel when a deployment completes successfully.

## Purpose
- Notify team of successful deployments
- Provide deployment metadata (service, commit, branch, deployer)
- Include links to commit or deployment logs

## Placeholders
- `{{service_name}}`: Name of the service/app deployed (e.g., "web", "api", "admin")
- `{{environment}}`: Target environment (e.g., "production", "staging", "dev")
- `{{commit_sha}}`: Git commit SHA (short or full)
- `{{branch}}`: Git branch name
- `{{deployer}}`: Username or system that triggered deployment
- `{{hostname}}`: Server/container hostname where deployed
- `{{timestamp}}`: ISO timestamp of deployment
- `{{duration}}`: How long the deployment took
- `{{commit_url}}`: Optional URL to the commit on GitHub/GitLab

## Discord Webhook JSON Example

```json
{
  "username": "Deploy Bot",
  "avatar_url": "https://i.imgur.com/4M34hi2.png",
  "embeds": [
    {
      "title": "✅ Deployment Successful",
      "description": "**{{service_name}}** deployed to **{{environment}}**",
      "color": 3066993,
      "fields": [
        {
          "name": "Commit",
          "value": "[`{{commit_sha}}`]({{commit_url}})",
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
          "name": "Duration",
          "value": "{{duration}}",
          "inline": true
        },
        {
          "name": "Time",
          "value": "{{timestamp}}",
          "inline": true
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
  "content": "✅ **Deployment Success** | Service: `{{service_name}}` | Env: `{{environment}}` | Commit: `{{commit_sha}}` | Branch: `{{branch}}` | By: {{deployer}}"
}
```

## Usage with curl

```bash
#!/bin/bash
WEBHOOK_URL="https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN"

# Replace placeholders
MESSAGE=$(cat deployment-success.md | sed -n '/```json/,/```/p' | sed '1d;$d' | \
  sed "s/{{service_name}}/web/g" | \
  sed "s/{{environment}}/production/g" | \
  sed "s/{{commit_sha}}/abc123f/g" | \
  sed "s/{{branch}}/main/g" | \
  sed "s/{{deployer}}/github-actions/g" | \
  sed "s/{{hostname}}/web-prod-01/g" | \
  sed "s|{{timestamp}}|$(date -u +%Y-%m-%dT%H:%M:%SZ)|g" | \
  sed "s/{{duration}}/2m 15s/g" | \
  sed "s|{{commit_url}}|https://github.com/user/repo/commit/abc123f|g")

curl -H "Content-Type: application/json" -X POST -d "$MESSAGE" "$WEBHOOK_URL"
```
