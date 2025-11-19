# Admin Panel Tooltips

Organized by page/section. Use dot notation for keys: `page.section.element`

---

## Login / Home

### `home.title`
**Text**: "slimy.ai Admin"
**Tooltip**: "Your control panel for managing Discord guilds with Slimy bot"

### `home.loginButton`
**Text**: "Login with Discord"
**Tooltip**: "Authorize with Discord to see your guilds and start managing settings"

### `home.tagline`
**Text**: "fueled by adhd — driven by feet — motivated by ducks"
**Tooltip**: "This is the energy we bring. You've been warned."

---

## Guild Selection

### `guilds.pageTitle`
**Text**: "Your Guilds"
**Tooltip**: "All Discord servers where you have access to Slimy bot management"

### `guilds.table.guildName`
**Label**: "Guild Name"
**Tooltip**: "The Discord server name. Click 'Open' to manage it."

### `guilds.table.role`
**Label**: "Your Role"
**Tooltip**: "ADMIN = full control | CLUB = view + tools | MEMBER = basic tools only"

### `guilds.table.botStatus`
**Label**: "Bot Status"
**Tooltip**: "Is Slimy bot installed in this guild? If not, click 'Invite Bot'."

### `guilds.inviteButton`
**Text**: "Invite Bot"
**Tooltip**: "Add Slimy bot to this Discord server (requires server Manage Server permission)"

### `guilds.openButton`
**Text**: "Open"
**Tooltip**: "Go to this guild's dashboard and settings"

---

## Guild Dashboard (Main)

### `dashboard.pageTitle`
**Text**: "Dashboard"
**Tooltip**: "Guild overview, stats, and admin tasks"

### `dashboard.weekId`
**Label**: "Week ID"
**Tooltip**: "Current tracking period identifier. Changes weekly."

### `dashboard.members`
**Label**: "Members"
**Tooltip**: "Total members being tracked in this guild's baseline sheet"

### `dashboard.totalPower`
**Label**: "Total Power"
**Tooltip**: "Sum of all member power scores. Threshold shows target goal."

### `dashboard.simPower`
**Label**: "SIM Power"
**Tooltip**: "Special category power tracking (e.g., Sim-specific metrics). Threshold = goal."

### `dashboard.baseline`
**Label**: "Baseline Sheet"
**Tooltip**: "The Google Sheet tab we're reading as source of truth (e.g., 'Baseline (10-24-25)')"

### `dashboard.uploads.today`
**Label**: "Uploads Today"
**Tooltip**: "Screenshots uploaded to this guild today"

### `dashboard.uploads.total`
**Label**: "Total Uploads"
**Tooltip**: "All-time screenshot uploads for this guild"

### `dashboard.apiUptime`
**Label**: "API Uptime"
**Tooltip**: "How long the backend has been running without restart"

### `dashboard.tasks.ingestDirectory`
**Text**: "Ingest Directory"
**Tooltip**: "Scan the screenshots folder and import new images into the database"

### `dashboard.tasks.runVerify`
**Text**: "Run Verify"
**Tooltip**: "Check all member stats for consistency and flag issues"

### `dashboard.tasks.recomputeLatest`
**Text**: "Recompute Latest"
**Tooltip**: "Recalculate the most recent snapshot's power scores"

### `dashboard.tasks.recomputePushSheet`
**Text**: "Recompute & Push Sheet"
**Tooltip**: "Recalculate stats AND update the Google Sheet. Use with caution."

### `dashboard.logs.title`
**Text**: "Live Logs"
**Tooltip**: "Real-time output from the last task you ran. Errors show in red."

---

## Guild Dashboard: Uploads Tab

### `uploads.title`
**Text**: "Uploads"
**Tooltip**: "Manage screenshots uploaded by members"

### `uploads.selectButton`
**Text**: "Select Screenshots"
**Tooltip**: "Choose image files from your device to upload (admins only)"

### `uploads.emptyState`
**Text**: "No uploads yet. Drop screenshots here to get started."
**Tooltip**: "Drag and drop image files here, or click Select Screenshots"

### `uploads.thumbnail`
**Tooltip**: "Click to view full size. Shows uploader and timestamp."

---

## Guild Dashboard: Current Sheet Tab

### `currentSheet.title`
**Text**: "Current Sheet"
**Tooltip**: "View and edit the live Google Sheet synced with this guild"

### `currentSheet.corrections`
**Text**: "Corrections"
**Tooltip**: "Override member stats when manual fixes are needed (e.g., OCR errors)"

