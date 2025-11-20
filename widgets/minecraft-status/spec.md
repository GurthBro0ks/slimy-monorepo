# Minecraft Status Widget Specification

## Overview

A self-contained, embeddable widget that displays the real-time status of a Minecraft server (Java or Bedrock edition). The widget should be visually compact yet informative, suitable for embedding in dashboards, server lists, or any webpage.

## Props Definition

The widget accepts the following props:

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `serverName` | `string` | Display name of the Minecraft server |
| `isOnline` | `boolean` | Server online/offline status |
| `serverType` | `'java' \| 'bedrock'` | Minecraft server edition type |

### Optional Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `currentPlayers` | `number \| null` | Number of players currently online | `null` |
| `maxPlayers` | `number \| null` | Maximum player capacity | `null` |
| `motd` | `string \| null` | Message of the Day (server description) | `null` |
| `host` | `string \| null` | Server hostname/IP address | `null` |
| `port` | `number \| null` | Server port | `null` |
| `version` | `string \| null` | Server version (e.g., "1.20.1") | `null` |
| `lastChecked` | `string \| null` | ISO timestamp of last status check | `null` |
| `favicon` | `string \| null` | Base64-encoded favicon (Java servers only) | `null` |

## Visual Design

### Layout

The widget should use a card-based layout with the following sections:

```
┌─────────────────────────────────────────┐
│ [Icon] Server Name              [Badge] │
│                                         │
│ 👥 12/100 players                       │
│ 📍 mc.example.com:25565                 │
│ 📝 Welcome to our server!               │
│                                         │
│ Last checked: 2 minutes ago             │
└─────────────────────────────────────────┘
```

### Components

#### 1. Header Section
- **Server Icon**: Either server favicon (if available) or default Minecraft block icon
- **Server Name**: Bold, prominent text
- **Status Badge**: Visual indicator of online/offline status

#### 2. Status Indicator
Position: Top-right corner or next to server name

**Online State:**
- Color: Green (`#10b981` or similar)
- Icon: Green circle or checkmark
- Text: "Online"

**Offline State:**
- Color: Red (`#ef4444` or similar)
- Icon: Red circle or X mark
- Text: "Offline"

**Unknown State:**
- Color: Gray (`#6b7280` or similar)
- Icon: Gray circle or question mark
- Text: "Unknown"

#### 3. Player Count
- Format: `X/Y players` where X = current, Y = max
- Icon: User/group icon (👥)
- Only display if both `currentPlayers` and `maxPlayers` are available
- Color: Use a visual indicator for capacity:
  - Green: < 50% full
  - Yellow: 50-90% full
  - Red: > 90% full
  - Gray: Offline or unknown

#### 4. Server Address
- Format: `host:port` (e.g., `mc.example.com:25565`)
- Icon: Location pin or server icon (📍)
- Optional: Hide port if it's the default (25565 for Java, 19132 for Bedrock)
- Only display if `host` is provided

#### 5. MOTD (Message of the Day)
- Display server description/welcome message
- Icon: Note/message icon (📝)
- Text styling: Italic or secondary text color
- Truncate if too long (max 2 lines with ellipsis)
- Parse Minecraft formatting codes if present (§ codes)

#### 6. Metadata Footer
- Display `lastChecked` timestamp in relative format ("2 minutes ago")
- Small, muted text
- Optional: Display `version` and `serverType` badges

### Color States

| State | Primary Color | Background | Border |
|-------|---------------|------------|--------|
| Online | `#10b981` (green) | `#ecfdf5` | `#10b981` |
| Offline | `#ef4444` (red) | `#fef2f2` | `#ef4444` |
| Unknown | `#6b7280` (gray) | `#f9fafb` | `#6b7280` |

### Typography

- **Server Name**: 18px, bold, primary color
- **Body Text**: 14px, regular
- **Metadata**: 12px, muted color

### Spacing

- Padding: 16px
- Gap between elements: 8px
- Border radius: 8px

## Responsive Behavior

- **Desktop (≥768px)**: Full layout with all details
- **Mobile (<768px)**: Compact layout, stack elements vertically, hide less critical info (like server address)

## Accessibility

- Use semantic HTML elements
- Include ARIA labels for status indicators
- Ensure color contrast meets WCAG AA standards
- Support keyboard navigation if interactive

## Future Enhancements

- Auto-refresh capability (ping server every N seconds)
- Click to copy server address
- Player list tooltip
- Historical uptime graph
- Animated transitions for status changes
