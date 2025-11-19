# Admin Panel Onboarding Flow

A suggested first-time user experience for the slimy.ai Admin Panel.

---

## Goals

1. Get users to their first "win" quickly (seeing their guild dashboard)
2. Explain role-based access without overwhelming
3. Surface key features they'll use most
4. Make it skippable (ADHD-friendly: "I'll figure it out myself" option)

---

## Onboarding Triggers

**When to show onboarding:**
- First login ever (no session history)
- User clicks "Help" or "?" icon in header
- User selects "Replay Onboarding" in settings

**When NOT to show:**
- User has visited 3+ pages before
- User has made any guild settings change
- User clicks "Skip Tour"

---

## Flow Structure

### Step 1: Welcome (Modal on Login Page)

**Trigger**: After successful Discord OAuth, before guild list loads

**UI**:
```
┌─────────────────────────────────────────┐
│  Welcome to slimy.ai Admin Panel! 🎉   │
│                                         │
│  Quick tour (30 seconds) or dive in?   │
│                                         │
│  [ Start Tour ]     [ Skip, I got this ]│
└─────────────────────────────────────────┘
```

**Copy**:
- **Title**: "Welcome to slimy.ai Admin Panel! 🎉"
- **Body**: "Quick tour (30 seconds) or dive in?"
- **Button 1**: "Start Tour"
- **Button 2**: "Skip, I got this"

**Behavior**:
- "Start Tour" → Proceed to Step 2
- "Skip" → Go straight to guild list, set flag `onboardingSkipped: true`

---

### Step 2: Your Role (Overlay on Guild List Page)

**Trigger**: After clicking "Start Tour"

**UI**: Spotlight on the "Your Role" column in the guild table

**Copy**:
- **Title**: "You have different access levels"
- **Body**:
  - **ADMIN**: Full control (settings, tasks, everything)
  - **CLUB**: View stats + use all tools
  - **MEMBER**: Basic tools only (Snail Analyze, Codes, Calc)
- **Action**: "Got it" (button)

**Visual**: Highlight the role column with a pulsing border

**Progression**: Click "Got it" → Step 3

---

### Step 3: Pick a Guild (Interactive)

**Trigger**: After Step 2

**UI**: Spotlight on a guild row (preferably one where user is ADMIN)

**Copy**:
- **Title**: "Click any guild to open it"
- **Body**: "If the bot isn't there yet, you'll see an 'Invite Bot' button."
- **Hint**: *(arrow pointing to "Open" button)* "Try this one"

**Behavior**:
- User clicks "Open" → Proceed to Step 4
- User clicks "Invite Bot" → Show tooltip: "Great! Once the bot joins, you can open the guild."

---

### Step 4: Dashboard Overview (Overlay on Dashboard Page)

**Trigger**: After opening a guild

**UI**: Split spotlight on key areas

**Copy**:
- **Title**: "This is your command center"
- **Body**:
  - **Stats cards**: See guild power, members, uploads
  - **Tasks**: Run background jobs (ingest, verify, sync)
  - **Tabs**: Switch to Uploads or Current Sheet
- **Action**: "Next" (button)

**Visual**: Fade background, highlight stats section and task buttons

**Progression**: Click "Next" → Step 5

---

### Step 5: Settings (Overlay on Settings Link in Sidebar)

**Trigger**: After Step 4

**UI**: Spotlight on "Club Settings" in sidebar

**Copy**:
- **Title**: "Set up your guild here"
- **Body**: "Connect Google Sheets, enable uploads, configure channels. This is where the magic happens."
- **Action**: "Show me" (button) or "Skip to tools"

**Behavior**:
- "Show me" → Navigate to Settings page → Step 6
- "Skip to tools" → Jump to Step 7

---

### Step 6: Settings Tour (Overlay on Settings Page)

**Trigger**: If user clicked "Show me" in Step 5

**UI**: Sequential spotlights (one at a time)

**Copy**:

**6a. Sheet ID**
- **Title**: "Connect Google Sheets"
- **Body**: "Paste your sheet ID here. We'll sync member stats from it."
- **Action**: "Next"

**6b. Screenshot Channel**
- **Title**: "Enable uploads"
- **Body**: "Set a Discord channel ID for members to submit screenshots."
- **Action**: "Next"

**6c. Save Button**
- **Title**: "Don't forget to save!"
- **Body**: "Changes only apply after you hit Save Changes."
- **Action**: "Got it"

**Progression**: After "Got it" → Step 7

---

### Step 7: Snail Tools (Overlay on Snail Tools Link)

**Trigger**: After Step 5 or 6

**UI**: Spotlight on "🐌 Snail Tools" in sidebar

**Copy**:
- **Title**: "Everyone gets these tools"
- **Body**: "Analyze screenshots, check promo codes, calculate power. Available to all guild members, not just admins."
- **Action**: "Cool, show me" or "Skip"

**Behavior**:
- "Show me" → Navigate to Snail Tools → Step 8
- "Skip" → Step 9

---

### Step 8: Snail Analyze Demo (Interactive)

**Trigger**: If user clicked "Show me" in Step 7

**UI**: Spotlight on the drag-and-drop zone

**Copy**:
- **Title**: "Try uploading a screenshot"
- **Body**: "Drop an image here (or click to browse). We'll extract stats automatically using AI."
- **Hint**: "You can skip this and try it later."
- **Action**: "Try it" or "Skip demo"

