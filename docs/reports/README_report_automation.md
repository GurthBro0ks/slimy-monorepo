# Repo Health Report Automation

This document explains how to run and automate the Repo Health Report generator.

## Quick Start

```bash
# Generate a report (auto-detect hostname)
pnpm report

# Generate with specific host label
pnpm report:nuc2   # REPORT_HOST=nuc2
pnpm report:local  # REPORT_HOST=local

# Custom host
REPORT_HOST=myhost pnpm report

# Custom retention (keep last N reports per host)
pnpm report -- --keep=10
```

## Output Files

After running, check `docs/reports/` for:
- `REPORT_<timestamp>_<host>.json` - Raw report data
- `REPORT_<timestamp>_<host>.html` - Visual report with charts
- `LATEST_<host>.json` - Copy of latest report for delta comparison
- `vendor/chart.umd.min.js` - Offline Chart.js for HTML reports

## CLI Options

```
Usage: node scripts/report/run.mjs [options]

Options:
  --keep=N    Keep last N reports per host (default: 30)
  --help, -h  Show help message

Environment Variables:
  REPORT_HOST  Override hostname in report filenames
```

## Report Contents

The JSON report includes:
- **git**: branch, HEAD, dirty status, working tree changes
- **env**: node version, pnpm version, docker version, uname, disk usage
- **health**: test results, docker compose status, admin API health, Socket.IO
- **stats**: language breakdown (tokei), folder sizes
- **delta**: comparison with previous report
- **pruned**: list of deleted old reports

## GitHub Actions

Reports are automatically generated on push and PR via `.github/workflows/repo-health-report.yml`. Artifacts are uploaded for 30 days.

## systemd Timer (NUC2 Daily Automation)

To run the report daily on NUC2, install these systemd user units:

### 1. Create service file

```bash
mkdir -p ~/.config/systemd/user
cat > ~/.config/systemd/user/slimy-report.service << 'EOF'
[Unit]
Description=Slimy Repo Health Report Generator
After=network.target

[Service]
Type=oneshot
WorkingDirectory=/opt/slimy/slimy-monorepo
ExecStart=/usr/bin/bash -lc 'pnpm report:nuc2'
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=default.target
EOF
```

### 2. Create timer file

```bash
cat > ~/.config/systemd/user/slimy-report.timer << 'EOF'
[Unit]
Description=Run Slimy Repo Health Report daily

[Timer]
OnCalendar=daily
Persistent=true
RandomizedDelaySec=300

[Install]
WantedBy=timers.target
EOF
```

### 3. Enable and start

```bash
systemctl --user daemon-reload
systemctl --user enable --now slimy-report.timer
```

### 4. Verify

```bash
# Check timer status
systemctl --user list-timers | grep slimy-report

# View logs
journalctl --user -u slimy-report.service -f

# Run manually
systemctl --user start slimy-report.service
```

### 5. Validate syntax

```bash
systemd-analyze --user verify ~/.config/systemd/user/slimy-report.service
systemd-analyze --user verify ~/.config/systemd/user/slimy-report.timer
```

## Retention Policy

By default, the generator keeps the last 30 reports per host. Older reports (both JSON and HTML) are automatically deleted. The `LATEST_<host>.json` file is never deleted.

To change retention:
```bash
pnpm report -- --keep=50  # Keep last 50
pnpm report -- --keep=7   # Keep last week (if running daily)
```

## Offline HTML Support

Generated HTML reports load Chart.js locally first (`vendor/chart.umd.min.js`), with CDN fallback. This allows viewing reports without internet access.

The vendor file is automatically copied from `scripts/report/vendor/` to `docs/reports/vendor/` when generating reports.
