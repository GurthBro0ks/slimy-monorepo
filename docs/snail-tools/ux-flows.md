# Snail Tools UX Flows

## Overview

**Snail Tools** is a comprehensive toolkit designed for Super Snail game players, providing automated assistance for game progression, resource management, and community engagement. The system integrates Discord authentication, web-based interfaces, and AI-powered analysis to deliver a seamless player experience.

### Core Features

1. **Secret Codes Hub**: Aggregates active redemption codes from multiple sources (Snelp API, Reddit r/SuperSnailGame, community submissions)
2. **Screenshot Analysis**: AI-powered analysis of game screenshots using GPT-4 Vision API to extract stats, loadout, and Pentagon data
3. **Stats Tracking**: Historical progress tracking with automated logging to Google Sheets
4. **Tier Calculator**: Resource requirement calculations for upgrade planning
5. **Community Timeline**: Real-time feed of game events, updates, and community activities

### System Architecture

The Snail Tools ecosystem consists of four integrated systems:

- **Discord Bot**: Authentication provider, member verification, and guild management
- **Web UI**: User-facing dashboard and tool interfaces (`/snail/*` routes)
- **Admin API**: Backend services handling uploads, AI analysis, data storage (`/api/snail/*` endpoints)
- **Admin Panel**: Guild management interface for administrators and moderators

---

## Flow 1: First-Time User Journey (Discord → Snail Analysis)

This flow describes a new user's experience from initial Discord authentication through their first screenshot analysis.

