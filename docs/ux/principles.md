# Slimy UX Design Principles

This document outlines the core UX principles that guide all user interface design decisions across Slimy's platforms—including the web app, admin panel, and future user-facing panels.

---

## Core Principles

### 1. Fast Status Visibility Over Deep Configuration

**Principle:** Users should see the current state of their data immediately, with minimal clicks to reach configuration options.

**Why:** Discord bot users, Super Snail players, and club managers want quick answers. They're often checking stats during gameplay or managing communities in real-time.

**Examples:**
- **Snail Tools:** Screenshot analysis results appear immediately after upload, with tier costs and recommendations visible without scrolling.
- **Club Analytics:** Dashboard shows key metrics (member count, activity trends, top performers) above the fold before detailed breakdowns.
- **Admin Panel:** Guild health status (bot online, last sync time, error count) displays in the sidebar diagnostics widget on every page.

---

### 2. Respect Users' Time with One-Click Common Actions

**Principle:** The most frequent user tasks should require a single click or minimal interaction.

**Why:** Repeated multi-step workflows create friction. Common actions should feel effortless.

**Examples:**
- **Snail Codes Page:** Filter buttons (Active, Past 7 Days, All) switch views instantly without page reloads.
- **Admin Uploads:** Drag-and-drop screenshot upload with automatic processing—no manual "Submit" button required.
- **Chat Interface:** Quick personality mode switcher in the chat header for instant tone changes.

---

### 3. Explain Errors in Human Language

**Principle:** Error messages should explain what happened, why it happened, and how to fix it—in plain language without jargon or error codes.

**Why:** Technical errors frustrate non-technical users. Clear explanations build trust and reduce support burden.

**Examples:**
- **Bad:** `Error 403: Forbidden`
- **Good:** `You don't have permission to view this guild. Make sure you have the @Admin or @Managers role in Discord.`

- **Bad:** `Upload failed: Invalid file type`
- **Good:** `This file type isn't supported. Please upload a PNG or JPEG screenshot instead.`

- **Bad:** `Rate limit exceeded`
- **Good:** `You're uploading too quickly! Please wait 30 seconds before trying again.`

---

### 4. Progressive Disclosure: Simple First, Advanced When Needed

**Principle:** Show essential options by default. Hide advanced features behind expandable sections or secondary screens.

**Why:** Most users only need basic features. Overwhelming everyone with advanced options hurts usability.

**Examples:**
- **Snail Tools:** Default view shows tier costs and recommendations. Advanced details (mathematical breakdowns, alternative builds) appear in a collapsible "Details" section.
- **Guild Settings:** Common settings (bot prefix, default channel) appear first. Advanced features (custom personality prompts, webhook URLs) live under an "Advanced Configuration" accordion.
- **Club Analytics:** High-level charts are visible immediately. Raw data tables and CSV exports are tucked into a "Data Explorer" tab.

---

### 5. Maintain Context Across Navigation

**Principle:** Users should never lose their place, selections, or input when navigating between pages or features.

**Why:** Losing progress is frustrating and makes the app feel unreliable.

**Examples:**
- **Snail Codes:** Selected filter (Active/Past 7 Days/All) persists in URL query params, so sharing links or refreshing the page maintains the view.
- **Admin Panel:** When switching between guilds in the dropdown, the current tab (Dashboard/Uploads/Current Sheet) is preserved.
- **Chat Interface:** Draft messages are saved to localStorage, so refreshing the page doesn't lose typed input.

---

### 6. Provide Immediate Feedback for User Actions

**Principle:** Every user action should trigger an immediate visual response, even if processing takes time.

**Why:** Users need confirmation that their action was registered. Silence feels like failure.

**Examples:**
- **Screenshot Upload:** Show a progress indicator immediately when files are selected, with percentage updates during upload.
- **Save Settings:** Button changes to "Saving..." with a spinner, then briefly shows "Saved ✓" before returning to normal state.
- **Bot Rescan:** Trigger button becomes disabled with loading state, then shows success message with timestamp of last rescan.

---

### 7. Optimize for Role-Based Workflows

**Principle:** Different user roles have different needs. The interface should adapt to show relevant features for each role.

**Why:** Showing irrelevant features creates clutter and confusion. Role-specific UIs feel tailored and efficient.

**Examples:**
- **Web App Routing:**
  - Admin users (@Admin, @Managers) → automatically routed to `/guilds` panel
  - Club users (@CormysBar) → routed to `/club` analytics
  - Regular users → routed to `/snail` tools