**Behavior**:
- If user uploads → Show brief success message: "Nice! Check the results below."
- "Skip demo" → Step 9

---

### Step 9: Slime Chat (Overlay on Slime Chat Link)

**Trigger**: After Step 7 or 8

**UI**: Spotlight on "💬 Slime Chat" in sidebar

**Copy**:
- **Title**: "Test the AI here"
- **Body**: "Chat with Slimy in a sandbox. Uses your guild's personality settings. Safe to experiment!"
- **Action**: "Got it"

**Progression**: Click "Got it" → Step 10

---

### Step 10: You're All Set! (Modal)

**Trigger**: After Step 9

**UI**:
```
┌─────────────────────────────────────────┐
│         You're all set! 🎉             │
│                                         │
│  Quick recap:                           │
│  ✓ Guilds have different roles          │
│  ✓ Dashboard = stats + tasks            │
│  ✓ Settings = configuration             │
│  ✓ Snail Tools = for everyone           │
│  ✓ Slime Chat = AI sandbox              │
│                                         │
│  Stuck? Hover over ⓘ icons for help.   │
│                                         │
│  [ Start Using the Panel ]              │
└─────────────────────────────────────────┘
```

**Copy**:
- **Title**: "You're all set! 🎉"
- **Body**:
  ```
  Quick recap:
  ✓ Guilds have different roles
  ✓ Dashboard = stats + tasks
  ✓ Settings = configuration
  ✓ Snail Tools = for everyone
  ✓ Slime Chat = AI sandbox

  Stuck? Hover over ⓘ icons for help.
  ```
- **Button**: "Start Using the Panel"

**Behavior**: Closes modal, sets `onboardingCompleted: true`, returns focus to current page

---

## Optional: Contextual Tooltips (Post-Onboarding)

After onboarding completes, show **one-time tooltips** on first interaction:

### First Time Clicking a Task Button
**Tooltip**: "This runs in the background. Check Live Logs for progress."
**Dismiss**: Auto-hide after 5 seconds or on next click

### First Time Opening Channels Page
**Tooltip**: "Add channels here, then configure modes in the JSON. Check docs for examples."
**Dismiss**: Click "Got it"

### First Time Saving Settings
**Tooltip**: "Changes saved! The bot will reload config in ~10 seconds."
**Dismiss**: Auto-hide after 3 seconds

---

## Onboarding State Management

**Store in**: `localStorage` or backend user preferences

**Keys**:
```json
{
  "onboardingCompleted": false,
  "onboardingSkipped": false,
  "currentStep": 0,
  "contextualTooltipsShown": {
    "taskButton": false,
    "channelsPage": false,
    "settingsSave": false
  }
}
```

**Reset**: Add "Replay Onboarding" button in user menu (dropdown by username)

---

## Design Principles

1. **Skippable at every step**: Always offer "Skip" or "I got this"
2. **Progress indicator**: Show "Step 2 of 10" at top of each overlay
3. **No auto-advance**: User must click to proceed (respects pace)
4. **Dismissible**: ESC key or click outside closes any overlay
5. **Mobile-friendly**: Stack spotlights vertically, simplify copy
6. **Dark mode support**: Overlays work in both themes

---

## Copy Tone

- **Friendly**: "You're all set!" not "Onboarding complete."
- **Concise**: Max 2 sentences per tooltip
- **Action-oriented**: "Try this" not "You can try this"
- **No jargon**: "Stats" not "Metrics ingestion pipeline"
- **Encouraging**: "Nice!" when user tries a feature

---

## A/B Test Ideas (Future)

1. **Length**: 10-step tour vs. 3-step "express" tour
2. **Interactivity**: Require user to complete action (upload screenshot) vs. passive tour
3. **Timing**: Show on first login vs. after user explores for 30 seconds
4. **Format**: Modal overlays vs. sidebar "guide mode" vs. video walkthrough

---

## Success Metrics

Track these to measure onboarding effectiveness:

- **Completion rate**: % who finish the tour (vs. skip)
- **Time to first action**: How long until user changes a setting or runs a task
- **Feature discovery**: % who use Snail Tools within first session
- **Return rate**: % who come back within 7 days
- **Support requests**: Decrease in "how do I..." questions

---

## Example Flow (Happy Path)

1. User logs in → Welcome modal
2. Clicks "Start Tour"
3. Learns about roles on guild list
4. Opens an ADMIN guild
5. Sees dashboard overview
6. Clicks through settings tour
7. Checks out Snail Tools, uploads a test screenshot
8. Peeks at Slime Chat
9. Sees "You're all set!" modal
10. Starts configuring their guild for real

**Total time**: ~90 seconds if user reads everything, ~30 seconds if they click through quickly

---

## Accessibility Notes

- All modals and overlays must be keyboard-navigable (Tab, Enter, ESC)
- Screen reader announcements: "Onboarding step 2 of 10: Your Role"
- Color contrast: 4.5:1 minimum for overlay text
- Focus trap: When overlay is active, Tab only cycles through overlay elements
- Reduce motion: Respect `prefers-reduced-motion` (no pulsing animations)

---

## Copy Files for Implementation

When implementing, refer to:
- `tooltips.json` for all tooltip text
- This file for modal content and flow logic
- `overview.md` for context on what each feature does