```
┌─────────────────────────────────────────────────────────────────────────┐
│ FLOW 1: FIRST-TIME USER LINKING DISCORD → USING SNAIL ANALYSIS         │
└─────────────────────────────────────────────────────────────────────────┘

[START] User visits Snail Tools website
   │
   ├──> [WEB UI] Landing page shows Snail Dashboard with locked features
   │         │
   │         └─> Display: "Connect Discord to unlock all features"
   │
   v
┌──────────────────────────────────┐
│ STEP 1: AUTHENTICATION           │
│ System: Web UI + Discord OAuth   │
└──────────────────────────────────┘
   │
   ├──> User clicks "Connect Discord" button
   │
   ├──> [WEB UI] Redirects to Discord OAuth flow
   │         │
   │         └─> Scopes: identify, guilds, guilds.members.read
   │
   ├──> [DISCORD] User authorizes application
   │
   ├──> [WEB UI] Receives OAuth callback with user token
   │
   ├──> [ADMIN API] Validates token, fetches user profile
   │         │
   │         ├─> Retrieves: user.id, username, globalName
   │         ├─> Retrieves: guild memberships
   │         └─> Assigns role: "member" (default)
   │
   ├──> [WEB UI] Session created, JWT issued
   │
   v
┌──────────────────────────────────┐
│ STEP 2: GUILD VERIFICATION       │
│ System: Admin API                │
└──────────────────────────────────┘
   │
   ├──> [ADMIN API] Checks guild membership requirements
   │         │
   │         ├─> Validates user is member of authorized guilds
   │         ├─> Checks minimum role requirements
   │         └─> Result: ✓ Authorized or ✗ Access denied
   │
   ├──> IF authorized:
   │      │
   │      └──> [WEB UI] Unlocks feature access, shows Snail Dashboard
   │
   ├──> IF not authorized:
   │      │
   │      └──> [WEB UI] Shows: "Join our Discord server to access features"
   │               └─> Provides Discord invite link
   │
   v
┌──────────────────────────────────┐
│ STEP 3: ONBOARDING TOUR          │
│ System: Web UI                   │
└──────────────────────────────────┘
   │
   ├──> [WEB UI] First-time banner appears
   │         │
   │         └─> "Welcome! Upload a screenshot to get started"
   │
   ├──> User views dashboard layout:
   │      │
   │      ├─> Left: Snail Timeline (community events feed)
   │      └─> Right: Quick Tools panel
   │               ├─> Secret Codes (available)
   │               ├─> Analyze Screenshot (available)
   │               ├─> Stats Tracking (coming soon)
   │               ├─> Tier Calculator (coming soon)
   │               └─> Help & Guides (coming soon)
   │
   v
┌──────────────────────────────────┐
│ STEP 4: FIRST SCREENSHOT UPLOAD  │
│ System: Web UI + Admin API       │
└──────────────────────────────────┘
   │
   ├──> User clicks "Analyze Screenshot" tool
   │
   ├──> [WEB UI] Shows upload interface:
   │         │
   │         ├─> Drag-and-drop zone
   │         ├─> File picker button
   │         ├─> Help text: "Upload 1-8 images, max 10MB each"
   │         └─> Optional prompt field: "Add context (e.g., 'compare to last week')"
   │
   ├──> User selects file(s) from device
   │      │
   │      └─> UI validates: file count ≤ 8, each file ≤ 10MB
   │
   ├──> [WEB UI] Shows file preview thumbnails
   │         │
   │         └─> Each thumbnail shows: filename, size, remove button
   │
   ├──> User (optionally) enters custom prompt
   │
   ├──> User clicks "Analyze" button
   │
   v
┌──────────────────────────────────┐
│ STEP 5: ANALYSIS PROCESSING      │
│ System: Admin API + OpenAI       │
└──────────────────────────────────┘
   │
   ├──> [WEB UI] State: uploading
   │         │
   │         └─> Display: Progress bar, "Uploading screenshots..."
   │
   ├──> [ADMIN API] POST /api/snail/:guildId/analyze
   │         │
   │         ├─> CSRF token validation
   │         ├─> Auth middleware: requireAuth, requireRole("member")
   │         ├─> Guild membership check
   │         └─> Multer processes multipart upload
   │
   ├──> Files saved to: /uploads/snail/:guildId/:timestamp-:filename
   │
   ├──> [WEB UI] State: analyzing
   │         │
   │         └─> Display: Spinner, "AI is analyzing your screenshots..."
   │
   ├──> [ADMIN API] For each uploaded image:
   │         │
   │         ├─> Read file buffer
   │         ├─> Convert to base64 data URL
   │         ├─> Call OpenAI Vision API with prompt:
   │         │    │
   │         │    └─> Default: "Analyze Super Snail game stats and loadout"
   │         │         OR custom user prompt
   │         │
   │         └─> Receive analysis result
   │
   ├──> [ADMIN API] Aggregates all results
   │         │
   │         ├─> Creates analysis record:
   │         │    {
   │         │      guildId, userId, prompt,
   │         │      results: [{ file, uploadedBy, analysis }],
   │         │      uploadedAt: ISO timestamp
   │         │    }
   │         │
   │         └─> Saves to: /data/snail/:guildId/:userId/latest.json
   │
   ├──> [ADMIN API] Records metrics
   │         │
   │         └─> Increments: images_analyzed counter
   │
   v
┌──────────────────────────────────┐
│ STEP 6: RESULTS DISPLAY          │
│ System: Web UI                   │
└──────────────────────────────────┘
   │
   ├──> [WEB UI] State: success
   │         │
   │         └─> Display: "Analysis complete!"
   │
   ├──> For each analyzed screenshot:
   │      │
   │      ├─> Show image thumbnail
   │      ├─> Display AI analysis text
   │      ├─> Highlight extracted stats:
   │      │    ├─> Pentagon stats (if detected)
   │      │    ├─> Resource counts (if detected)
   │      │    └─> Loadout composition (if detected)
   │      │
   │      └─> Copy button for sharing results
   │
   ├──> User reviews analysis
   │      │
   │      ├─> Option: "Analyze more screenshots"
   │      ├─> Option: "View stats history"
   │      └─> Option: "Share to Discord"
   │
   v
[END] User returns to dashboard, now familiar with the flow
```

---

## Flow 2: Returning User Uploading New Screenshots

This flow describes the streamlined experience for users who have already authenticated and completed their first analysis.

