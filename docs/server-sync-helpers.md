# Server Sync Helpers

This document explains the sync helper scripts located in `infra/sync-helpers/` for managing the slimy-monorepo across your laptop and NUC servers.

## Philosophy: Git is the Source of Truth

**Always prefer git for syncing changes.** Git provides:
- Version control and history
- Conflict resolution
- Atomic commits
- Branch management
- Collaboration support

The recommended workflow is:
1. **On laptop**: Make changes, commit, and push to GitHub
2. **On NUCs**: Pull latest changes from GitHub

## Available Scripts

### pull-from-github.sh

**Purpose**: Simple git pull script for NUCs to sync from GitHub.

**Location**: `infra/sync-helpers/pull-from-github.sh`

**Usage**:
```bash
# On any NUC
cd /path/to/slimy-monorepo
./infra/sync-helpers/pull-from-github.sh
```

**What it does**:
1. Fetches latest changes from origin
2. Checks out the main branch
3. Pulls latest changes from origin/main

**When to use**: This should be your primary method for syncing NUCs with the latest code.

### rsync Templates

**Purpose**: Template scripts for rsync-based syncing from laptop to NUCs.

**Location**:
- `infra/sync-helpers/rsync-to-nuc1.sh.template`
- `infra/sync-helpers/rsync-to-nuc2.sh.template`

**When to use rsync**:
- ✅ **Initial seeding**: Setting up the repository on a brand new NUC
- ✅ **Emergency cases**: When git is temporarily unavailable or broken
- ✅ **Large binary files**: If you need to transfer large files not in git
- ❌ **Normal development**: Use git instead!

**Setup Instructions**:

1. **Copy the template**:
   ```bash
   cp infra/sync-helpers/rsync-to-nuc1.sh.template infra/sync-helpers/rsync-to-nuc1.sh
   ```

2. **Edit the configuration**:
   Open the new file and replace these placeholders:
   ```bash
   REMOTE_USER="your-username"      # e.g., "slimy"
   REMOTE_HOST="slimy-nuc1"         # e.g., "slimy-nuc1.local" or "192.168.1.100"
   REMOTE_PATH="/home/your-username/projects"  # Parent directory on NUC
   ```

3. **Make it executable**:
   ```bash
   chmod +x infra/sync-helpers/rsync-to-nuc1.sh
   ```

4. **Add to gitignore** (to avoid committing your credentials):
   ```bash
   echo "infra/sync-helpers/rsync-to-nuc*.sh" >> .gitignore
   ```

5. **Run it**:
   ```bash
   ./infra/sync-helpers/rsync-to-nuc1.sh
   ```

**What the rsync templates do**:
- Sync the entire monorepo from laptop to NUC via SSH
- Exclude common build artifacts (`node_modules/`, `.next/`, `dist/`, etc.)
- Exclude git directory and environment files
- Show progress during transfer
- Prompt for confirmation before syncing

**Important Notes**:
- ⚠️ Rsync bypasses git - changes won't be tracked in version control
- ⚠️ Running rsync can overwrite uncommitted changes on the NUC
- ⚠️ The `--delete` flag (commented out by default) will remove files on the destination that don't exist in the source

## Recommended Workflows

### Initial NUC Setup

```bash
# Option 1: Clone directly on NUC (recommended)
ssh your-user@slimy-nuc1
cd /home/your-user/projects
git clone https://github.com/your-org/slimy-monorepo.git

# Option 2: Use rsync from laptop (if git clone is slow/problematic)
# On laptop:
./infra/sync-helpers/rsync-to-nuc1.sh
# On NUC:
cd /home/your-user/projects/slimy-monorepo
git remote add origin https://github.com/your-org/slimy-monorepo.git
```

### Normal Development Workflow

```bash
# On laptop:
git add .
git commit -m "Your changes"
git push origin main

# On NUC:
cd /path/to/slimy-monorepo
./infra/sync-helpers/pull-from-github.sh
```

### Emergency Rsync (when git is broken)

```bash
# On laptop (after fixing the issue locally):
./infra/sync-helpers/rsync-to-nuc1.sh

# On NUC (after rsync completes):
cd /path/to/slimy-monorepo
git status  # Check what changed
git add .
git commit -m "Emergency sync from laptop"
git push origin main  # Get back to git-based workflow
```

## Troubleshooting

### SSH Connection Issues

If rsync or ssh commands fail:
1. Verify you can SSH manually: `ssh your-user@slimy-nuc1`
2. Check SSH keys are set up: `ssh-add -l`
3. Add your key if needed: `ssh-copy-id your-user@slimy-nuc1`

### Git Pull Conflicts

If `pull-from-github.sh` shows merge conflicts:
```bash
# On NUC:
git status
# Either commit your local changes first:
git add .
git commit -m "Local changes before pull"
git pull origin main
# Or stash them temporarily:
git stash
git pull origin main
git stash pop
```

### Rsync Permission Errors

Ensure:
- The destination directory exists on the NUC
- Your SSH user has write permissions to the destination
- The parent directory is correct in the config

## Security Notes

- Never commit your customized rsync scripts (with real hostnames/credentials) to git
- Always add them to `.gitignore`
- Use SSH keys instead of passwords for authentication
- Consider using SSH config (`~/.ssh/config`) to manage NUC connection settings

## Additional Resources

- [Git Documentation](https://git-scm.com/doc)
- [Rsync Manual](https://linux.die.net/man/1/rsync)
- [SSH Config Guide](https://www.ssh.com/academy/ssh/config)
