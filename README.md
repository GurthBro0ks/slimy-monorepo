# Slimy Monorepo

This repository is the future home for all Slimy.ai applications and shared packages. It currently contains only scaffolding while we prepare to import existing projects such as **slimyai-web** and **slimyai_setup**. Each app and package below will eventually host the migrated code and build tooling managed through a pnpm workspace.

## Getting Started

- Install pnpm if you have not already.
- Run `pnpm install` once dependencies are added in future commits.
- Use the root scripts (`pnpm lint`, `pnpm build`, `pnpm test`) as orchestration entry points once real logic is wired up.

## Development Quickstart

Essential commands to get up and running:

```bash
# Install all dependencies
pnpm install

# Generate Prisma clients (required for admin-api and web)
pnpm prisma:generate

# Start individual apps
pnpm dev:web         # Web dashboard → http://localhost:3000
pnpm dev:admin-api   # Admin API → http://localhost:3080
pnpm dev:admin-ui    # Admin UI → http://localhost:3081
pnpm dev:bot         # Bot (placeholder)

# Run tests
pnpm test:all        # All workspaces
pnpm test:web        # Web app only
pnpm test:admin-api  # Admin API only

# Build all apps
pnpm build
```

For detailed setup instructions, environment configuration, and troubleshooting, see **[docs/DEV_WORKFLOW.md](docs/DEV_WORKFLOW.md)**.

## Structure

- `apps/` holds runnable Slimy.ai applications (web, admin, bot, etc.).
- `packages/` keeps shared libraries such as configuration, database helpers, auth utilities, and other reusable pieces.
- `infra/` captures deployment and operations tooling (Caddy, Docker, systemd units, monitoring, backups, and scripts).
- `docs/` tracks design notes and architectural documentation.
- `.github/workflows/` will contain CI definitions to validate monorepo changes.

More detailed ownership expectations live in `docs/STRUCTURE.md`.
