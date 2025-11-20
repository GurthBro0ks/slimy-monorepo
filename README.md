# Slimy Monorepo

This repository is the future home for all Slimy.ai applications and shared packages. It currently contains only scaffolding while we prepare to import existing projects such as **slimyai-web** and **slimyai_setup**. Each app and package below will eventually host the migrated code and build tooling managed through a pnpm workspace.

## Getting Started

### Prerequisites

- Install [pnpm](https://pnpm.io/) if you have not already
- PostgreSQL database (local or remote)
- Discord OAuth application credentials

### Initial Setup

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Configure environment**
   ```bash
   # Copy the example env file
   cp apps/admin-api/.env.example apps/admin-api/.env

   # Edit .env and set your values (DATABASE_URL, DISCORD_CLIENT_ID, etc.)
   ```

3. **Bootstrap the database**
   ```bash
   pnpm bootstrap
   ```

   This script will:
   - Validate environment variables
   - Run database migrations for all apps
   - Seed initial data
   - Display Discord OAuth invite URL
   - Show admin configuration instructions

4. **Get Discord User ID for admin access**
   - Enable Developer Mode in Discord: Settings > Advanced > Developer Mode
   - Right-click on your user and select "Copy User ID"
   - Add it to `ADMIN_USER_IDS` in `.env`

5. **Start the services**
   ```bash
   # Start admin API
   cd apps/admin-api && pnpm start

   # In another terminal, start admin UI
   cd apps/admin-ui && pnpm dev
   ```

### Development Scripts

- `pnpm bootstrap` - Initialize/update database and display configuration
- `pnpm lint` - Run linting across all packages
- `pnpm build` - Build all packages
- `pnpm test` - Run tests across all packages

## Structure

- `apps/` holds runnable Slimy.ai applications (web, admin, bot, etc.).
- `packages/` keeps shared libraries such as configuration, database helpers, auth utilities, and other reusable pieces.
- `infra/` captures deployment and operations tooling (Caddy, Docker, systemd units, monitoring, backups, and scripts).
- `docs/` tracks design notes and architectural documentation.
- `.github/workflows/` will contain CI definitions to validate monorepo changes.

More detailed ownership expectations live in `docs/STRUCTURE.md`.
