# Auto-Deploy Script

This directory contains a generic, configurable auto-deploy script for automatically deploying updates from Git repositories. The script monitors a Git repository for changes and automatically runs tests, builds, and deployments when new commits are pushed to the tracked branch.

## Overview

The auto-deploy system consists of:

- **auto-deploy.sh** - Main deployment script
- **deploy-host-config.yml** - Configuration file (you create from example)
- **.env** - Environment variables (optional, you create from example)

## Features

- ✅ Automatic Git fetch and pull when new commits are detected
- ✅ Configurable test, build, and deployment commands
- ✅ Fails fast: deployment only proceeds if tests and builds succeed
- ✅ Human-readable logging with timestamps
- ✅ Optional Discord webhook notifications
- ✅ Safe: checks for diverged branches and won't deploy if manual intervention is needed
- ✅ Flexible: all commands are configurable via YAML
- ✅ Environment variable support for secrets and options

## Quick Start

### 1. Copy Files to Target Host

Copy this entire directory to your deployment host (e.g., NUC1 or NUC2):

```bash
# On your local machine or CI/CD:
scp -r infra/auto-deploy/ user@nuc1:/opt/slimy/scripts/

# SSH into the host:
ssh user@nuc1
cd /opt/slimy/scripts/auto-deploy
```

### 2. Create Configuration Files

```bash
# Create your deployment configuration
cp deploy-host-config.example.yml deploy-host-config.yml

# Edit the configuration to match your environment
nano deploy-host-config.yml

# (Optional) Create environment file for additional options
cp .env.example .env
nano .env
```

### 3. Configure Your Deployment

Edit `deploy-host-config.yml` to specify:

- **repo_path**: Absolute path to your Git repository
- **branch**: Git branch to track (e.g., `main`, `production`)
- **test_command**: Command to run tests (optional)
- **build_command**: Command to build your application (optional)
- **deploy_command**: Command to deploy/restart your services

Example configuration:

```yaml
repo_path: /opt/slimy/slimy-monorepo
branch: main
test_command: pnpm test
build_command: pnpm build
deploy_command: docker compose -f docker-compose.prod.yml up -d
```

### 4. Test Manually

Run the script manually to ensure everything works:

```bash
./auto-deploy.sh
```

Check the output for any errors. The script will:
1. Fetch from the remote Git repository
2. Compare local and remote commits
3. Pull changes if behind
4. Run tests (if configured)
5. Run build (if configured)
6. Run deployment command (if tests and build succeed)

### 5. Set Up Automated Execution (Manual Step)

**IMPORTANT**: This step must be done manually on the target host. We do NOT automatically configure cron or systemd.

#### Option A: Using Cron (Simple)

Add to your crontab to run every 5 minutes:

```bash
# Edit crontab
crontab -e

# Add this line (adjust path as needed):
*/5 * * * * /opt/slimy/scripts/auto-deploy/auto-deploy.sh >> /var/log/auto-deploy.log 2>&1
```

The script will check for updates every 5 minutes and deploy if changes are detected.

#### Option B: Using Systemd Timer (Advanced)

Create systemd service and timer files:

```bash
# /etc/systemd/system/auto-deploy.service
[Unit]
Description=Auto-deploy slimy-monorepo
After=network.target

[Service]
Type=oneshot
User=youruser
WorkingDirectory=/opt/slimy/scripts/auto-deploy
ExecStart=/opt/slimy/scripts/auto-deploy/auto-deploy.sh
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```bash
# /etc/systemd/system/auto-deploy.timer
[Unit]
Description=Run auto-deploy every 5 minutes
Requires=auto-deploy.service

[Timer]
OnBootSec=2min
OnUnitActiveSec=5min
Unit=auto-deploy.service

[Install]
WantedBy=timers.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable auto-deploy.timer
sudo systemctl start auto-deploy.timer

# Check status
sudo systemctl status auto-deploy.timer
sudo journalctl -u auto-deploy.service -f
```

## Configuration Reference

### deploy-host-config.yml

| Field | Required | Description |
|-------|----------|-------------|
| `repo_path` | ✅ Yes | Absolute path to the Git repository |
| `branch` | ✅ Yes | Git branch to track and deploy |
| `test_command` | ❌ No | Command to run tests (null to skip) |
| `build_command` | ❌ No | Command to build the application (null to skip) |
| `deploy_command` | ❌ No | Command to deploy/restart services (null to skip) |

### .env Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DEPLOY_CONFIG` | `./deploy-host-config.yml` | Path to deployment config file |
| `SKIP_TESTS` | `0` | Set to `1` to skip tests (use with caution!) |
| `DISCORD_WEBHOOK_URL` | _(empty)_ | Discord webhook for notifications |