### `currentSheet.rescan`
**Text**: "Rescan"
**Tooltip**: "Re-read the sheet data from Google Sheets API"

---

## Club Settings

### `settings.pageTitle`
**Text**: "Club Settings"
**Tooltip**: "Configure guild-wide behavior and integrations"

### `settings.sheetId`
**Label**: "Sheet ID"
**Tooltip**: "The Google Sheets document ID (from the URL: docs.google.com/spreadsheets/d/[THIS_PART])"

### `settings.defaultTab`
**Label**: "Default Tab"
**Tooltip**: "Which sheet tab to read as baseline (e.g., 'Baseline (10-24-25)')"

### `settings.defaultView`
**Label**: "Default View"
**Tooltip**: "Choose Baseline (historical) or Latest (most recent snapshot) for dashboard display"

### `settings.allowPublicStats`
**Label**: "Allow Public Stats"
**Tooltip**: "Let non-admins see guild stats via public links (if enabled in future features)"

### `settings.screenshotChannel`
**Label**: "Screenshot Channel ID"
**Tooltip**: "Discord channel ID where members upload screenshots. Bot will watch this channel."

### `settings.enableUploads`
**Label**: "Enable Uploads"
**Tooltip**: "Allow members to submit screenshots via Discord. Uncheck to disable."

### `settings.notes`
**Label**: "Notes"
**Tooltip**: "Internal notes for admins (not visible to members). E.g., 'Only accept snail screenshots, not duck pics.'"

---

## Channels

### `channels.pageTitle`
**Text**: "Channels"
**Tooltip**: "Configure which Discord channels the bot monitors and how it behaves in each"

### `channels.refresh`
**Text**: "Refresh"
**Tooltip**: "Re-fetch the channel list from Discord (updates names and IDs)"

### `channels.table.channelId`
**Label**: "Channel ID"
**Tooltip**: "Discord's unique identifier for this channel (auto-populated)"

### `channels.table.channelName`
**Label**: "Channel Name"
**Tooltip**: "Human-readable channel name from Discord"

### `channels.table.modes`
**Label**: "Modes JSON"
**Tooltip**: "Advanced: JSON config for bot behavior (e.g., {\"chat\": true, \"react\": false})"

### `channels.table.allowlist`
**Label**: "Allowlist"
**Tooltip**: "Comma-separated list of allowed features or user IDs (optional)"

### `channels.addButton`
**Text**: "Add Channel Configuration"
**Tooltip**: "Add a new channel to monitor (you'll need the channel ID from Discord)"

### `channels.saveButton`
**Text**: "Save Changes"
**Tooltip**: "Commit all changes to the database. Bot will reload config."

---

## Personality

### `personality.pageTitle`
**Text**: "Persona Overrides"
**Tooltip**: "Customize how Slimy talks in this guild (merges with base personality)"

### `personality.description`
**Text**: "Paste persona overrides (JSON). These merge with base persona in config/slimy_ai.persona.json."
**Tooltip**: "Use JSON format. Example: {\"tone\": \"sarcastic\", \"topics\": [\"ducks\"]}. Leave empty for default."

### `personality.editor`
**Tooltip**: "Valid JSON required. Changes take effect immediately after save."

### `personality.saveButton`
**Text**: "Save Personality"
**Tooltip**: "Update the AI's personality for this guild. Test in Slime Chat afterwards."

### `personality.lastUpdated`
**Label**: "Last Updated"
**Tooltip**: "Shows who changed the personality last and when"

---

## Usage

### `usage.pageTitle`
**Text**: "Usage & Spend"
**Tooltip**: "Track API costs, model usage, and token consumption"

### `usage.timeWindow.today`
**Text**: "Today"
**Tooltip**: "Show only today's usage"

### `usage.timeWindow.7days`
**Text**: "7 Days"
**Tooltip**: "Show the last week"

### `usage.timeWindow.30days`
**Text**: "30 Days"
**Tooltip**: "Show the last 30 days"

### `usage.timeWindow.thisMonth`
**Text**: "This Month"
**Tooltip**: "Show current calendar month"

### `usage.chart.title`
**Text**: "Cost by Model"
**Tooltip**: "Visual breakdown of spending across different AI models (GPT-4, Claude, etc.)"

### `usage.table.model`
**Label**: "Model"
**Tooltip**: "AI model name (e.g., gpt-4-turbo, claude-3-opus)"

### `usage.table.requests`
**Label**: "Requests"
**Tooltip**: "Total API calls made to this model"

### `usage.table.inputTokens`
**Label**: "Input Tokens"
**Tooltip**: "Tokens sent TO the model (prompts, context)"

