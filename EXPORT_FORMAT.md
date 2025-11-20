# Data Export Format Documentation

## Version 1.0.0

This document describes the format and structure of data exports from the Slimy.ai platform. Data exports are provided in JSON format for backup, data portability, and compliance purposes.

## Overview

Slimy.ai provides two types of data exports:

1. **Guild Exports** - Complete data export for a specific Discord guild/server
2. **User Exports** - Complete data export for an individual user

All exports follow a consistent structure with versioning to ensure backward compatibility and data integrity.

## Common Structure

All exports contain the following top-level fields:

```json
{
  "version": "1.0.0",           // Export format version
  "scope": "guild" | "user",    // Type of export
  "exportedAt": "ISO-8601",     // Export timestamp
  "userId": "string",           // (User exports only)
  "guildId": "string",          // (Guild exports only)
  // ... data sections ...
  "metadata": {                 // Export metadata
    "exportFormat": "JSON",
    "dataIntegrity": "Complete",
    "notes": []
  }
}
```

## Guild Export Format

### Endpoint
- **Admin API**: `GET /api/export/guild/:guildId`
- **Web API**: `GET /api/export/guild/:guildId`

### Access Control
- Requires authentication
- User must be a member of the guild OR have admin role
- Uses `requireGuildMember` middleware

### Query Parameters
- `maxChatMessages` (optional, default: 10000) - Maximum chat messages to include
- `maxStats` (optional, default: 10000) - Maximum statistics to include
- `maxAuditLogs` (optional, default: 5000) - Maximum audit logs to include

### Structure

```json
{
  "version": "1.0.0",
  "scope": "guild",
  "exportedAt": "2025-11-17T12:00:00.000Z",
  "guildId": "guild_cuid",

  "guild": {
    "id": "guild_cuid",
    "discordId": "1234567890",
    "name": "My Guild",
    "settings": { /* JSON settings */ },
    "createdAt": "ISO-8601",
    "updatedAt": "ISO-8601"
  },

  "members": {
    "count": 42,
    "data": [
      {
        "id": "userGuild_cuid",
        "userId": "user_cuid",
        "roles": [ /* role data */ ],
        "user": {
          "id": "user_cuid",
          "discordId": "9876543210",
          "username": "username",
          "globalName": "Global Name",
          "createdAt": "ISO-8601"
        }
      }
    ]
  },

  "statistics": {
    "count": 1500,
    "truncated": false,
    "data": [
      {
        "id": "stat_cuid",
        "userId": "user_cuid",
        "type": "message_count",
        "value": { /* JSON value */ },
        "timestamp": "ISO-8601"
      }
    ]
  },

  "chatMessages": {
    "count": 5000,
    "truncated": false,
    "data": [
      {
        "id": "message_cuid",
        "conversationId": "conv_cuid",
        "userId": "user_cuid",
        "text": "Message content",
        "adminOnly": false,
        "createdAt": "ISO-8601"
      }
    ]
  },

  "clubAnalyses": {
    "count": 10,
    "data": [
      {
        "id": "analysis_cuid",
        "userId": "user_cuid",
        "title": "Analysis title",
        "summary": "AI-generated summary",
        "confidence": 0.95,
        "createdAt": "ISO-8601",
        "updatedAt": "ISO-8601",
        "images": [
          {
            "id": "image_cuid",
            "imageUrl": "https://...",
            "originalName": "screenshot.png",
            "fileSize": 1024000,
            "uploadedAt": "ISO-8601"
          }
        ],
        "metrics": [
          {
            "id": "metric_cuid",
            "name": "totalMembers",
            "value": 42,
            "unit": "count",
            "category": "membership"
          }
        ]
      }
    ]
  },

  "auditLogs": {
    "count": 1000,
    "truncated": false,
    "data": [
      {
        "id": "audit_cuid",
        "userId": "user_cuid",
        "action": "chat_message",
        "resourceType": "chat",
        "resourceId": "message_cuid",
        "details": { /* JSON details */ },
        "sessionId": "session_cuid",
        "requestId": "req_uuid",
        "timestamp": "ISO-8601",
        "success": true,
        "errorMessage": null
      }
    ]
  },

  "metadata": {
    "exportFormat": "JSON",
    "dataIntegrity": "Complete",
    "notes": [
      "Chat messages limited to most recent 10000",
      "Statistics limited to most recent 10000",
      "Audit logs limited to most recent 5000",
      "IP addresses and user agents excluded from audit logs for privacy"
    ]
  }
}
```

## User Export Format

### Endpoint
- **Admin API**: `GET /api/export/user/me`
- **Web API**: `GET /api/export/user/me`

### Access Control
- Requires authentication
- User can only export their own data

### Query Parameters
- `maxChatMessages` (optional, default: 10000) - Maximum chat messages to include
- `maxStats` (optional, default: 10000) - Maximum statistics to include
- `maxAuditLogs` (optional, default: 5000) - Maximum audit logs to include

### Structure

