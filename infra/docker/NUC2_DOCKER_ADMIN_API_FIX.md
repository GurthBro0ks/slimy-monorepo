# NUC2 Admin-API Docker Overlay2 Fix

## Problem

On slimy-nuc2, Docker builds for the `admin-api` service failed with:

> cannot replace to directory /var/lib/docker/overlay2/.../merged/app/node_modules/axios with file

This was caused by host-side `node_modules` directories being included in the Docker build context and overlaid inside the container, conflicting with dependencies installed by `npm install` in the image.

## Fix

1. Add a monorepo-level `.dockerignore` that excludes:
   - all `node_modules`
   - build artifacts (`.next`, `dist`, `build`, `coverage`)
   - other local-only files

2. Clean up any stray `apps/*/node_modules` directories if they were accidentally created:
   ```bash
   rm -rf apps/admin-api/node_modules \
          apps/admin-ui/node_modules \
          apps/web/node_modules
3. Rebuild images using a clean cache:
cd /opt/slimy/slimy-monorepo/infra/docker
docker builder prune -f
docker compose -f docker-compose.slimy-nuc2.yml build --no-cacheAfter this, the admin-api image builds successfully without overlay2/axios errors.

Notes

Dependencies for apps are installed via pnpm at the monorepo root, not per-app node_modules.

Docker images should rely on npm install / pnpm install inside the container, not host node_modules.
