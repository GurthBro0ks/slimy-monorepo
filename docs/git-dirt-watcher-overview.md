# Git Dirt Watcher - Architectural Overview

## Purpose

The Git Dirt Watcher is a monitoring tool designed to enforce clean repository hygiene on deployment targets within the Slimy infrastructure. It detects uncommitted changes (referred to as "dirt") in git repositories and sends automated alerts to Discord.

## Philosophy: Deployment Targets Should Be Clean

In the Slimy ecosystem, there is a clear distinction between different types of environments:

### Development Machines
- **Permitted state**: Dirty repositories with uncommitted changes
- **Use case**: Active development, experimentation, testing
- **Git workflow**: Feature branches, WIP commits, local modifications
- **Monitoring**: Not required

### Deployment Targets (NUC1, NUC2, Production Servers)
- **Expected state**: Clean repositories matching known commits
- **Use case**: Running production or staging workloads
- **Git workflow**: Only receive code via:
  - `git pull` from approved branches
  - CI/CD deployment pipelines
  - Automated deployment scripts
  - Infrastructure-as-Code tooling
- **Monitoring**: **Required** - This is where Git Dirt Watcher lives

## Why Monitor for Uncommitted Changes?

Uncommitted changes on deployment targets are red flags that indicate:

### 1. Manual Hotfixes
Someone may have SSHed into a production server and made quick edits directly, bypassing version control and peer review. While sometimes necessary in emergencies, these changes:
- Should be committed and pushed to version control
- Need to be reviewed and integrated properly
- Risk being lost during the next deployment

### 2. Failed or Incomplete Deployments
A deployment process may have:
- Generated temporary files that weren't cleaned up
- Modified configuration files unexpectedly
- Left the repository in an inconsistent state
- Crashed mid-deployment, leaving artifacts

### 3. Accidental Local Modifications
- Scripts or tools may have inadvertently modified tracked files
- File permission changes picked up by git
- Automated processes generating files in wrong locations

### 4. Security Concerns
- Unauthorized access and modifications
- Malicious code injection
- Configuration tampering
- Indicator of compromise

## How Git Dirt Watcher Fits Into Slimy Infrastructure

### Current Infrastructure

```
┌─────────────────────────────────────────────────────────────┐
│                     Slimy Monorepo                          │
│                  (Source of Truth)                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ git pull / CI/CD deployments
                     │
        ┌────────────┴────────────┬───────────────────────────┐
        │                         │                           │
   ┌────▼─────┐            ┌─────▼──────┐           ┌────────▼────────┐
   │   NUC1   │            │    NUC2    │           │  Production     │
   │          │            │            │           │  Servers        │
   └──────────┘            └────────────┘           └─────────────────┘
        │                         │                           │
        │                         │                           │
   ┌────▼─────────────────────────▼───────────────────────────▼────┐
   │                 Git Dirt Watcher                             │
   │           (Periodic monitoring via systemd timer)            │
   └────────────────────────────┬─────────────────────────────────┘
                                │
                                │ Webhook notifications
                                │
                         ┌──────▼────────┐
                         │    Discord    │
                         │   #alerts     │
                         └───────────────┘
```

### Integration Points

1. **Deployment Phase**: After any deployment, Git Dirt Watcher will verify the repository is in a clean state
2. **Continuous Monitoring**: Runs periodically (e.g., every 15 minutes) to catch changes that occur between deployments
3. **Alert Routing**: Sends notifications to Discord for immediate team visibility
4. **Audit Trail**: Systemd journal logs provide historical record of detected dirt

## Deployment Model

### What Goes Into Version Control
The Git Dirt Watcher module lives in the monorepo under `infra/git-dirt-watcher/`:
- `git-dirt-watch.sh` - The monitoring script
- `example.repos.txt` - Sample repository list
- `.env.example` - Environment variable template
- `README.md` - Installation and usage guide

### What Stays on Target Hosts
Each deployment target has its own configuration in `/opt/slimy/tools/git-dirt-watch/`:
- `repos.txt` - Host-specific list of repositories to monitor
- `.env` - Host-specific Discord webhook and settings (secrets, not committed)
- Systemd service/timer units - Host-specific scheduling

This separation allows:
- **Shared logic**: Script updates can be pulled from the monorepo
- **Host-specific config**: Each NUC/server monitors its own repositories
- **Secret management**: Webhook URLs stay on the host, never in git

## Use Cases in Slimy-Land

### NUC1/NUC2: Docker Compose Deployment Targets

The NUCs run various services via Docker Compose. Git Dirt Watcher monitors:
- `/opt/slimy/app/slimy-monorepo` - Main application code
- `/opt/slimy/infra/docker-compose/` - Docker Compose configurations
- `/etc/nginx/` - Reverse proxy configs (if version controlled)
- `/opt/slimy/tools/` - Operational scripts and tooling