```json
{
  "version": "1.0.0",
  "scope": "user",
  "exportedAt": "2025-11-17T12:00:00.000Z",
  "userId": "user_cuid",

  "user": {
    "id": "user_cuid",
    "discordId": "1234567890",
    "username": "username",
    "globalName": "Global Name",
    "avatar": "avatar_hash",
    "createdAt": "ISO-8601",
    "updatedAt": "ISO-8601"
  },

  "guilds": {
    "count": 5,
    "data": [
      {
        "id": "userGuild_cuid",
        "guildId": "guild_cuid",
        "roles": [ /* role data */ ],
        "guild": {
          "id": "guild_cuid",
          "discordId": "9876543210",
          "name": "Guild Name",
          "createdAt": "ISO-8601"
        }
      }
    ]
  },

  "conversations": {
    "count": 15,
    "data": [
      {
        "id": "conv_cuid",
        "title": "Conversation title",
        "createdAt": "ISO-8601",
        "updatedAt": "ISO-8601",
        "messages": [
          {
            "id": "message_cuid",
            "text": "Message content",
            "createdAt": "ISO-8601"
          }
        ]
      }
    ]
  },

  "chatMessages": {
    "count": 500,
    "truncated": false,
    "data": [ /* same structure as guild export */ ]
  },

  "statistics": {
    "count": 1000,
    "truncated": false,
    "data": [ /* same structure as guild export */ ]
  },

  "screenshotAnalyses": {
    "count": 20,
    "data": [
      {
        "id": "analysis_cuid",
        "screenshotType": "game-stats",
        "imageUrl": "https://...",
        "title": "Analysis title",
        "description": "Brief description",
        "summary": "AI-generated summary",
        "confidence": 0.92,
        "processingTime": 1500,
        "modelUsed": "claude-sonnet-4-5",
        "createdAt": "ISO-8601",
        "updatedAt": "ISO-8601",
        "data": [
          {
            "id": "data_cuid",
            "key": "level",
            "value": 42,
            "dataType": "number",
            "category": "stats",
            "confidence": 0.98
          }
        ],
        "tags": [
          {
            "id": "tag_cuid",
            "tag": "gaming",
            "category": "content"
          }
        ],
        "insights": [
          {
            "id": "insight_cuid",
            "type": "performance",
            "priority": "high",
            "title": "Insight title",
            "description": "Detailed description",
            "confidence": 0.95,
            "actionable": true,
            "createdAt": "ISO-8601"
          }
        ],
        "recommendations": [
          {
            "id": "rec_cuid",
            "type": "improvement",
            "priority": "medium",
            "title": "Recommendation title",
            "description": "Detailed description",
            "impact": "high",
            "effort": "low",
            "actionable": true,
            "createdAt": "ISO-8601"
          }
        ]
      }
    ]
  },

  "screenshotComparisons": {
    "count": 5,
    "data": [
      {
        "id": "comparison_cuid",
        "analysisId1": "analysis_cuid_1",
        "analysisId2": "analysis_cuid_2",
        "comparisonType": "trend",
        "summary": "Comparison summary",
        "trend": "improving",
        "differences": { /* JSON differences */ },
        "insights": { /* JSON insights */ },
        "createdAt": "ISO-8601"
      }
    ]
  },

  "clubAnalyses": {
    "count": 3,
    "data": [ /* same structure as guild export */ ]
  },

  "auditLogs": {
    "count": 500,
    "truncated": false,
    "data": [ /* same structure as guild export */ ]
  },

  "metadata": {
    "exportFormat": "JSON",
    "dataIntegrity": "Complete",
    "notes": [
      "Session tokens excluded for security",
      "Chat messages limited to most recent 10000",
      "Statistics limited to most recent 10000",
      "Audit logs limited to most recent 5000",
      "IP addresses and user agents excluded from audit logs for privacy"
    ]
  }
}
```

## Data Privacy & Security

### Excluded Data

The following data is **never** included in exports for security and privacy reasons:

- Session tokens and authentication credentials
- Password hashes
- Internal API keys or secrets
- IP addresses (from audit logs)
- User agent strings (from audit logs)
- Raw AI model responses (may contain sensitive data)

### Data Limits

To ensure reasonable file sizes and export performance:

- **Chat Messages**: Limited to 10,000 most recent (configurable)
- **Statistics**: Limited to 10,000 most recent (configurable)
- **Audit Logs**: Limited to 5,000 most recent (configurable)
- **Conversations**: All conversations included with all their messages

When data is truncated, the `truncated` field will be set to `true`.

## Data Integrity

All exports include:
- **Version field**: Ensures the export format is understood
- **Timestamp**: When the export was created
- **Metadata**: Additional context about the export
- **Consistent ID references**: All foreign keys are preserved

## Versioning

The export format follows semantic versioning:
- **Major version**: Breaking changes to the format
- **Minor version**: New fields or sections (backward compatible)
- **Patch version**: Bug fixes or clarifications

Current version: **1.0.0**

### Future Compatibility

Future versions will maintain backward compatibility by:
- Never removing existing fields (may deprecate)
- Adding new optional fields
- Providing migration guides for major version changes

## Usage Examples

### Download Guild Export (Browser)

```typescript
const response = await fetch(`/api/export/guild/${guildId}`);
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `guild-${guildId}-export.json`;
a.click();
```

### Download User Export (Browser)

```typescript
const response = await fetch('/api/export/user/me');
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'my-data-export.json';
a.click();
```

### Parse Export Data (Node.js)

```javascript
const fs = require('fs');
const exportData = JSON.parse(fs.readFileSync('export.json', 'utf8'));

console.log(`Export version: ${exportData.version}`);
console.log(`Export scope: ${exportData.scope}`);
console.log(`Exported at: ${exportData.exportedAt}`);

if (exportData.scope === 'guild') {
  console.log(`Guild: ${exportData.guild.name}`);
  console.log(`Members: ${exportData.members.count}`);
  console.log(`Messages: ${exportData.chatMessages.count}`);
}
```

## Support & Questions

For technical questions or issues with data exports:
- Check this documentation first
- Review the source code in `apps/admin-api/src/services/export/`
- Open an issue on GitHub

## Compliance

These exports are designed to support compliance with:
- **GDPR** (General Data Protection Regulation) - Right to data portability
- **CCPA** (California Consumer Privacy Act) - Right to know
- Other data protection regulations requiring user data access

## Changelog

### Version 1.0.0 (2025-11-17)
- Initial release
- Guild export functionality
- User export functionality
- Privacy-preserving defaults
- Configurable data limits
