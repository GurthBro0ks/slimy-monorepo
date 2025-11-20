# Auto-Deploy System Overview

This document provides a high-level overview of the auto-deploy system for the slimy-monorepo project, including architecture diagrams, workflow explanations, and how it integrates with other deployment tools.

## Table of Contents

- [Introduction](#introduction)
- [Architecture](#architecture)
- [Deployment Flow](#deployment-flow)
- [Integration with Git Dirt Watcher](#integration-with-git-dirt-watcher)
- [Comparison: Auto-Deploy vs Git Dirt Watcher](#comparison-auto-deploy-vs-git-dirt-watcher)
- [Production Deployment Strategy](#production-deployment-strategy)
- [Best Practices](#best-practices)
- [Security Considerations](#security-considerations)

## Introduction

The auto-deploy system is a lightweight, cron-based deployment automation tool that monitors Git repositories for changes and automatically deploys updates to running services. It's designed to be simple, reliable, and easy to configure for different environments.

### Key Features

- **Automatic**: Runs on a schedule (e.g., every 5 minutes) to check for updates
- **Safe**: Only deploys if tests and builds succeed
- **Flexible**: Configurable per-host via YAML files
- **Observable**: Logs all actions with timestamps and optional Discord notifications
- **Self-contained**: No external dependencies beyond Git and basic shell utilities

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         GitHub Repository                        │
│                     (slimy-monorepo - main)                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ git push
                             ▼
         ┌───────────────────────────────────────────┐
         │         GitHub Remote (origin)            │
         └───────────────┬───────────────────────────┘
                         │
                         │ git fetch (every 5 min)
                         ▼
         ┌───────────────────────────────────────────┐
         │          Local Repository Clone           │
         │      (e.g., /opt/slimy/slimy-monorepo)   │
         └───────────────┬───────────────────────────┘
                         │
                         │ monitored by
                         ▼
         ┌───────────────────────────────────────────┐
         │          auto-deploy.sh Script            │
         │  (triggered by cron or systemd timer)     │
         └───────────────┬───────────────────────────┘
                         │
         ┌───────────────┴────────────────┐
         │                                │
         ▼                                ▼
┌─────────────────┐           ┌──────────────────────┐
│   Test Suite    │           │   Build Process      │
│  (pnpm test)    │──────────▶│   (pnpm build)       │
└─────────────────┘   pass    └──────────┬───────────┘
         │                               │
         │ fail                          │ success
         ▼                               ▼
    ┌────────┐              ┌────────────────────────┐
    │  ABORT │              │  Deploy Command        │
    └────────┘              │  (docker compose up)   │
                            └──────────┬─────────────┘
                                       │
                                       ▼
                            ┌────────────────────────┐
                            │   Running Services     │
                            │   (containers/apps)    │
                            └────────────────────────┘
```

### File Structure

```
slimy-monorepo/
├── infra/
│   └── auto-deploy/
│       ├── auto-deploy.sh              # Main deployment script
│       ├── deploy-host-config.yml      # Host-specific configuration
│       ├── deploy-host-config.example.yml
│       ├── .env                        # Environment variables (optional)
│       ├── .env.example
│       └── README.md                   # Setup instructions
├── docs/
│   └── auto-deploy-overview.md         # This file
└── (repository contents)
```

## Deployment Flow

### Detailed Workflow

```
┌──────────────────────────────────────────────────────────────────┐
│                    Cron/Timer Trigger                             │
│              (runs every N minutes)                               │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────┐
        │  1. Load Configuration             │
        │     - Read deploy-host-config.yml  │
        │     - Read .env (if exists)        │
        └────────────┬───────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │  2. Git Fetch                      │
        │     - Fetch from origin/main       │
        │     - Get remote commit hash       │
        └────────────┬───────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │  3. Compare Commits                │
        │     local_hash vs remote_hash      │
        └────────────┬───────────────────────┘
                     │
         ┌───────────┴──────────┐
         │                      │
         ▼                      ▼
    ┌─────────┐         ┌──────────────┐
    │  Equal? │         │  Behind?     │
    │  EXIT   │         │  Continue... │
    └─────────┘         └──────┬───────┘
                               │
                               ▼
                ┌──────────────────────────────┐
                │  4. Git Pull                 │
                │     - Pull latest changes    │
                │     - Update working tree    │
                └──────────┬───────────────────┘
                           │
                           ▼
                ┌──────────────────────────────┐
                │  5. Run Tests (optional)     │
                │     - Execute test_command   │
                │     - Check exit code        │
                └──────────┬───────────────────┘
                           │
                 ┌─────────┴─────────┐
                 │                   │
                 ▼                   ▼
           ┌─────────┐         ┌─────────┐
           │  FAIL?  │         │  PASS?  │
           │  ABORT  │         │Continue │
           └─────────┘         └────┬────┘
                                    │
                                    ▼
                ┌──────────────────────────────┐
                │  6. Run Build                │
                │     - Execute build_command  │
                │     - Check exit code        │
                └──────────┬───────────────────┘
                           │
                 ┌─────────┴─────────┐
                 │                   │
                 ▼                   ▼
           ┌─────────┐         ┌─────────┐
           │  FAIL?  │         │  PASS?  │
           │  ABORT  │         │Continue │
           └─────────┘         └────┬────┘
                                    │
                                    ▼
                ┌──────────────────────────────┐
                │  7. Run Deployment           │
                │     - Execute deploy_command │
                │     - Restart services       │
                └──────────┬───────────────────┘
                           │
                           ▼
                ┌──────────────────────────────┐
                │  8. Send Notification        │
                │     - Discord webhook        │
                │     - Log success/failure    │
                └──────────────────────────────┘
```

### State Transitions

```
┌─────────────┐
│   IDLE      │◄────────────────────────────┐
│             │                             │
└──────┬──────┘                             │
       │                                    │
       │ Cron trigger                       │
       ▼                                    │
┌─────────────┐                             │
│  CHECKING   │                             │
│  (fetch)    │                             │
└──────┬──────┘                             │
       │                                    │
       │ New commits found                  │
       ▼                                    │
┌─────────────┐                             │
│  PULLING    │                             │
│  (git pull) │                             │
└──────┬──────┘                             │
       │                                    │
       │                                    │
       ▼                                    │
┌─────────────┐     Test/build fail         │
│  TESTING    │─────────────────┐           │
│  & BUILDING │                 │           │
└──────┬──────┘                 ▼           │
       │                  ┌──────────┐      │
       │ Success          │  FAILED  │──────┘
       ▼                  └──────────┘
┌─────────────┐
│  DEPLOYING  │
│             │
└──────┬──────┘
       │
       │ Deployment complete
       ▼
┌─────────────┐
│  SUCCESS    │────────────────────────────►
│  (notify)   │
└─────────────┘
```

## Integration with Git Dirt Watcher

The auto-deploy system complements the [Git Dirt Watcher](../infra/git-dirt-watcher/) but serves a different purpose:

### Git Dirt Watcher

**Purpose**: Detect uncommitted local changes and remind developers to commit/push

**Scope**: Development machines, local repositories

**Trigger**: Watches for file changes in real-time

**Action**: Notifies developers (no automatic actions)

### Auto-Deploy Script

**Purpose**: Automatically deploy committed changes from remote repository

**Scope**: Production/staging servers

**Trigger**: Scheduled checks (cron/systemd timer)

**Action**: Automatically deploys if tests/builds pass

### Combined Workflow

```
┌──────────────────────────────────────────────────────────────────┐
│                    Developer Machine                              │
│                                                                   │
│  ┌─────────────┐                                                 │
│  │ Local Repo  │                                                 │
│  │  (changes)  │                                                 │
│  └──────┬──────┘                                                 │
│         │                                                        │
│         │ watched by                                             │
│         ▼                                                        │
│  ┌──────────────────┐                                            │
│  │ Git Dirt Watcher │                                            │
│  │  "You have 5     │                                            │
│  │   uncommitted    │                                            │
│  │   files!"        │                                            │
│  └──────────────────┘                                            │
│         │                                                        │
│         │ Developer commits and pushes                           │
│         ▼                                                        │
└────────────────────────────────────────────────────────────────┐ │
                                                                 │ │
                      git push                                   │ │
                         │                                       │ │
                         ▼                                       │ │
         ┌───────────────────────────────────┐                   │ │
         │       GitHub (Remote)             │                   │ │
         └───────────────┬───────────────────┘                   │ │
                         │                                       │ │
                         │ git fetch (every 5 min)               │ │
                         ▼                                       │ │
┌────────────────────────────────────────────────────────────────┼─┘
│                  Production Server (NUC1/NUC2)                 │
│                                                                 │
│  ┌──────────────────┐                                          │
│  │  Auto-Deploy     │                                          │
│  │  Script (cron)   │                                          │
│  └────────┬─────────┘                                          │
│           │                                                    │
│           │ New commits detected                               │
│           ▼                                                    │
│  ┌──────────────────┐                                          │
│  │  Test → Build    │                                          │
│  │  → Deploy        │                                          │
│  └────────┬─────────┘                                          │
│           │                                                    │
│           ▼                                                    │
│  ┌──────────────────┐                                          │
│  │ Running Services │                                          │
│  │   (updated)      │                                          │
│  └──────────────────┘                                          │
└─────────────────────────────────────────────────────────────────┘
```

### Key Differences

| Feature | Git Dirt Watcher | Auto-Deploy Script |
|---------|------------------|-------------------|
| **Location** | Developer machines | Production servers |
| **Monitors** | Local uncommitted changes | Remote repository commits |
| **Frequency** | Real-time (file watcher) | Scheduled (cron/timer) |
| **Action** | Notification only | Automated deployment |
| **Purpose** | Prevent forgotten commits | Automate deployments |
| **Risk** | Low (read-only) | High (modifies production) |

## Comparison: Auto-Deploy vs Git Dirt Watcher

### When to Use Auto-Deploy

✅ Production servers that need automatic updates
✅ Staging environments for continuous deployment
✅ Services with good test coverage
✅ Environments where downtime windows are flexible
✅ Internal tools and non-critical services

### When to Use Git Dirt Watcher

✅ Development machines
✅ Shared development servers
✅ Preventing work-in-progress loss
✅ Enforcing commit discipline
✅ Tracking local changes

### When to Use Both

✅ Complete CI/CD pipeline
✅ Development → Staging → Production workflow
✅ Team environments with multiple developers
✅ Projects requiring deployment automation AND code discipline

## Production Deployment Strategy

### Recommended Multi-Stage Pipeline

```
┌──────────────┐
│  Developer   │
│   Machine    │
└──────┬───────┘
       │
       │ git push
       ▼
┌──────────────────────────────────────────────┐
│         GitHub Repository                    │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │   dev    │→ │  staging │→ │   main    │  │
│  └──────────┘  └──────────┘  └───────────┘  │
└────────┬────────────┬──────────────┬─────────┘
         │            │              │
         │            │              │
    (manual)     auto-deploy    auto-deploy
         │            │              │
         ▼            ▼              ▼
   ┌──────────┐ ┌──────────┐  ┌──────────┐
   │   Dev    │ │ Staging  │  │Production│
   │  Server  │ │  Server  │  │  Server  │
   │          │ │ (NUC1)   │  │  (NUC2)  │
   └──────────┘ └──────────┘  └──────────┘
    (optional)   Auto-Deploy   Auto-Deploy
                 + Monitoring   + Alerts
```

### Environment-Specific Configurations

#### Staging (Aggressive Auto-Deploy)

```yaml
# deploy-host-config.yml for staging
repo_path: /opt/slimy/slimy-monorepo
branch: staging
test_command: pnpm test --coverage
build_command: pnpm build
deploy_command: docker compose -f docker-compose.staging.yml up -d --force-recreate

# Cron: Every 5 minutes
*/5 * * * * /opt/slimy/scripts/auto-deploy/auto-deploy.sh
```

#### Production (Conservative Auto-Deploy)

```yaml
# deploy-host-config.yml for production
repo_path: /opt/slimy/slimy-monorepo
branch: main
test_command: pnpm test --ci --maxWorkers=2
build_command: pnpm build --production
deploy_command: docker compose -f docker-compose.prod.yml up -d --no-build

# Cron: Every 15 minutes, only during business hours
*/15 9-17 * * 1-5 /opt/slimy/scripts/auto-deploy/auto-deploy.sh
```

## Best Practices

### 1. Start with Staging

Always test auto-deploy on a staging environment before production:

```bash
# Staging first
NUC1 (staging) → Test auto-deploy for 1 week → Review logs

# Then production
NUC2 (production) → Enable auto-deploy → Monitor closely
```

### 2. Implement Health Checks

Add health checks to your deployment command:

```yaml
deploy_command: |
  docker compose -f docker-compose.prod.yml up -d && \
  sleep 10 && \
  curl -f http://localhost:3000/health || \
  (docker compose -f docker-compose.prod.yml down && exit 1)
```

### 3. Use Deployment Windows

Restrict deployments to safe time windows:

```bash
# Weekdays, business hours only
*/15 9-17 * * 1-5 /opt/slimy/scripts/auto-deploy/auto-deploy.sh

# Off-peak hours only
0 2,14 * * * /opt/slimy/scripts/auto-deploy/auto-deploy.sh
```

### 4. Monitor and Alert

Set up monitoring with Discord/Slack notifications:

```bash
# .env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### 5. Plan for Rollbacks

Document and test rollback procedures:

```bash
# Rollback script
cd /opt/slimy/slimy-monorepo
git reset --hard HEAD~1
docker compose -f docker-compose.prod.yml up -d --force-recreate
```

### 6. Version Control Your Configuration

Keep deployment configs in the repository:

```bash
infra/auto-deploy/configs/
├── nuc1-staging.yml
└── nuc2-production.yml
```

### 7. Log Everything

Capture logs for debugging:

```bash
# Comprehensive logging
*/5 * * * * /opt/slimy/scripts/auto-deploy/auto-deploy.sh >> /var/log/auto-deploy.log 2>&1

# Log rotation
/var/log/auto-deploy.log {
    daily
    rotate 14
    compress
    missingok
    notifempty
}
```

## Security Considerations

### 1. Least Privilege

Run auto-deploy with minimal permissions:

```bash
# Create dedicated user
sudo useradd -r -s /bin/bash autodeploy

# Grant only necessary permissions
sudo chown -R autodeploy:autodeploy /opt/slimy/
sudo chmod 750 /opt/slimy/scripts/auto-deploy/auto-deploy.sh
```

### 2. Secure Secrets

Never commit secrets:

```bash
# .gitignore
infra/auto-deploy/.env
infra/auto-deploy/deploy-host-config.yml
```

Use environment variables or secret managers:

```bash
# Use systemd EnvironmentFile
[Service]
EnvironmentFile=/etc/autodeploy/secrets.env
```

### 3. Git Authentication

Use SSH keys with limited scope:

```bash
# Generate deploy key
ssh-keygen -t ed25519 -C "autodeploy@nuc1" -f ~/.ssh/autodeploy_key

# Add to GitHub as read-only deploy key
# Configure Git to use it:
git config core.sshCommand "ssh -i ~/.ssh/autodeploy_key"
```

### 4. Branch Protection

Protect production branches:

- Require pull request reviews
- Require status checks to pass
- Require signed commits
- Restrict who can push

### 5. Audit Logging

Log all deployments:

```bash
# Add to auto-deploy.sh
logger -t auto-deploy "Deployment started for $repo_path"
```

### 6. Network Security

Limit outbound access:

```bash
# Firewall rules: only allow GitHub IPs for git operations
# Use private network for internal services
```

## Conclusion

The auto-deploy system provides a simple, reliable way to automate deployments while maintaining safety through tests and builds. When combined with the Git Dirt Watcher for development machines, it creates a complete workflow from development to production.

### Summary

- **Auto-Deploy**: Automated deployment on servers
- **Git Dirt Watcher**: Change detection on developer machines
- **Together**: Complete CI/CD pipeline with safety checks

For detailed setup instructions, see [infra/auto-deploy/README.md](../infra/auto-deploy/README.md).
