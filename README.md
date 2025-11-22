# Slimy Monorepo

This repository is the future home for all Slimy.ai applications and shared packages. It currently contains only scaffolding while we prepare to import existing projects such as **slimyai-web** and **slimyai_setup**. Each app and package below will eventually host the migrated code and build tooling managed through a pnpm workspace.

## Getting Started

1. Install [pnpm](https://pnpm.io/) if you haven't already: `npm install -g pnpm`
2. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/GurthBro0ks/slimy-monorepo.git
   cd slimy-monorepo
   pnpm install
   ```
3. Generate Prisma clients:
   ```bash
   pnpm prisma:generate
   ```

## Development Quickstart

For detailed development workflows, see [docs/DEV_WORKFLOW.md](docs/DEV_WORKFLOW.md).

### Core Commands

```bash
# Start individual apps in development mode
pnpm dev:web          # Main web app (http://localhost:3000)
pnpm dev:admin-api    # Admin API server (http://localhost:3080)
pnpm dev:admin-ui     # Admin dashboard (http://localhost:3081)
pnpm dev:bot          # Bot application (TBD)

# Run tests
pnpm test:all         # Run all tests across the workspace
pnpm test:web         # Test web app only
pnpm test:admin-api   # Test admin API only

# Build and lint
pnpm build            # Build all apps
pnpm lint             # Lint all apps
```

## Structure

- `apps/` holds runnable Slimy.ai applications (web, admin, bot, etc.).
- `packages/` keeps shared libraries such as configuration, database helpers, auth utilities, and other reusable pieces.
- `infra/` captures deployment and operations tooling (Caddy, Docker, systemd units, monitoring, backups, and scripts).
- `docs/` tracks design notes and architectural documentation.
- `.github/workflows/` will contain CI definitions to validate monorepo changes.

More detailed ownership expectations live in `docs/STRUCTURE.md`.