```
┌─────────────────────────────────────────────────────────────────────────┐
│ FLOW 2: RETURNING USER UPLOADING NEW SCREENSHOTS                       │
└─────────────────────────────────────────────────────────────────────────┘

[START] User visits Snail Dashboard (authenticated session exists)
   │
   ├──> [WEB UI] Auto-loads user session from JWT cookie
   │         │
   │         └─> Validates: token expiry, guild membership
   │
   v
┌──────────────────────────────────┐
│ STEP 1: QUICK ACCESS             │
│ System: Web UI                   │
└──────────────────────────────────┘
   │
   ├──> [WEB UI] Dashboard displays familiar layout
   │         │
   │         ├─> Left: Snail Timeline with latest events
   │         │         │
   │         │         └─> Shows: new codes, game updates, community milestones
   │         │
   │         └─> Right: Quick Tools panel
   │                  └─> "Analyze Screenshot" shows:
   │                       "Last upload: 2 hours ago" (if recent)
   │
   ├──> User has 3 entry points:
   │      │
   │      ├─> [A] Click "Analyze Screenshot" in Quick Tools
   │      ├─> [B] Click "View previous analysis" link
   │      └─> [C] Use keyboard shortcut (if implemented)
   │
   v
┌──────────────────────────────────┐
│ STEP 2: UPLOAD INTERFACE         │
│ System: Web UI                   │
└──────────────────────────────────┘
   │
   ├──> [WEB UI] Shows upload page with smart defaults:
   │         │
   │         ├─> Recent prompt auto-filled (if user preference enabled)
   │         ├─> Previous file names shown (optional reference)
   │         └─> Quick help tips collapsed (user already knows the flow)
   │
   ├──> User uploads screenshot(s) via:
   │      │
   │      ├─> Drag-and-drop (primary)
   │      ├─> File picker
   │      ├─> Paste from clipboard (if supported)
   │      └─> Mobile: camera capture or gallery select
   │
   ├──> [WEB UI] Instant client-side validation:
   │         │
   │         ├─> File type: .jpg, .jpeg, .png, .webp
   │         ├─> File size: each ≤ 10MB
   │         ├─> Count: 1-8 files
   │         │
   │         └─> IF validation fails:
   │              │
   │              ├─> Shows error inline (red border, error text)
   │              └─> Example: "File too large (12.3MB). Max 10MB per image."
   │
   v
┌──────────────────────────────────┐
│ STEP 3: BATCH PROCESSING         │
│ System: Admin API + OpenAI       │
└──────────────────────────────────┘
   │
   ├──> User customizes prompt (optional):
   │      │
   │      └─> Example: "Focus on resource changes since yesterday"
   │
   ├──> User clicks "Analyze" button
   │
   ├──> [WEB UI] State: uploading → analyzing
   │         │
   │         └─> Shows progress for each file:
   │              │
   │              ├─> File 1/3: Uploading... ▓▓▓▓▓▓░░ 75%
   │              ├─> File 2/3: Analyzing... ⟳
   │              └─> File 3/3: Queued... ⏳
   │
   ├──> [ADMIN API] Processes uploads in parallel:
   │         │
   │         ├─> Saves files to guild directory
   │         ├─> Converts each to base64 data URL
   │         └─> Calls OpenAI Vision API concurrently (rate limit: 3 req/sec)
   │
   ├──> [WEB UI] Shows live progress updates via:
   │         │
   │         ├─> WebSocket updates (if available)
   │         └─> OR polling /api/snail/:guildId/status endpoint
   │
   v
┌──────────────────────────────────┐
│ STEP 4: RESULTS + COMPARISON     │
│ System: Web UI                   │
└──────────────────────────────────┘
   │
   ├──> [WEB UI] State: success
   │         │
   │         └─> Display: "3 screenshots analyzed successfully"
   │
   ├──> Results page shows:
   │      │
   │      ├─> [Section 1] Latest Analysis
   │      │    │
   │      │    └─> Each screenshot with AI insights
   │      │
   │      ├─> [Section 2] Comparison (if previous data exists)
   │      │    │
   │      │    ├─> "Changes since last upload:"
   │      │    ├─> Stat deltas: +1.2M resources, +5 levels, etc.
   │      │    └─> Visual diff: green = improved, red = decreased
   │      │
   │      └─> [Section 3] Quick Actions
   │           ├─> "Upload more" button
   │           ├─> "Export to Google Sheets" (if stats tracking enabled)
   │           ├─> "Share summary" → generates Discord-formatted message
   │           └─> "View full history" → navigates to /snail/stats
   │
   ├──> User interacts with results:
   │      │
   │      ├─> Clicks image thumbnail → opens full-size modal
   │      ├─> Copies analysis text → clipboard
   │      └─> Downloads results → JSON export
   │
   v
[END] User exits or continues exploring other tools
```