## Discord Notifications

To receive deployment notifications in Discord:

1. Create a webhook in your Discord server:
   - Server Settings → Integrations → Webhooks → New Webhook
   - Copy the webhook URL

2. Add to your `.env` file:
   ```bash
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_TOKEN
   ```

You'll receive notifications for:
- 🔵 New commits detected
- ✅ Successful deployments
- ❌ Failed deployments (with error details)

## Logging

By default, the script logs to stdout with timestamps. Examples:

```
[2025-11-19 10:30:15] INFO: Starting auto-deploy process
[2025-11-19 10:30:16] INFO: Checking repository: /opt/slimy/slimy-monorepo (branch: main)
[2025-11-19 10:30:17] INFO: New commits available on remote. Proceeding with deployment.
[2025-11-19 10:30:18] SUCCESS: Tests completed successfully
[2025-11-19 10:30:25] SUCCESS: Build completed successfully
[2025-11-19 10:30:30] SUCCESS: Auto-deploy completed successfully!
```

To capture logs to a file, redirect output when configuring cron or systemd (see examples above).

## Security Considerations

⚠️ **IMPORTANT - READ BEFORE DEPLOYING TO PRODUCTION**

1. **Test First**: Always test the script manually before automating it
2. **Backup Strategy**: Ensure you have backups before enabling auto-deploy
3. **Rollback Plan**: Have a documented rollback procedure
4. **Monitoring**: Set up alerts for deployment failures
5. **Secrets**: Never commit `.env` files with real credentials
6. **Permissions**: Run with minimal necessary permissions
7. **Testing**: Don't skip tests in production (`SKIP_TESTS=0`)
8. **Branch Protection**: Use branch protection rules on your Git repository
9. **Git Authentication**: Ensure Git credentials are properly configured (SSH keys or tokens)

### Recommended: Use a Staging Environment

Test auto-deployments on a staging server before enabling on production:

```yaml
# staging-config.yml
repo_path: /opt/slimy/slimy-monorepo
branch: staging
test_command: pnpm test
build_command: pnpm build
deploy_command: docker compose -f docker-compose.staging.yml up -d
```

## Troubleshooting

### Script reports "No deployment needed" every time

- Check that your local repository is not ahead of remote
- Verify the branch name matches exactly
- Ensure `git fetch` is working (check credentials)

### Tests or build failing

- Run commands manually in the repository directory
- Check for missing dependencies or environment variables
- Review logs for specific error messages

### Deployment command fails

- Verify the command works when run manually
- Check file permissions and ownership
- Ensure required services (Docker, etc.) are running

### Git authentication issues

```bash
# Set up SSH key authentication (recommended)
ssh-keygen -t ed25519 -C "auto-deploy@nuc1"
cat ~/.ssh/id_ed25519.pub  # Add to GitHub/GitLab

# Or use Git credential helper
git config --global credential.helper store
```

## Advanced Usage

### Multiple Repositories

To deploy multiple repositories, create multiple config files and scripts:

```bash
cp auto-deploy.sh auto-deploy-web.sh
cp auto-deploy.sh auto-deploy-api.sh

# In each script, set different DEPLOY_CONFIG:
DEPLOY_CONFIG=./config-web.yml ./auto-deploy-web.sh
DEPLOY_CONFIG=./config-api.yml ./auto-deploy-api.sh
```

### Custom Notification Systems

Modify the `send_discord_notification` function to integrate with:
- Slack webhooks
- Email (via `mail` command)
- PagerDuty
- Custom monitoring systems

### Deployment Hooks

Add pre/post deployment hooks by modifying the script:

```bash
# Before deployment
run_command "$pre_deploy_hook" "pre-deployment hook"

# After successful deployment
run_command "$post_deploy_hook" "post-deployment hook"
```

## How It Works

1. **Check**: Script runs (via cron or systemd timer)
2. **Fetch**: Fetches latest commits from remote Git repository
3. **Compare**: Compares local HEAD with remote branch HEAD
4. **Decide**: If local is behind remote, proceed; otherwise, exit
5. **Pull**: Pulls latest changes from remote
6. **Test**: Runs test command (if configured)
7. **Build**: Runs build command (if configured)
8. **Deploy**: Runs deployment command (if tests and build succeeded)
9. **Notify**: Sends notification (if configured)

## Related Documentation

See [docs/auto-deploy-overview.md](../../docs/auto-deploy-overview.md) for:
- Architecture diagrams
- Integration with Git Dirt Watcher
- Best practices for CI/CD
- Production deployment strategies

## Support

For issues or questions:
- Check the troubleshooting section above
- Review logs for error messages
- Ensure all prerequisites are installed
- Test commands manually to isolate issues

## License

Part of the slimy-monorepo project.