- **Admin Panel:** Guild owners see full configuration options, while moderators see read-only dashboards with limited controls.
- **Snail Tools:** Casual players see simplified recommendations, while power users can enable "Advanced Mode" for detailed calculations.

---

### 8. Design for Glanceability

**Principle:** Critical information should be scannable at a glance using visual hierarchy, color coding, and concise labels.

**Why:** Users often check Slimy while multitasking (gaming, Discord chatting). Dense paragraphs get ignored.

**Examples:**
- **Club Analytics:** Use color-coded badges (green for active members, yellow for declining activity, red for inactive) instead of text descriptions.
- **Admin Dashboard:** Health metrics use icons + numbers (`✓ 12 guilds online`, `⚠ 2 errors`) instead of prose.
- **Code Lists:** Each code entry shows icon + code + expiry date in a scannable card format, not buried in sentences.

---

### 9. Enable Power Users Without Breaking Simplicity

**Principle:** Provide keyboard shortcuts, bulk actions, and API access for advanced users—but keep the default experience simple.

**Why:** Power users love efficiency tools, but most users should never see them by default.

**Examples:**
- **Keyboard Shortcuts:** `/` to focus search, `Esc` to close modals, `Ctrl+K` for command palette (hidden feature, documented in `/docs`).
- **Bulk Operations:** Admin panel allows selecting multiple guilds for batch configuration updates via checkboxes (hidden until first checkbox is clicked).
- **Export Options:** "Export to CSV" button appears only when hovering over data tables, not permanently visible.

---

### 10. Build Trust Through Transparency

**Principle:** Show users what's happening behind the scenes: loading states, last updated times, data sources, and sync status.

**Why:** Uncertainty breeds distrust. Transparency makes users confident the system is working correctly.

**Examples:**
- **Code Aggregator:** Display "Last updated: 2 minutes ago" and "Sources: Snelp API + Reddit r/SuperSnailGame" at the top of the codes page.
- **Club Analytics:** Show "Synced 5 minutes ago" with a manual refresh button, so users know the data is current.
- **Admin Diagnostics:** Display uptime, memory usage, and upload counts in the sidebar—always visible for troubleshooting.

---

## Accessibility Basics

All Slimy interfaces must meet these minimum accessibility standards:

### Font Size & Readability
- **Base font size:** 16px minimum (1rem) for body text
- **Headings:** Clear size hierarchy (H1: 2rem, H2: 1.5rem, H3: 1.25rem)
- **Line height:** 1.5 minimum for body text, 1.2 for headings
- **Line length:** Max 80 characters per line for readability

### Color Contrast
- **Text contrast:** WCAG AA minimum (4.5:1 for normal text, 3:1 for large text)
- **Interactive elements:** 3:1 contrast ratio for buttons, form fields, and icons
- **Never rely on color alone:** Use icons, labels, or patterns alongside color coding
  - Example: Don't show errors with just red text—add a ⚠️ icon

### Keyboard Navigation
- **Tab order:** Logical flow matching visual layout (left-to-right, top-to-bottom)
- **Focus indicators:** Clear visible outline on all interactive elements (no `outline: none` without replacement)
- **Skip links:** "Skip to main content" link for screen readers
- **Keyboard shortcuts:** All mouse actions must have keyboard equivalents
  - `Enter` to submit forms
  - `Escape` to close modals/dropdowns
  - Arrow keys for navigating lists

### Screen Reader Support
- **Alt text:** All images and icons must have descriptive alt attributes
- **ARIA labels:** Use `aria-label` for icon-only buttons (e.g., "Close modal", "Upload screenshot")
- **Semantic HTML:** Use proper elements (`<button>`, `<nav>`, `<main>`) instead of `<div>` with click handlers
- **Form labels:** Every input must have an associated `<label>` element

### Testing Checklist
Before shipping any UI:
- ✓ Can you navigate the entire page using only a keyboard?
- ✓ Do all interactive elements have visible focus states?
- ✓ Does the page pass WAVE or Axe accessibility checker?
- ✓ Can you zoom to 200% without content breaking or hiding?

---

## Applying These Principles

When designing new features or refactoring existing UIs, ask:

1. **Can users accomplish their goal in one click?** (Principle 2)
2. **Will users understand errors immediately?** (Principle 3)
3. **Is the most important information visible without scrolling?** (Principle 1, 8)
4. **Does this work for keyboard-only users?** (Accessibility)
5. **Will users lose their work if they refresh?** (Principle 5)
6. **Is there immediate feedback for this action?** (Principle 6)

When in doubt, test with real users from the target audience: Discord community managers, Super Snail players, and bot administrators.

---

**Last Updated:** November 2025
**Maintained By:** Slimy Development Team
