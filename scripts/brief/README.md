# Morning Brief Generator

**Purpose:** Generate a clean, actionable status report every morning covering your repos, tests, proof-packs, and action items.

## Quick Start

```bash
# Run manually
./scripts/brief/morning-brief.sh

# Or specify output location
./scripts/brief/morning-brief.sh ~/briefs/$(date +%Y-%m-%d).md
```

## What It Checks

### 📦 Repository Status
- Current branch
- Uncommitted changes
- Unpushed commits
- Recent commits (last 5)
- Checks both:
  - `/opt/slimy/slimy-monorepo`
  - `/opt/slimy/pm_updown_bot_bundle`

### 🧪 Recent Proof Packs
- Scans `/tmp/proof_*` for packs created in last 24h
- Shows PASS/FAIL status
- Lists timestamps

### 🐳 Docker Status
- Running containers count
- Active service list

### 📝 Recent TODOs
- Finds TODO/FIXME comments added in last 7 days
- Helps track new work items

### 🧪 Test Status
- Quick test run (30s timeout)
- Pass/fail summary
- Failed test details (if any)

### ✅ Suggested Actions
- Smart action items based on findings
- Uncommitted work reminders
- Failed proof pack alerts
- Open PR counts (if `gh` CLI available)

## Automation

### Option 1: Cron (runs on NUC2)

Add to your crontab:

```bash
# Run every morning at 8:30 AM
30 8 * * * /opt/slimy/slimy-monorepo/scripts/brief/morning-brief.sh ~/briefs/$(date +\%Y-\%m-\%d).md 2>&1 | logger -t morning-brief
```

### Option 2: Clawdbot Cron

Use Clawdbot's cron system to run it and post results to Discord:

```bash
clawdbot cron add \
  --schedule "30 8 * * *" \
  --text "Run morning brief and post results" \
  --target "discord:YOUR_CHANNEL_ID"
```

### Option 3: Manual on Demand

Just run it whenever you want a status check:

```bash
./scripts/brief/morning-brief.sh && cat /tmp/morning-brief-*.md
```

## Output Format

The script generates a clean markdown file with:

- Emoji indicators for quick scanning
- Code blocks for technical details
- Actionable bullet points
- Timestamp for reference

Example output structure:

```markdown
# ☀️ Morning Brief

Generated: 2026-01-29T12:00:00Z

## 📦 Repository Status

### slimy-monorepo
- **Branch:** `main`
- ✅ **Working tree:** Clean
- **Recent commits:**
  - f4b0108 Merge pull request #62
  - 2537364 Phase 9D: add deterministic CI

...
```

## Customization

Edit `morning-brief.sh` to:
- Add more repo checks
- Change time windows (24h → 7d, etc.)
- Add custom health checks
- Include deployment status
- Add trading bot metrics

## Integration Ideas

- **Post to Discord:** Pipe output through Clawdbot message tool
- **Email:** Use `mail` command to send briefs
- **Archive:** Save to `~/briefs/YYYY-MM/` for history
- **Dashboard:** Parse output and display on web UI

## Requirements

- Bash 4+
- Git
- Docker (optional)
- `gh` CLI (optional, for PR counts)
- `pnpm` (optional, for test runs)

## Troubleshooting

**"No proof packs found"**
- Proof packs in `/tmp/` are ephemeral
- Check `/opt/slimy/proofpacks/` for archived ones
- Adjust time window in script if needed

**"Test run timed out"**
- 30s timeout is aggressive
- Increase timeout or skip test runs
- Or run tests separately before brief

**"Permission denied"**
- Make sure script is executable: `chmod +x morning-brief.sh`
- Check read access to repos and `/tmp/`

## Version History

- **v1.0** (2026-01-29): Initial release
  - Multi-repo status
  - Proof-pack scanning
  - Docker status
  - Recent TODO tracking
  - Smart action items

---

*Part of the slimy-monorepo automation toolkit*