### `usage.table.outputTokens`
**Label**: "Output Tokens"
**Tooltip**: "Tokens generated BY the model (responses)"

### `usage.table.images`
**Label**: "Images"
**Tooltip**: "Number of images processed (vision models only)"

### `usage.table.cost`
**Label**: "Cost"
**Tooltip**: "Estimated cost in USD based on model pricing"

---

## Corrections

### `corrections.pageTitle`
**Text**: "Member Corrections"
**Tooltip**: "Manually override stats when OCR fails or data needs fixing"

### `corrections.note`
**Text**: "Corrections now live in the dashboard's Current Sheet tab"
**Tooltip**: "This is a legacy view. Most admins use the sheet tab now."

### `corrections.displayName`
**Label**: "Display Name"
**Tooltip**: "Member's in-game name (must match sheet exactly)"

### `corrections.metric`
**Label**: "Metric"
**Tooltip**: "Which stat to override: Total Power or SIM Power"

### `corrections.value`
**Label**: "Value"
**Tooltip**: "New numeric value. Preview shows before/after."

### `corrections.reason`
**Label**: "Reason (optional)"
**Tooltip**: "Why you're making this change (helpful for future you)"

### `corrections.addButton`
**Text**: "Add Correction"
**Tooltip**: "Save this override. Takes effect on next sheet sync."

### `corrections.batchImport`
**Text**: "Batch CSV Import"
**Tooltip**: "Upload a CSV file with multiple corrections at once (advanced)"

### `corrections.deleteButton`
**Text**: "Delete"
**Tooltip**: "Remove this correction and revert to calculated value"

---

## Snail Tools: Home

### `snail.pageTitle`
**Text**: "🐌 Snail Tools"
**Tooltip**: "Member-friendly analyzers for screenshot stats, codes, and power calculations"

### `snail.description`
**Text**: "Snail Mode unlocks member-friendly analyzers for the guilds linked to your Discord"
**Tooltip**: "These tools work for everyone, not just admins"

### `snail.guildSelect`
**Tooltip**: "Pick a guild to access its snail tools"

---

## Snail Tools: Analyze

### `snail.analyze.title`
**Text**: "Analyze"
**Tooltip**: "Upload screenshots to extract stats automatically"

### `snail.analyze.helpToggle`
**Text**: "Help"
**Tooltip**: "Show/hide tips for getting the best analysis results"

### `snail.analyze.dropzone`
**Text**: "Drag and drop screenshots here, or click to browse"
**Tooltip**: "Max 8 screenshots, 10MB each. Supports PNG, JPG, WebP."

### `snail.analyze.prompt`
**Placeholder**: "Optional prompt (e.g. 'compare rush vs baseline')"
**Tooltip**: "Give context to the AI analyzer. Examples: 'focus on DEF stat', 'is this good for PvP?'"

### `snail.analyze.runButton`
**Text**: "Run analysis"
**Tooltip**: "Send screenshots to AI vision model. Usually takes 5-15 seconds."

### `snail.analyze.results.hp`
**Label**: "HP"
**Tooltip**: "Health Points extracted from screenshot"

### `snail.analyze.results.atk`
**Label**: "ATK"
**Tooltip**: "Attack stat"

### `snail.analyze.results.def`
**Label**: "DEF"
**Tooltip**: "Defense stat"

### `snail.analyze.results.rush`
**Label**: "Rush"
**Tooltip**: "Rush power stat"

### `snail.analyze.results.fame`
**Label**: "Fame"
**Tooltip**: "Fame score"

### `snail.analyze.results.tech`
**Label**: "Tech"
**Tooltip**: "Technology stat"

### `snail.analyze.results.art`
**Label**: "Art"
**Tooltip**: "Art stat"

### `snail.analyze.results.civ`
**Label**: "Civ"
**Tooltip**: "Civilization stat"

### `snail.analyze.results.fth`
**Label**: "Fth"
**Tooltip**: "Faith stat"

---

## Snail Tools: Stats

### `snail.stats.title`
**Text**: "Stats"
**Tooltip**: "Your personal snapshot history and analysis runs"

### `snail.stats.lastRun`
**Label**: "Last Analysis"
**Tooltip**: "Timestamp and prompt from your most recent analysis run"

### `snail.stats.resultsGrid`
**Tooltip**: "All stats extracted from your screenshots. Click to see source image."

---

## Snail Tools: Codes

### `snail.codes.title`
**Text**: "Codes"
**Tooltip**: "Promo codes for in-game rewards"

