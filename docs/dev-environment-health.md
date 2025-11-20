# Dev Environment Health Check

This guide explains how to use the Slimy.ai development environment health check script to verify your laptop or NUC is properly configured for development work.

## Quick Start

Run the health check script from the monorepo root:

```bash
./tools/dev-health/check-env.sh
```

The script will check all required tools and print a PASS/FAIL summary.

## What the Script Checks

The health check verifies the following requirements:

### 1. Node.js Version

**Requirement:** Node.js >= 20

The script checks that Node.js is installed and meets the minimum version requirement for the Slimy.ai monorepo.

- **PASS:** Node.js v20 or higher is installed
- **FAIL:** Node.js is not installed or version is below 20

### 2. pnpm Package Manager

**Requirement:** pnpm installed

The monorepo uses pnpm for workspace management and dependency installation.

- **PASS:** pnpm is installed and available
- **FAIL:** pnpm is not found in PATH

### 3. git Version Control

**Requirement:** git installed

Git is required for version control and collaboration.

- **PASS:** git is installed
- **FAIL:** git is not found

### 4. Docker Daemon

**Requirement:** Docker installed and running

Many Slimy.ai services run in Docker containers for local development.

- **PASS:** Docker is installed and the daemon is running
- **FAIL:** Docker is not installed or daemon is not running

### 5. Workspace Configuration

**Requirement:** Valid pnpm workspace setup

Checks that you're running from the monorepo root with proper workspace configuration.

- **PASS:** Workspace configuration files exist
- **WARN:** Workspace configuration not found (may indicate wrong directory)

### 6. NUC Server Connectivity (Optional)

**Requirement:** Network access to nuc1/nuc2 (optional)

Tests connectivity to shared development/staging NUC servers if applicable.

- **PASS:** At least one NUC server is reachable
- **WARN:** No NUC servers reachable (normal for laptop-only development)

## Running on Different Environments

### Laptop Development

Most developers work locally on their laptops. Run the standard check:

```bash
./tools/dev-health/check-env.sh
```

You can skip network checks if you're only doing local development:

```bash
./tools/dev-health/check-env.sh --skip-network
```

### NUC Servers

When setting up or verifying a NUC server environment, run the full check including network tests:

```bash
./tools/dev-health/check-env.sh
```

The script will verify NUC connectivity which is relevant for shared environments.

## Interpreting Results

### Example: Successful Check

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Slimy.ai Dev Environment Health Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Checking: Node.js version
  ℹ INFO: Found Node.js v20.10.0
  ✓ PASS: Node.js version 20.10.0 is >= 20

Checking: pnpm package manager
  ℹ INFO: Found pnpm v8.12.1
  ✓ PASS: pnpm is installed

...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Passed: 5
  Failed: 0
  Warnings: 1

✓ Your development environment is ready!
```

### Example: Failed Check

```
Checking: Node.js version
  ℹ INFO: Found Node.js v18.16.0
  ✗ FAIL: Node.js version 18.16.0 is < 20 (recommended: >= 20)
  ℹ INFO: Consider upgrading to Node.js 20 LTS or higher

...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Passed: 3
  Failed: 2
  Warnings: 0

✗ Your development environment needs attention.
See docs/dev-environment-health.md for troubleshooting.
```

## Fixing Common Issues

### Node.js Not Installed or Wrong Version

**Problem:** Node.js is missing or version is below 20

**Solution:**

1. Install Node.js 20 LTS or higher:
   - **macOS:** `brew install node@20` or download from https://nodejs.org/
   - **Linux:** Use nvm: `nvm install 20 && nvm use 20`
   - **Direct download:** https://nodejs.org/en/download/

2. Verify installation: `node --version`

### pnpm Not Installed

**Problem:** pnpm command not found

**Solution:**

1. Install pnpm globally:
   ```bash
   npm install -g pnpm
   ```

2. Or use corepack (Node.js 16+):
   ```bash
   corepack enable
   corepack prepare pnpm@latest --activate
   ```

3. Verify installation: `pnpm --version`

### Docker Not Running

**Problem:** Docker daemon is not running

**Solution:**

1. **macOS:** Start Docker Desktop application

2. **Linux (systemd):**
   ```bash
   sudo systemctl start docker
   sudo systemctl enable docker  # Auto-start on boot
   ```

3. **Verify:** `docker ps` should return without errors

4. **Permissions (Linux):** Add your user to docker group:
   ```bash
   sudo usermod -aG docker $USER
   # Log out and back in for group changes to take effect
   ```

### Docker Not Installed

**Problem:** Docker command not found

**Solution:**

1. **macOS:** Install Docker Desktop from https://docs.docker.com/desktop/mac/install/

2. **Linux:** Follow distribution-specific instructions:
   - Ubuntu/Debian: https://docs.docker.com/engine/install/ubuntu/
   - Fedora: https://docs.docker.com/engine/install/fedora/
   - Other: https://docs.docker.com/engine/install/

3. Verify installation: `docker --version`

### git Not Installed

**Problem:** git command not found

**Solution:**

1. Install git:
   - **macOS:** `brew install git` or install Xcode Command Line Tools
   - **Ubuntu/Debian:** `sudo apt-get install git`
   - **Fedora:** `sudo dnf install git`

2. Configure git:
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

3. Verify installation: `git --version`

### Not in Monorepo Root

**Problem:** Workspace configuration not found

**Solution:**

Make sure you're running the script from the monorepo root directory:

```bash
cd /path/to/slimy-monorepo
./tools/dev-health/check-env.sh
```

### NUC Connectivity Warnings

**Problem:** Warning about NUC servers not reachable

**Solution:**

This is normal if you're doing laptop-only development. NUC connectivity is only needed when:

- Working with shared staging environments
- Testing cross-server integrations
- Accessing shared development databases

To skip these checks:

```bash
./tools/dev-health/check-env.sh --skip-network
```

If you need NUC access:

1. Ensure you're on the correct network (VPN if remote)
2. Verify hostnames are configured in `/etc/hosts` or DNS
3. Test connectivity: `ping nuc1` or `ping nuc2`

## Next Steps

Once all checks pass:

1. Install dependencies: `pnpm install`
2. Build all packages: `pnpm build`
3. Run tests: `pnpm test`
4. Start developing!

## Troubleshooting

If you encounter issues not covered here:

1. Check the script output for INFO messages with specific guidance
2. Verify you're using a supported operating system (macOS, Linux)
3. Consult team documentation for environment-specific configurations
4. Ask in the team Slack/Discord for help

## Script Options

### `--skip-network`

Skip network connectivity checks (NUC ping tests).

**Usage:**
```bash
./tools/dev-health/check-env.sh --skip-network
```

**When to use:**
- Laptop-only development
- Offline development
- Quick checks without network dependencies

## Maintenance

This script is designed to be read-only and does not modify your system. It only checks the current state of your development environment.

To update the checks or add new requirements, see `tools/dev-health/check-env.sh`.
