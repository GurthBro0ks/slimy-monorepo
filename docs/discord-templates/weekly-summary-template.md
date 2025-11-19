# Weekly Summary Template

This template is used to send automated weekly summaries of deployments, incidents, and system health.

## Purpose
- Provide weekly operations summary to team
- Track deployment frequency and success rates
- Summarize incidents and downtime
- Highlight system health metrics
- Share notable changes or improvements

## Placeholders
- `{{week_start}}`: Start date of the week (e.g., "2025-01-13")
- `{{week_end}}`: End date of the week (e.g., "2025-01-19")
- `{{total_deployments}}`: Total number of deployments
- `{{successful_deployments}}`: Number of successful deployments
- `{{failed_deployments}}`: Number of failed deployments
- `{{success_rate}}`: Deployment success rate percentage
- `{{total_incidents}}`: Total incidents during the week
- `{{incident_breakdown}}`: Breakdown by severity (e.g., "P0: 1, P1: 3, P2: 5")
- `{{total_downtime}}`: Total downtime in minutes
- `{{most_deployed_service}}`: Service with most deployments
- `{{deployment_list}}`: Bullet list of notable deployments
- `{{incident_list}}`: Bullet list of incidents
- `{{top_contributors}}`: Top deployers/contributors
- `{{system_health}}`: Overall system health score or status
- `{{alerts_fired}}`: Number of alerts fired
- `{{alerts_resolved}}`: Number of alerts resolved
- `{{notable_changes}}`: Bullet list of notable changes or improvements

## Discord Webhook JSON Example (Comprehensive)

```json
{
  "username": "Weekly Ops Report",
  "avatar_url": "https://i.imgur.com/4M34hi2.png",
  "embeds": [
    {
      "title": "📊 Weekly Operations Summary",
      "description": "**Week of {{week_start}} - {{week_end}}**",
      "color": 3447003,
      "fields": [
        {
          "name": "📦 Deployments",
          "value": "**Total:** {{total_deployments}}\n**Success:** {{successful_deployments}} ✅\n**Failed:** {{failed_deployments}} ❌\n**Success Rate:** {{success_rate}}%",
          "inline": true
        },
        {
          "name": "🚨 Incidents",
          "value": "**Total:** {{total_incidents}}\n**Breakdown:** {{incident_breakdown}}\n**Downtime:** {{total_downtime}} min",
          "inline": true
        },
        {
          "name": "🔔 Alerts",
          "value": "**Fired:** {{alerts_fired}}\n**Resolved:** {{alerts_resolved}}\n**Health:** {{system_health}}",
          "inline": true
        },
        {
          "name": "🏆 Most Active Service",
          "value": "{{most_deployed_service}}",
          "inline": true
        },
        {
          "name": "👥 Top Contributors",
          "value": "{{top_contributors}}",
          "inline": true
        },
        {
          "name": "Notable Deployments",
          "value": "{{deployment_list}}",
          "inline": false
        },
        {
          "name": "Incidents Summary",
          "value": "{{incident_list}}",
          "inline": false
        },
        {
          "name": "✨ Notable Changes",
          "value": "{{notable_changes}}",
          "inline": false
        }
      ],
      "footer": {
        "text": "slimy-monorepo weekly report • Generated automatically"
      },
      "timestamp": "{{week_end}}T23:59:59Z"
    }
  ]
}
```

## Discord Webhook JSON Example (Compact)

```json
{
  "username": "Weekly Ops Report",
  "avatar_url": "https://i.imgur.com/4M34hi2.png",
  "embeds": [
    {
      "title": "📊 Week {{week_start}} - {{week_end}}",
      "color": 3447003,
      "description": "**Deployments:** {{total_deployments}} ({{success_rate}}% success)\n**Incidents:** {{total_incidents}} ({{total_downtime}}m downtime)\n**Alerts:** {{alerts_fired}} fired, {{alerts_resolved}} resolved\n**Health:** {{system_health}}",
      "fields": [
        {
          "name": "Top Deployments",
          "value": "{{deployment_list}}",
          "inline": false
        }
      ],
      "timestamp": "{{week_end}}T23:59:59Z"
    }
  ]
}
```