### `snail.codes.filter.active`
**Text**: "Active"
**Tooltip**: "Show only codes that are currently valid"

### `snail.codes.filter.recent`
**Text**: "Past 7 Days"
**Tooltip**: "Show codes added in the last week"

### `snail.codes.filter.all`
**Text**: "All"
**Tooltip**: "Show all codes, including expired ones"

### `snail.codes.copyButton`
**Text**: "Copy"
**Tooltip**: "Copy code to clipboard for easy pasting in-game"

---

## Snail Tools: Help

### `snail.help.title`
**Text**: "Help"
**Tooltip**: "Tips for getting the best analysis results"

### `snail.help.tips`
**Text**: "Snail Analyze Tips"
**Tooltip**: "Best practices: clear screenshots, no crops, good lighting, etc."

---

## Snail Tools: Calc

### `snail.calc.title`
**Text**: "Calc"
**Tooltip**: "Quick power calculator for SIM and Total Power math"

### `snail.calc.simPower`
**Label**: "SIM Power"
**Tooltip**: "Enter your SIM-specific power score"

### `snail.calc.totalPower`
**Label**: "Total Power"
**Tooltip**: "Enter your overall power score"

### `snail.calc.calculateButton`
**Text**: "Calculate"
**Tooltip**: "Compute SIM percentage and other derived values"

### `snail.calc.results.sim`
**Label**: "SIM"
**Tooltip**: "Your SIM Power (as entered)"

### `snail.calc.results.total`
**Label**: "Total"
**Tooltip**: "Your Total Power (as entered)"

### `snail.calc.results.simPercent`
**Label**: "SIM %"
**Tooltip**: "SIM Power as a percentage of Total Power"

---

## Snail Tools: Guides

### `snail.guides.title`
**Text**: "Guides"
**Tooltip**: "Strategy guides and tutorials (coming soon)"

### `snail.guides.placeholder`
**Text**: "Snail Guides — Coming Soon"
**Tooltip**: "We're writing helpful guides for new players. Check back later!"

---

## Snail Tools: Species War

### `snail.speciesWar.title`
**Text**: "Species War"
**Tooltip**: "Species War event planner and calculator (coming soon)"

### `snail.speciesWar.placeholder`
**Text**: "Species War Planner — Coming Soon"
**Tooltip**: "Tools for strategizing Species War events. Stay tuned!"

---

## Slime Chat

### `chat.pageTitle`
**Text**: "💬 Slime Chat"
**Tooltip**: "Real-time chat with Slimy AI in a sandbox environment"

### `chat.guildSelect`
**Tooltip**: "Choose which guild's personality to use (affects AI responses)"

### `chat.messageInput`
**Placeholder**: "Type a message…"
**Tooltip**: "Chat with Slimy here. It uses the guild's personality config."

### `chat.sendButton`
**Text**: "Send"
**Tooltip**: "Send your message to Slimy"

### `chat.adminOnly`
**Label**: "Admin-only"
**Tooltip**: "If checked, only admins will see this message in the channel"

### `chat.footer`
**Text**: "mention @slimy.ai to chat with it"
**Tooltip**: "In Discord, use @slimy.ai to talk to the bot. This is just a testing sandbox."

### `chat.bubble.role`
**Tooltip**: "Message sender's role (color-coded)"

### `chat.bubble.adminBadge`
**Tooltip**: "This user is a guild admin"

---

## Club Dashboard

### `club.pageTitle`
**Text**: "Club Overview"
**Tooltip**: "High-level stats across all guilds you have club access to"

### `club.guildSelect`
**Tooltip**: "Switch between guilds to see their club dashboard"

### `club.snailToolsLink`
**Text**: "🐌 Snail Tools"
**Tooltip**: "Jump to snail analysis tools for this guild"

### `club.stats.members`
**Label**: "Members"
**Tooltip**: "Total tracked members in this guild"

### `club.stats.totalPower`
**Label**: "Total Power"
**Tooltip**: "Guild's combined Total Power score"

### `club.stats.simPower`
**Label**: "SIM Power"
**Tooltip**: "Guild's combined SIM Power score"

### `club.stats.lastSnapshot`
**Label**: "Last Snapshot"
**Tooltip**: "When the most recent stats were captured"

### `club.latestSnapshot`
**Text**: "Latest Snail Snapshot"
**Tooltip**: "The most recent data pull from the baseline sheet"

---

## Navigation & Layout

### `nav.dashboard`
**Text**: "Dashboard"
**Tooltip**: "Guild overview and admin tasks"

### `nav.settings`
**Text**: "Club Settings"
**Tooltip**: "Configure guild behavior and integrations"