---

## Flow 3: Admin Viewing Aggregate Stats

This flow describes how guild administrators and moderators access aggregate statistics and manage community data.

```
┌─────────────────────────────────────────────────────────────────────────┐
│ FLOW 3: ADMIN VIEWING AGGREGATE STATS                                   │
└─────────────────────────────────────────────────────────────────────────┘

[START] Admin visits Admin Panel (requires elevated permissions)
   │
   ├──> [WEB UI] Checks user role in session
   │         │
   │         ├─> IF role = "member" → Access denied, redirect to /snail
   │         └─> IF role = "admin" or "moderator" → Continue
   │
   v
┌──────────────────────────────────┐
│ STEP 1: ADMIN DASHBOARD ACCESS   │
│ System: Admin Panel + Admin API  │
└──────────────────────────────────┘
   │
   ├──> [ADMIN PANEL] Shows navigation menu:
   │         │
   │         ├─> Guilds (server management)
   │         ├─> Chat (community feed)
   │         ├─> Club (analytics)
   │         └─> Snail (game stats) ← Current selection
   │
   ├──> Admin clicks "Snail" navigation item
   │
   ├──> [ADMIN PANEL] Loads: /admin/snail
   │         │
   │         └─> Shows guild selector (if admin manages multiple guilds)
   │
   v
┌──────────────────────────────────┐
│ STEP 2: GUILD SELECTION          │
│ System: Admin Panel              │
└──────────────────────────────────┘
   │
   ├──> [ADMIN PANEL] Displays guild list:
   │         │
   │         └─> Each guild shows:
   │              ├─> Guild name + icon
   │              ├─> Member count
   │              ├─> Recent activity indicator
   │              └─> "View Stats" button
   │
   ├──> Admin selects target guild
   │
   ├──> [ADMIN PANEL] Navigates to: /admin/snail/:guildId
   │
   v
┌──────────────────────────────────┐
│ STEP 3: AGGREGATE DATA LOADING   │
│ System: Admin API                │
└──────────────────────────────────┘
   │
   ├──> [ADMIN PANEL] Fetches guild statistics:
   │         │
   │         ├─> GET /api/admin/snail/:guildId/overview
   │         │    │
   │         │    └─> Returns:
   │         │         {
   │         │           guildId, guildName,
   │         │           totalMembers,
   │         │           activeUsers (last 30 days),
   │         │           totalUploads,
   │         │           totalScreenshots,
   │         │           averageUploadsPerUser,
   │         │           mostActiveUsers: [{ userId, username, uploadCount }],
   │         │           recentActivity: [{ timestamp, event }]
   │         │         }
   │         │
   │         └─> Cache: 5 minutes (reduces API load)
   │
   ├──> [ADMIN PANEL] State: loading
   │         │
   │         └─> Display: Skeleton loaders for stats cards
   │
   ├──> [ADMIN API] Aggregates data from:
   │         │
   │         ├─> /data/snail/:guildId/**/latest.json (all user files)
   │         ├─> /uploads/snail/:guildId/ (file system stats)
   │         ├─> Database: user activity logs (if implemented)
   │         └─> Metrics service: usage counters
   │
   v
┌──────────────────────────────────┐
│ STEP 4: STATS VISUALIZATION      │
│ System: Admin Panel              │
└──────────────────────────────────┘
   │
   ├──> [ADMIN PANEL] State: success
   │         │
   │         └─> Display: Aggregate dashboard
   │
   ├──> Dashboard layout (top to bottom):
   │
   │    ┌─────────────────────────────────────────┐
   │    │ [1] KEY METRICS ROW                     │
   │    ├─────────────────────────────────────────┤
   │    │  ┌───────┐  ┌───────┐  ┌───────┐       │
   │    │  │ 1,234 │  │  856  │  │ 4,567 │       │
   │    │  │ Users │  │Active │  │Uploads│       │
   │    │  └───────┘  └───────┘  └───────┘       │
   │    └─────────────────────────────────────────┘
   │
   │    ┌─────────────────────────────────────────┐
   │    │ [2] USAGE TRENDS CHART                  │
   │    ├─────────────────────────────────────────┤
   │    │  "Screenshots Analyzed Over Time"       │
   │    │                                          │
   │    │    ▲                                     │
   │    │  100│      ╱╲                            │
   │    │   50│   ╱╲╱  ╲  ╱╲                       │
   │    │    0│──╱──────╲╱──╲──> 30 days          │
   │    └─────────────────────────────────────────┘
   │
   │    ┌─────────────────────────────────────────┐
   │    │ [3] TOP USERS TABLE                     │
   │    ├─────────────────────────────────────────┤
   │    │  Rank | User         | Uploads | Last   │
   │    │  ─────┼──────────────┼─────────┼─────── │
   │    │   1   | @snailking99 |   42    | 1h ago │
   │    │   2   | @shellmaster |   38    | 2h ago │
   │    │   3   | @gastropod_1 |   35    | 5h ago │
   │    └─────────────────────────────────────────┘
   │
   │    ┌─────────────────────────────────────────┐
   │    │ [4] RECENT ACTIVITY FEED                │
   │    ├─────────────────────────────────────────┤
   │    │  • @user123 uploaded 3 screenshots      │
   │    │    2 minutes ago                        │
   │    │  • @user456 analyzed stats              │
   │    │    15 minutes ago                       │
   │    │  • 5 users redeemed code "SNAIL2024"    │
   │    │    1 hour ago                           │
   │    └─────────────────────────────────────────┘
   │
   v
┌──────────────────────────────────┐
│ STEP 5: DETAILED INSPECTION      │
│ System: Admin Panel + Admin API  │
└──────────────────────────────────┘
   │
   ├──> Admin wants deeper insights
   │      │
   │      └─> Available drill-down options:
   │
   ├──> [A] User Detail View
   │      │
   │      ├─> Click user name in Top Users table
   │      ├─> [ADMIN PANEL] Navigates to: /admin/snail/:guildId/user/:userId
   │      ├─> [ADMIN API] GET /api/admin/snail/:guildId/user/:userId
   │      │         │
   │      │         └─> Returns:
   │      │              {
   │      │                userId, username, role, joinedAt,
   │      │                totalUploads,
   │      │                uploadHistory: [{ timestamp, fileCount, prompt }],
   │      │                lastAnalysis: { results, uploadedAt }
   │      │              }
   │      │
   │      └─> [ADMIN PANEL] Shows:
   │           ├─> User profile header
   │           ├─> Upload timeline
   │           ├─> Recent analyses (with thumbnails)
   │           └─> Action buttons: "View latest", "Export history"
   │
   ├──> [B] Export Data
   │      │
   │      ├─> Click "Export" button in top-right
   │      ├─> [ADMIN PANEL] Shows export options modal:
   │      │         │
   │      │         ├─> Format: CSV, JSON, Excel
   │      │         ├─> Scope: All users, Top 10, Date range
   │      │         └─> Fields: Select columns to include
   │      │
   │      ├─> [ADMIN API] POST /api/admin/snail/:guildId/export
   │      │         │
   │      │         └─> Generates file, returns download URL
   │      │
   │      └─> [ADMIN PANEL] Auto-downloads export file
   │
   ├──> [C] Filter & Search
   │      │
   │      ├─> Use filter controls:
   │      │    ├─> Date range picker: "Last 7 days", "Last 30 days", "Custom"
   │      │    ├─> Activity filter: "All", "Active", "Inactive"
   │      │    └─> Sort: "Most uploads", "Recent activity", "Username A-Z"
   │      │
   │      ├─> [ADMIN PANEL] Updates UI with filtered results
   │      │         │
   │      │         └─> Uses client-side filtering (data already loaded)
   │      │              OR fetches new data if range changes
   │      │
   │      └─> Search bar: "Find user..."
   │           │
   │           └─> Searches by: username, user ID, Discord tag
   │
   v
┌──────────────────────────────────┐
│ STEP 6: MANAGEMENT ACTIONS       │
│ System: Admin Panel + Admin API  │
└──────────────────────────────────┘
   │
   ├──> Admin performs moderation/management tasks:
   │
   ├──> [Action 1] Purge Old Data
   │      │
   │      ├─> Click "Data Management" tab
   │      ├─> Set retention policy: "Delete uploads older than 90 days"
   │      ├─> [ADMIN API] POST /api/admin/snail/:guildId/purge
   │      │         │
   │      │         └─> Deletes: old uploads, stale JSON files
   │      │              Keeps: metadata for statistics
   │      │
   │      └─> [ADMIN PANEL] Shows: "Freed 2.3 GB of storage"
   │
   ├──> [Action 2] Update User Permissions
   │      │
   │      ├─> Navigate to specific user detail page
   │      ├─> Click "Change Role" button
   │      ├─> Select new role: "member" → "trusted"
   │      ├─> [ADMIN API] PATCH /api/admin/users/:userId
   │      │         │
   │      │         └─> Updates user role, logs change
   │      │
   │      └─> [ADMIN PANEL] Shows: "User role updated successfully"
   │
   ├──> [Action 3] Configure Rate Limits
   │      │
   │      ├─> Click "Settings" gear icon
   │      ├─> Navigate to "Rate Limits" section
   │      ├─> Adjust: "Max uploads per user per day: 10 → 20"
   │      ├─> [ADMIN API] PUT /api/admin/snail/:guildId/config
   │      │         │
   │      │         └─> Updates guild-specific configuration
   │      │
   │      └─> [ADMIN PANEL] Shows: "Settings saved"
   │
   v
[END] Admin reviews stats, exits or continues managing other guilds
```

