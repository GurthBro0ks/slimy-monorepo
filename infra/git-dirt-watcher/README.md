# Git Dirt Watcher

A lightweight monitoring tool that detects uncommitted changes in git repositories and sends notifications to Discord.

## Overview

Git Dirt Watcher is designed for deployment targets (like NUC1/NUC2) where repositories should always be in a clean, committed state. It periodically scans configured repositories and alerts via Discord webhook when uncommitted changes are detected.

**Key Features:**
- 🔍 Monitors multiple git repositories
- 📊 Reports dirty file counts and filenames
- 🔔 Sends formatted notifications to Discord
- 🧪 Dry-run mode for testing
- ⚙️ Configurable via environment variables
- 🕒 Designed for systemd timer integration

## Quick Start

### 1. Installation

Choose a deployment location on your target host (e.g., `/opt/slimy/tools/git-dirt-watch/`):

```bash
# Create deployment directory
sudo mkdir -p /opt/slimy/tools/git-dirt-watch
cd /opt/slimy/tools/git-dirt-watch

# Copy files from this repository
sudo cp /path/to/slimy-monorepo/infra/git-dirt-watcher/git-dirt-watch.sh .
sudo cp /path/to/slimy-monorepo/infra/git-dirt-watcher/example.repos.txt repos.txt
sudo cp /path/to/slimy-monorepo/infra/git-dirt-watcher/.env.example .env

# Make script executable
sudo chmod +x git-dirt-watch.sh

# Set appropriate ownership (adjust user as needed)
sudo chown -R root:root /opt/slimy/tools/git-dirt-watch
```

### 2. Configuration

#### Create Discord Webhook

1. Open Discord and navigate to your server
2. Go to: **Server Settings → Integrations → Webhooks**
3. Click **New Webhook**
4. Configure the webhook:
   - Name: `Git Dirt Watcher`
   - Channel: Select your notifications channel
   - Click **Copy Webhook URL**

#### Configure Environment

Edit the `.env` file:

```bash
sudo nano /opt/slimy/tools/git-dirt-watch/.env
```

Set your Discord webhook URL:

```bash
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN
DIRT_MAX_FILES=10
```

Secure the environment file:

```bash
sudo chmod 600 /opt/slimy/tools/git-dirt-watch/.env
```

#### Configure Repositories

Edit `repos.txt` to list the repositories you want to monitor:

```bash
sudo nano /opt/slimy/tools/git-dirt-watch/repos.txt
```

Example:

```
# Production repositories
/opt/slimy/app/slimy-monorepo
/opt/slimy/app/web-backend
/etc/nginx-configs

# Docker compose configurations
/var/lib/docker-compose/production
```

### 3. Test the Script