### `nav.channels`
**Text**: "Channels"
**Tooltip**: "Manage Discord channel monitoring"

### `nav.personality`
**Text**: "Personality"
**Tooltip**: "Customize Slimy's chat behavior"

### `nav.usage`
**Text**: "Usage"
**Tooltip**: "View API costs and model usage"

### `nav.snailTools`
**Text**: "🐌 Snail Tools"
**Tooltip**: "Screenshot analysis, codes, calculators"

### `nav.slimeChat`
**Text**: "💬 Slime Chat"
**Tooltip**: "Test chat with Slimy AI"

### `nav.clubDashboard`
**Text**: "Club Dashboard"
**Tooltip**: "Club member overview (requires club role)"

### `nav.emailLogin`
**Text**: "📧 Email Login"
**Tooltip**: "Admin-only email authentication (advanced)"

### `nav.logout`
**Text**: "Logout"
**Tooltip**: "Sign out of the admin panel"

### `nav.userRole`
**Tooltip**: "Your role in the current guild (ADMIN, CLUB, or MEMBER)"

---

## Diagnostic Widget

### `diagnostic.title`
**Text**: "System Health"
**Tooltip**: "Quick view of backend API and services status"

### `diagnostic.status.ok`
**Text**: "All systems operational"
**Tooltip**: "Everything's running smoothly"

### `diagnostic.status.warning`
**Text**: "Degraded performance"
**Tooltip**: "Some features may be slow or unavailable"

### `diagnostic.status.error`
**Text**: "Service outage"
**Tooltip**: "Backend is unreachable. Check back in a few minutes."

---

## Slime Chat Bar (Bottom Bar)

### `slimeChatBar.title`
**Text**: "Quick Chat"
**Tooltip**: "Mini Slime Chat always available at the bottom of the screen"

### `slimeChatBar.input`
**Placeholder**: "Ask Slimy anything…"
**Tooltip**: "Quick question? Type here. Uses current guild's personality."

### `slimeChatBar.toggle`
**Tooltip**: "Expand/collapse the chat bar"

---

## Error States

### `error.accessDenied`
**Text**: "Access denied"
**Tooltip**: "You don't have permission to view this page. Check your guild role."

### `error.noGuilds`
**Text**: "No guilds available"
**Tooltip**: "You're not a member of any guilds with Slimy bot. Invite it to a server first."

### `error.loadingFailed`
**Text**: "Failed to load"
**Tooltip**: "Something went wrong. Try refreshing the page or check the system health widget."

### `error.notFound`
**Text**: "Page not found"
**Tooltip**: "This page doesn't exist. Use the sidebar to navigate."

---

## Loading States

### `loading.guilds`
**Text**: "Loading your guilds…"
**Tooltip**: "Fetching guild list from Discord"

### `loading.session`
**Text**: "Loading session…"
**Tooltip**: "Checking your authentication"

### `loading.data`
**Text**: "Loading data…"
**Tooltip**: "Fetching info from the backend"

---

## Success Messages

### `success.saved`
**Text**: "Saved"
**Tooltip**: "Changes saved successfully"

### `success.uploaded`
**Text**: "Uploaded"
**Tooltip**: "Screenshots uploaded successfully"

### `success.analyzed`
**Text**: "Analysis complete"
**Tooltip**: "Your screenshots have been analyzed. See results below."

### `success.copied`
**Text**: "Copied to clipboard"
**Tooltip**: "Code copied! Paste it in-game to redeem."

---

## Empty States

### `empty.uploads`
**Text**: "No uploads yet. Drop screenshots here to get started."
**Tooltip**: "Drag and drop image files to upload them"

### `empty.codes`
**Text**: "No codes available right now."
**Tooltip**: "Check back later for new promo codes"

### `empty.corrections`
**Text**: "No corrections yet."
**Tooltip**: "Add a correction to override member stats"

### `empty.chat`
**Text**: "No messages yet. Say hi!"
**Tooltip**: "Start a conversation with Slimy"

---

## Notes for Implementation

1. **Tooltip trigger**: Use ⓘ icons or hover states on labels
2. **Accessibility**: All tooltips should have keyboard access (focus → show)
3. **Mobile**: Tooltips become tap-to-reveal on touch devices
4. **Timing**: Show after 300ms hover, hide after 200ms un-hover
5. **Placement**: Auto-position (top/bottom/left/right) based on viewport space
6. **Max width**: 250px for readability
7. **Dark mode**: Ensure tooltip backgrounds work in both light/dark themes