---

## System Interaction Summary

| User Action | Web UI | Admin API | Discord Bot | Admin Panel |
|------------|--------|-----------|-------------|-------------|
| **Authentication** | OAuth redirect | Token validation | Guild verification | N/A |
| **Upload screenshot** | File picker, validation | Storage, AI analysis | N/A | N/A |
| **View results** | Display analysis | Fetch from storage | N/A | N/A |
| **Access codes** | Display codes list | Fetch from Snelp/cache | N/A | N/A |
| **Admin stats view** | N/A | Aggregate queries | N/A | Dashboard UI |
| **Export data** | N/A | Generate export | N/A | Download trigger |

---

## Key User Experience Principles

1. **Progressive Disclosure**: First-time users see detailed guidance; returning users see streamlined interfaces
2. **Immediate Feedback**: Every action (upload, analyze, error) provides instant visual feedback
3. **Error Recovery**: Clear error messages with actionable next steps (see `states-and-errors.md`)
4. **Performance**: Client-side validation prevents unnecessary API calls; caching reduces load times
5. **Accessibility**: Keyboard navigation, screen reader support, high contrast states
6. **Mobile-First**: Upload flows work seamlessly on mobile devices (camera capture, gallery select)

---

## Future Flow Enhancements

- **Flow 4**: Discord Bot → Direct Upload (via `/snail analyze` command)
- **Flow 5**: Google Sheets Integration → Auto-export stats on schedule
- **Flow 6**: Multi-Guild Comparison → Cross-server leaderboards (admin feature)
- **Flow 7**: Tier Calculator → Interactive resource planning workflow