Test in dry-run mode (doesn't send to Discord):

```bash
cd /opt/slimy/tools/git-dirt-watch
source .env
DRY_RUN=1 ./git-dirt-watch.sh
```

Test with actual Discord notification:

```bash
cd /opt/slimy/tools/git-dirt-watch
source .env
./git-dirt-watch.sh
```

### 4. Set Up Automated Monitoring

#### Option A: Systemd Timer (Recommended)

Create a systemd service unit (`/etc/systemd/system/git-dirt-watch.service`):

```ini
[Unit]
Description=Git Dirt Watcher - Check for uncommitted changes
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
WorkingDirectory=/opt/slimy/tools/git-dirt-watch
EnvironmentFile=/opt/slimy/tools/git-dirt-watch/.env
ExecStart=/opt/slimy/tools/git-dirt-watch/git-dirt-watch.sh /opt/slimy/tools/git-dirt-watch/repos.txt

# Security hardening
User=root
Group=root
NoNewPrivileges=true
PrivateTmp=true

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=git-dirt-watch

[Install]
WantedBy=multi-user.target
```

Create a systemd timer unit (`/etc/systemd/system/git-dirt-watch.timer`):

```ini
[Unit]
Description=Git Dirt Watcher Timer - Run every 15 minutes
Requires=git-dirt-watch.service

[Timer]
# Run every 15 minutes
OnBootSec=5min
OnUnitActiveSec=15min

# Run immediately if missed (e.g., system was off)
Persistent=true

[Install]
WantedBy=timers.target
```

Enable and start the timer:

```bash
# Reload systemd configuration
sudo systemctl daemon-reload

# Enable the timer to start on boot
sudo systemctl enable git-dirt-watch.timer

# Start the timer now
sudo systemctl start git-dirt-watch.timer

# Check timer status
sudo systemctl status git-dirt-watch.timer

# View upcoming runs
sudo systemctl list-timers git-dirt-watch.timer

# Manually trigger a run (for testing)
sudo systemctl start git-dirt-watch.service

# View logs
sudo journalctl -u git-dirt-watch.service -f
```

#### Option B: Cron

Add to root's crontab (`sudo crontab -e`):

```cron
# Run git-dirt-watch every 15 minutes
*/15 * * * * cd /opt/slimy/tools/git-dirt-watch && source .env && ./git-dirt-watch.sh >> /var/log/git-dirt-watch.log 2>&1
```

## Usage

### Manual Execution

```bash
# Run with default repos.txt
cd /opt/slimy/tools/git-dirt-watch
source .env
./git-dirt-watch.sh

# Run with custom repos file
./git-dirt-watch.sh /path/to/custom-repos.txt

# Dry-run mode (print to stdout, don't send webhook)
DRY_RUN=1 ./git-dirt-watch.sh

# Override max files
DIRT_MAX_FILES=20 ./git-dirt-watch.sh
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DISCORD_WEBHOOK_URL` | Yes* | - | Discord webhook URL for notifications |
| `DIRT_MAX_FILES` | No | 10 | Max filenames to include in notification |
| `DRY_RUN` | No | 0 | Set to `1` to skip webhook and print to stdout |

\* Not required when `DRY_RUN=1`

## Example Output

### Console Output

```
[INFO] Starting git dirt watch on nuc1.local
[INFO] Repos file: ./repos.txt
[INFO] Checking: /opt/slimy/app/slimy-monorepo
[INFO]   ✓ Clean
[INFO] Checking: /opt/slimy/app/web-backend
[WARN]   ✗ Dirty
[WARN] Found 1 dirty repositories
[INFO] Discord notification sent successfully
```

### Discord Notification

The Discord notification will appear as an embedded message:

```
Git Dirt Detected

🚨 1 dirty repositories detected on `nuc1.local`

📁 /opt/slimy/app/web-backend
Branch: `main`
Files: 3 changed
```
```
M  src/api/routes.ts
M  src/config/database.ts
?? temp-debug.log
```

## Troubleshooting

### Script fails with "Repos file not found"

Check that `repos.txt` exists in the working directory or provide an absolute path:

```bash
./git-dirt-watch.sh /opt/slimy/tools/git-dirt-watch/repos.txt
```

### "DISCORD_WEBHOOK_URL environment variable is required"

Make sure you've sourced the `.env` file:

```bash
source .env
```

Or export it directly:

```bash
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
```

### Discord webhook returns HTTP 404

- Verify the webhook URL is correct
- Check that the webhook hasn't been deleted in Discord
- Ensure the URL has both webhook ID and token

### "Not a git repository" warnings

- Verify the path exists: `ls -la /path/to/repo`
- Check if it's actually a git repo: `git -C /path/to/repo status`
- Ensure the user running the script has read permissions

### Systemd service fails

```bash
# Check service status
sudo systemctl status git-dirt-watch.service

# View detailed logs
sudo journalctl -u git-dirt-watch.service -n 50

# Test the service manually
sudo systemctl start git-dirt-watch.service
```

## Security Considerations

1. **Webhook Protection**: Treat Discord webhook URLs as secrets. Never commit them to version control.

2. **File Permissions**: Restrict access to the `.env` file:
   ```bash
   chmod 600 /opt/slimy/tools/git-dirt-watch/.env
   ```

3. **Repository Access**: Ensure the script runs with appropriate permissions to access all monitored repositories.

4. **Network Security**: The script makes outbound HTTPS connections to Discord. Ensure your firewall allows this.

## Maintenance

### Updating the Script

```bash
# Pull latest changes from slimy-monorepo
cd /path/to/slimy-monorepo
git pull

# Copy updated script
sudo cp infra/git-dirt-watcher/git-dirt-watch.sh /opt/slimy/tools/git-dirt-watch/

# Restart the timer if running
sudo systemctl restart git-dirt-watch.timer
```

### Adding/Removing Repositories

Edit the `repos.txt` file and save. Changes take effect on the next scheduled run.

```bash
sudo nano /opt/slimy/tools/git-dirt-watch/repos.txt
```

### Adjusting Schedule

Edit the timer unit and reload:

```bash
sudo nano /etc/systemd/system/git-dirt-watch.timer
sudo systemctl daemon-reload
sudo systemctl restart git-dirt-watch.timer
```

## Architecture Notes

This tool follows the "deployment targets should be clean" philosophy:

- **NUCs (NUC1/NUC2)**: Should only receive code via proper deployment processes (git pull, CI/CD, etc.)
- **Development machines**: May have uncommitted changes during active development
- **Production servers**: Should always match a known git commit

Git Dirt Watcher helps enforce this by alerting when repositories on deployment targets have uncommitted changes, which might indicate:
- Manual hotfixes that need to be committed
- Failed deployments that left artifacts
- Accidental local modifications
- Security concerns (unauthorized changes)

See `docs/git-dirt-watcher-overview.md` for more architectural context.

## License

Part of the Slimy monorepo. See repository root for license information.
