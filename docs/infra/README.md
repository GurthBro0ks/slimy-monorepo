# Infrastructure Documentation

This directory contains documentation for infrastructure, deployment, and operations.

## Key Documents

### [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)
Comprehensive guide for Docker-based deployment to NUC servers, including:
- Quick NUC deploy checklist
- Fresh deployment procedures
- Update workflows
- Troubleshooting (especially overlay2 cache issues on NUC hosts)
- Architecture notes on monorepo builds

## Infrastructure Components

### Docker (`infra/docker`)
- Container images and compose files
- Separate configs for `slimy-nuc1` and `slimy-nuc2`
- Multi-stage Dockerfile builds for optimal image sizes
- Build context: monorepo root (not individual app dirs)

### Reverse Proxy (`infra/caddy`)
- Caddy configuration for reverse proxying
- TLS certificate management

### systemd (`infra/systemd`)
- Service unit files for systemd-managed deployments

### Scripts (`infra/scripts`)
- Helper scripts for local development
- Deployment automation utilities

### Monitoring (`infra/monitoring`)
- Observability dashboards
- Metrics collectors
- Alert configurations

### Backups (`infra/backups`)
- Backup/restore automation
- Retention policies

## Environment Files

### NUC1 Locations
- Web: `/opt/slimy/test/slimyai-web/.env.production`
- Admin API: `/opt/slimy/app/admin-api/.env.admin.production`
- Admin UI: `/opt/slimy/app/admin-ui/.env.production`

### NUC2 Locations
- Web: `/opt/slimy/secrets/.env.web.production`
- Admin API: `/opt/slimy/secrets/.env.admin.production`
- DB: `/opt/slimy/secrets/.env.db.slimy-nuc2`

## Quick Deploy Reference

**On Laptop:**
```bash
corepack enable && corepack prepare pnpm@10.22.0 --activate
pnpm install && pnpm --filter @slimy/web run db:generate
pnpm build && pnpm --filter @slimy/web test
git commit && git push
```

**On NUC:**
```bash
cd /opt/slimy/slimy-monorepo && git pull
corepack enable && corepack prepare pnpm@10.22.0 --activate
pnpm install && pnpm --filter @slimy/web run db:generate
pnpm build

cd infra/docker
docker compose -f docker-compose.slimy-nuc2.yml build
docker compose -f docker-compose.slimy-nuc2.yml up -d
```

## Common Issues

### overlay2 Cache Corruption
Docker's overlay2 storage driver can accumulate stale cache. Symptoms include:
```
failed to solve: cannot replace to directory /var/lib/docker/overlay2/.../merged/app/node_modules/...
```

**Fix:**
```bash
docker compose -f docker-compose.slimy-nuc2.yml down
docker builder prune -f
docker compose -f docker-compose.slimy-nuc2.yml build --no-cache
docker compose -f docker-compose.slimy-nuc2.yml up -d
```

See [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) for detailed troubleshooting.

### Build Scripts Not Running
If Prisma/Sharp/esbuild binaries are missing, ensure `pnpm-workspace.yaml` includes them in `onlyBuiltDependencies`.

## Architecture Notes

### Monorepo Docker Context
All Dockerfiles use the **monorepo root** as build context (not individual app directories). This ensures:
- `pnpm-workspace.yaml` is available during build
- All workspace dependencies can be resolved
- Build scripts run correctly in non-interactive mode

### pnpm v10 Build Scripts
pnpm v10 blocks dependency lifecycle scripts by default. The workspace config explicitly allows trusted packages:
- `@prisma/client`, `@prisma/engines`, `prisma`
- `sharp`, `esbuild`, `unrs-resolver`

## Related Documentation

- [Repository Structure](../STRUCTURE.md)
- [Application Docs](../apps/README.md)
- [Development Workflows](../dev/README.md)

## Agent Reports

Infrastructure-related agent improvements will be linked here as they become available.
