# Incident Template

This template is used for critical incident notifications and status updates during outages or major issues.

## Purpose
- Alert team of critical incidents (outages, security breaches, data loss)
- Provide structured incident updates
- Track incident lifecycle from detection to resolution
- Maintain incident timeline for post-mortems

## Incident Lifecycle States
1. **DETECTED** - Incident identified, investigation starting
2. **INVESTIGATING** - Team is diagnosing the issue
3. **IDENTIFIED** - Root cause found, working on fix
4. **MONITORING** - Fix deployed, monitoring for stability
5. **RESOLVED** - Incident fully resolved

## Placeholders
- `{{incident_id}}`: Unique incident identifier (e.g., "INC-2025-001")
- `{{severity}}`: Severity level (P0/Critical, P1/High, P2/Medium, P3/Low)
- `{{status}}`: Current incident status (DETECTED, INVESTIGATING, IDENTIFIED, MONITORING, RESOLVED)
- `{{title}}`: Brief incident title
- `{{description}}`: Detailed description of the issue
- `{{affected_services}}`: Comma-separated list of affected services
- `{{impact}}`: User impact description
- `{{started_at}}`: When incident started (ISO timestamp)
- `{{detected_at}}`: When incident was detected (ISO timestamp)
- `{{resolved_at}}`: When incident was resolved (ISO timestamp, if applicable)
- `{{duration}}`: How long the incident lasted
- `{{incident_commander}}`: Person leading incident response
- `{{responders}}`: Team members responding
- `{{root_cause}}`: Known or suspected root cause
- `{{action_items}}`: Current action items or next steps
- `{{customer_impact}}`: Customer-facing impact statement

## Discord Webhook JSON Example (New Incident)

```json
{
  "username": "Incident Bot",
  "avatar_url": "https://i.imgur.com/4M34hi2.png",
  "content": "@everyone 🚨 **CRITICAL INCIDENT DECLARED**",
  "embeds": [
    {
      "title": "🚨 {{severity}}: {{title}}",
      "description": "**Incident ID:** {{incident_id}}\n**Status:** {{status}}",
      "color": 15158332,
      "fields": [
        {
          "name": "Affected Services",
          "value": "{{affected_services}}",
          "inline": false
        },
        {
          "name": "Impact",
          "value": "{{impact}}",
          "inline": false
        },
        {
          "name": "Description",
          "value": "{{description}}",
          "inline": false
        },
        {
          "name": "Incident Commander",
          "value": "{{incident_commander}}",
          "inline": true
        },
        {
          "name": "Started At",
          "value": "{{started_at}}",
          "inline": true
        },
        {
          "name": "Detected At",
          "value": "{{detected_at}}",
          "inline": true
        },
        {
          "name": "Current Actions",
          "value": "{{action_items}}",
          "inline": false
        }
      ],
      "footer": {
        "text": "War room: #incident-{{incident_id}}"
      },
      "timestamp": "{{detected_at}}"
    }
  ]
}
```

## Discord Webhook JSON Example (Incident Update)

```json
{
  "username": "Incident Bot",
  "avatar_url": "https://i.imgur.com/4M34hi2.png",
  "embeds": [
    {
      "title": "📢 Incident Update: {{incident_id}}",
      "description": "**{{title}}**\n**Status:** {{status}}",
      "color": 16776960,
      "fields": [
        {
          "name": "Root Cause",
          "value": "{{root_cause}}",
          "inline": false
        },
        {
          "name": "Next Steps",
          "value": "{{action_items}}",
          "inline": false
        },
        {
          "name": "Customer Impact",
          "value": "{{customer_impact}}",
          "inline": false
        }
      ],
      "footer": {
        "text": "Incident Commander: {{incident_commander}}"
      },
      "timestamp": "{{detected_at}}"
    }
  ]
}
```

## Discord Webhook JSON Example (Incident Resolved)

```json
{
  "username": "Incident Bot",
  "avatar_url": "https://i.imgur.com/4M34hi2.png",
  "content": "✅ Incident {{incident_id}} has been **RESOLVED**",
  "embeds": [
    {
      "title": "✅ Incident Resolved: {{title}}",
      "description": "**Incident ID:** {{incident_id}}\n**Status:** RESOLVED",
      "color": 3066993,
      "fields": [
        {
          "name": "Severity",
          "value": "{{severity}}",
          "inline": true
        },
        {
          "name": "Duration",
          "value": "{{duration}}",
          "inline": true
        },
        {
          "name": "Started At",
          "value": "{{started_at}}",
          "inline": true
        },
        {
          "name": "Resolved At",
          "value": "{{resolved_at}}",
          "inline": true
        },
        {
          "name": "Root Cause",
          "value": "{{root_cause}}",
          "inline": false
        },
        {
          "name": "Resolution",
          "value": "{{description}}",
          "inline": false
        },
        {
          "name": "Follow-up Actions",
          "value": "{{action_items}}",
          "inline": false
        }
      ],
      "footer": {
        "text": "Post-mortem will be shared in #incidents"
      },
      "timestamp": "{{resolved_at}}"
    }
  ]
}
```

## Simple Text Examples

### New Incident
```json
{
  "content": "🚨 @everyone **{{severity}} INCIDENT**\n**{{incident_id}}**: {{title}}\n**Affected**: {{affected_services}}\n**Impact**: {{impact}}\n**IC**: {{incident_commander}}\n**War Room**: #incident-{{incident_id}}"
}
```

### Status Update
```json
{
  "content": "📢 **{{incident_id}} Update**\n**Status**: {{status}}\n{{description}}\n**Next**: {{action_items}}"
}
```

### Resolved
```json
{
  "content": "✅ **{{incident_id}} RESOLVED** (Duration: {{duration}})\n{{description}}\nPost-mortem: TBD"
}
```

## Usage with curl

```bash
#!/bin/bash
WEBHOOK_URL="https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN"

# Declare new incident
INCIDENT_ID="INC-$(date +%Y%m%d-%H%M)"
START_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)

cat << EOF | curl -H "Content-Type: application/json" -X POST -d @- "$WEBHOOK_URL"
{
  "content": "@everyone 🚨 **CRITICAL INCIDENT DECLARED**",
  "embeds": [{
    "title": "🚨 P0/Critical: Database Connection Pool Exhausted",
    "description": "**Incident ID:** ${INCIDENT_ID}\n**Status:** INVESTIGATING",
    "color": 15158332,
    "fields": [
      {"name": "Affected Services", "value": "web, api", "inline": false},
      {"name": "Impact", "value": "Users unable to log in or load data", "inline": false},
      {"name": "Incident Commander", "value": "@oncall-engineer", "inline": true},
      {"name": "Started At", "value": "${START_TIME}", "inline": true}
    ],
    "footer": {"text": "War room: #incident-${INCIDENT_ID}"},
    "timestamp": "${START_TIME}"
  }]
}
EOF
```