## Simple Text Example

```json
{
  "content": "📊 **Weekly Summary** ({{week_start}} - {{week_end}})\n\n**Deployments:** {{total_deployments}} total, {{success_rate}}% success rate\n**Incidents:** {{total_incidents}} incidents, {{total_downtime}}m downtime\n**System Health:** {{system_health}}\n**Top Service:** {{most_deployed_service}}\n\n**Notable This Week:**\n{{notable_changes}}"
}
```

## Usage with curl

```bash
#!/bin/bash
WEBHOOK_URL="https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN"

# Calculate week dates
WEEK_START=$(date -d "last monday" +%Y-%m-%d)
WEEK_END=$(date -d "last sunday" +%Y-%m-%d)

# Gather metrics (example - replace with actual log parsing)
TOTAL_DEPLOYS=23
SUCCESS_DEPLOYS=21
FAILED_DEPLOYS=2
SUCCESS_RATE=$((SUCCESS_DEPLOYS * 100 / TOTAL_DEPLOYS))
TOTAL_INCIDENTS=4
DOWNTIME_MIN=45

# Build deployment list
DEPLOY_LIST="• web: 8 deployments\n• api: 7 deployments\n• admin: 5 deployments\n• worker: 3 deployments"

# Build incident list
INCIDENT_LIST="• INC-001: Database connection pool exhausted (15m)\n• INC-002: Redis cache miss storm (20m)\n• INC-003: API rate limit misconfiguration (5m)\n• INC-004: Deployment rollback - config error (5m)"

# Send summary
cat << EOF | curl -H "Content-Type: application/json" -X POST -d @- "$WEBHOOK_URL"
{
  "username": "Weekly Ops Report",
  "embeds": [{
    "title": "📊 Weekly Operations Summary",
    "description": "**Week of ${WEEK_START} - ${WEEK_END}**",
    "color": 3447003,
    "fields": [
      {
        "name": "📦 Deployments",
        "value": "**Total:** ${TOTAL_DEPLOYS}\n**Success:** ${SUCCESS_DEPLOYS} ✅\n**Failed:** ${FAILED_DEPLOYS} ❌\n**Success Rate:** ${SUCCESS_RATE}%",
        "inline": true
      },
      {
        "name": "🚨 Incidents",
        "value": "**Total:** ${TOTAL_INCIDENTS}\n**Downtime:** ${DOWNTIME_MIN} min",
        "inline": true
      },
      {
        "name": "Notable Deployments",
        "value": "${DEPLOY_LIST}",
        "inline": false
      },
      {
        "name": "Incidents Summary",
        "value": "${INCIDENT_LIST}",
        "inline": false
      }
    ],
    "footer": {"text": "slimy-monorepo weekly report • Generated automatically"},
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  }]
}
EOF
```

## Automated Weekly Cron Job

Add to crontab to send every Monday at 9 AM:

```bash
# Weekly ops summary every Monday at 9 AM
0 9 * * 1 /path/to/send-weekly-summary.sh >> /var/log/weekly-summary.log 2>&1
```

## Integration Example

If you have log aggregation or metrics collection:

```bash
#!/bin/bash
# send-weekly-summary.sh

# Query deployment database/logs
METRICS=$(./scripts/gather-weekly-metrics.sh)

# Parse metrics
TOTAL_DEPLOYS=$(echo "$METRICS" | jq -r '.deployments.total')
SUCCESS_RATE=$(echo "$METRICS" | jq -r '.deployments.success_rate')

# Use template and send
./scripts/discord-send.sh weekly-summary \
  --week-start "$WEEK_START" \
  --week-end "$WEEK_END" \
  --total-deployments "$TOTAL_DEPLOYS" \
  --success-rate "$SUCCESS_RATE"
```
