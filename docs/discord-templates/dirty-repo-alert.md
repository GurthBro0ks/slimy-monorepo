# Dirty Repository Alert Template

This template is used to warn when a production server or deployment environment has uncommitted changes or is out of sync with the remote repository.

## Purpose
- Alert team when production servers have local modifications
- Prevent configuration drift
- Identify potential security or compliance issues
- Help track down unauthorized changes

## Placeholders
- `{{hostname}}`: Server/container hostname with dirty repo
- `{{service_name}}`: Name of the service running on this host
- `{{environment}}`: Environment name (e.g., "production", "staging")
- `{{branch}}`: Current git branch
- `{{commit_sha}}`: Current HEAD commit SHA
- `{{uncommitted_files}}`: List of modified/uncommitted files
- `{{untracked_files}}`: List of untracked files
- `{{ahead_behind}}`: Sync status with remote (e.g., "ahead 2, behind 1")
- `{{timestamp}}`: ISO timestamp when check was performed
- `{{check_interval}}`: How often the check runs (e.g., "hourly", "every 15m")

## Discord Webhook JSON Example (Detailed)

```json
{
  "username": "Git Dirt Watch",
  "avatar_url": "https://i.imgur.com/4M34hi2.png",
  "content": "⚠️ Dirty repository detected on production host!",
  "embeds": [
    {
      "title": "🔧 Uncommitted Changes Detected",
      "description": "Host **{{hostname}}** has uncommitted changes in **{{service_name}}**",
      "color": 16776960,
      "fields": [
        {
          "name": "Environment",
          "value": "{{environment}}",
          "inline": true
        },
        {
          "name": "Branch",
          "value": "{{branch}}",
          "inline": true
        },
        {
          "name": "Commit",
          "value": "`{{commit_sha}}`",
          "inline": true
        },
        {
          "name": "Sync Status",
          "value": "{{ahead_behind}}",
          "inline": true
        },
        {
          "name": "Check Interval",
          "value": "{{check_interval}}",
          "inline": true
        },
        {
          "name": "Timestamp",
          "value": "{{timestamp}}",
          "inline": true
        },
        {
          "name": "Modified Files",
          "value": "```\n{{uncommitted_files}}\n```",
          "inline": false
        },
        {
          "name": "Untracked Files",
          "value": "```\n{{untracked_files}}\n```",
          "inline": false
        }
      ],
      "footer": {
        "text": "Review and commit changes, or reset to clean state"
      },
      "timestamp": "{{timestamp}}"
    }
  ]
}
```

## Simple Alert Example

```json
{
  "content": "⚠️ **Dirty Repo Alert**\nHost: `{{hostname}}` | Service: `{{service_name}}` | Env: `{{environment}}`\nModified: {{uncommitted_files}}\nUntracked: {{untracked_files}}"
}
```

## Minimal Example (for frequent checks)

```json
{
  "content": "🔧 {{hostname}} has uncommitted changes in {{service_name}} ({{environment}})"
}
```

## Usage with curl

```bash
#!/bin/bash
WEBHOOK_URL="https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN"

# Check if repo is dirty
cd /app/service-directory

if [[ -n $(git status --porcelain) ]]; then
  MODIFIED=$(git status --porcelain | grep '^ M' | cut -c4- | head -10 | tr '\n' ', ' | sed 's/,$//')
  UNTRACKED=$(git status --porcelain | grep '^??' | cut -c4- | head -10 | tr '\n', ' | sed 's/,$//')
  BRANCH=$(git branch --show-current)
  COMMIT=$(git rev-parse --short HEAD)
  HOSTNAME=$(hostname)

  # Send alert
  cat << EOF | curl -H "Content-Type: application/json" -X POST -d @- "$WEBHOOK_URL"
{
  "content": "⚠️ Dirty repository detected on production host!",
  "embeds": [{
    "title": "🔧 Uncommitted Changes Detected",
    "description": "Host **${HOSTNAME}** has uncommitted changes",
    "color": 16776960,
    "fields": [
      {"name": "Branch", "value": "${BRANCH}", "inline": true},
      {"name": "Commit", "value": "\`${COMMIT}\`", "inline": true},
      {"name": "Modified Files", "value": "\`\`\`\n${MODIFIED}\n\`\`\`", "inline": false},
      {"name": "Untracked Files", "value": "\`\`\`\n${UNTRACKED}\n\`\`\`", "inline": false}
    ],
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  }]
}
EOF
fi
```

## Integration with git-dirt-watch.sh

If you have a `git-dirt-watch.sh` script that monitors repositories:

```bash
# In your git-dirt-watch.sh script:
source ./discord-alert-helper.sh

if is_repo_dirty; then
  send_dirty_repo_alert \
    --hostname "$(hostname)" \
    --service "web" \
    --environment "production" \
    --uncommitted "$(get_modified_files)" \
    --untracked "$(get_untracked_files)"
fi
```
