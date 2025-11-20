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

## Bootstrap

The bootstrap script initializes the database and ensures an admin user exists. It's safe to run multiple times (idempotent).

### Prerequisites

1. Ensure `DATABASE_URL` is set in your environment (`.env` file or shell)
2. Apply Prisma migrations: `cd apps/admin-api && npx prisma migrate deploy`
3. (Optional) Set `INITIAL_ADMIN_DISCORD_ID` to your Discord user ID in `.env`

### Usage

```bash
pnpm bootstrap
```

### What it does

- Connects to the database and verifies the connection
- Creates or updates an admin user based on `INITIAL_ADMIN_DISCORD_ID` (or uses a placeholder)
- Creates a "System Administration" guild and assigns the admin user to it with `["admin", "owner"]` roles
- Displays database statistics (user count, guild count, sessions, messages)
- Prints environment configuration status
- Suggests next steps for getting started

### Environment Variables

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `DISCORD_CLIENT_ID` - Discord OAuth client ID
- `DISCORD_CLIENT_SECRET` - Discord OAuth client secret
- `JWT_SECRET` - Secret for JWT token signing

**Optional:**
- `INITIAL_ADMIN_DISCORD_ID` - Discord ID of the initial admin user
- `INITIAL_ADMIN_USERNAME` - Username for the admin user (default: "admin")
- `SYSTEM_GUILD_DISCORD_ID` - Discord ID for the system guild (default: "SYSTEM_GUILD_000")
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `NEXT_PUBLIC_APP_URL` - Public URL of the application

### Safety

The bootstrap script is designed to be safe:
- **Idempotent**: Can be run multiple times without adverse effects
- **Non-destructive**: Never deletes data
- **Upsert operations**: Creates or updates records as needed
- **Error handling**: Exits cleanly on errors with descriptive messages

## Structure

- `apps/` holds runnable Slimy.ai applications (web, admin, bot, etc.).
- `packages/` keeps shared libraries such as configuration, database helpers, auth utilities, and other reusable pieces.
- `infra/` captures deployment and operations tooling (Caddy, Docker, systemd units, monitoring, backups, and scripts).
- `docs/` tracks design notes and architectural documentation.
- `.github/workflows/` will contain CI definitions to validate monorepo changes.

More detailed ownership expectations live in `docs/STRUCTURE.md`.