**Scenario**: After a deployment, if someone manually edits a `docker-compose.yml` file to debug an issue, Git Dirt Watcher alerts the team within 15 minutes, ensuring the change gets properly committed or reverted.

### Production Servers: Critical Service Monitoring

Production servers running critical services need strict change control. Git Dirt Watcher monitors:
- Application code repositories
- Infrastructure-as-Code repositories (Terraform, Kubernetes manifests)
- Configuration management repositories (Ansible playbooks, etc.)

**Scenario**: If a hotfix is applied directly to a production server without going through CI/CD, the team is immediately notified to formalize and propagate the change.

### Multi-Repository Environments

A single host might have multiple repositories for different purposes:
- Application code
- Configuration files
- Deployment scripts
- Data processing pipelines

Git Dirt Watcher monitors all of them in a single pass, providing comprehensive coverage.

## Design Decisions

### Why Bash?
- **Portability**: Runs on any Linux host without dependencies
- **Simplicity**: Easy to audit, modify, and debug
- **Lightweight**: Minimal resource footprint
- **Systemd-friendly**: Integrates naturally with systemd timers

### Why Discord Webhooks?
- **No authentication complexity**: Webhooks are simple HTTP POST requests
- **Rich formatting**: Supports embeds with fields, colors, timestamps
- **Mobile notifications**: Team members get alerts on their phones
- **Existing infrastructure**: Slimy team already uses Discord
- **No additional services**: No need to run a notification server

### Why Systemd Timers?
- **Built-in**: Available on all modern Linux distributions
- **Reliable**: Handles missed runs, boot delays, and edge cases
- **Observable**: Integrates with journald for logging
- **Resource-efficient**: Runs only when needed, not continuously
- **Standard tooling**: `systemctl` commands for management

### Why Not Continuous Monitoring?
- **Resource efficiency**: Periodic checks are sufficient for most use cases
- **Alert fatigue**: 15-minute intervals prevent spam while catching issues quickly
- **Batch notifications**: Groups all dirty repos into a single Discord message
- **Simplicity**: Stateless script is easier to maintain than a daemon

## Future Enhancements

Potential improvements that maintain the design philosophy:

### Auto-Remediation
- Optional mode to automatically commit and push certain types of changes
- Configurable rules for what can be auto-committed
- Requires careful consideration of security implications

### Change Classification
- Categorize changes: modified files, new files, deleted files
- Different alert severity based on change type
- Special handling for certain file patterns (logs, temp files)

### Historical Tracking
- Log all detections to a central database
- Trend analysis: Which repos are frequently dirty?
- Compliance reporting for audits

### Integration with CI/CD
- Trigger re-deployment when dirt is detected
- Block deployments if target has uncommitted changes
- Pre-deployment verification step

### Multi-Channel Notifications
- Different Discord channels for different severity levels
- Email notifications for critical alerts
- PagerDuty integration for on-call rotations

### Repository Health Metrics
- Track how long repos stay dirty before being cleaned
- Identify repositories that need process improvements
- Dashboard showing fleet-wide repository cleanliness

## Operational Guidelines

### When Alerts Fire

1. **Acknowledge**: Confirm someone is investigating
2. **Identify**: Determine what changed and why
3. **Classify**: Emergency hotfix, failed deployment, or unauthorized change?
4. **Remediate**:
   - Commit and push legitimate changes
   - Revert unwanted changes
   - Re-run failed deployment
   - Investigate security implications if unauthorized
5. **Document**: Record the incident and resolution
6. **Prevent**: Update processes to avoid recurrence

### Expected Alert Frequency

- **Healthy environment**: Alerts should be rare (< 1 per week)
- **Active development**: More frequent during deployment windows
- **Cause for concern**: Daily alerts indicate process problems

### Tuning and Adjustment

- Adjust monitoring frequency based on deployment cadence
- Exclude certain file patterns if they generate false positives
- Add/remove repositories as infrastructure evolves
- Tune `DIRT_MAX_FILES` to balance detail vs. message length

## Conclusion

Git Dirt Watcher embodies the principle that deployment targets should be immutable, version-controlled environments. By monitoring for uncommitted changes and alerting the team, it helps maintain:

- **Reproducibility**: Every server's state matches a git commit
- **Auditability**: All changes flow through version control
- **Reliability**: Prevents configuration drift
- **Security**: Detects unauthorized modifications

This aligns perfectly with the Slimy infrastructure philosophy where NUCs are deployment targets, not development machines, and production state should always be known and controlled.
