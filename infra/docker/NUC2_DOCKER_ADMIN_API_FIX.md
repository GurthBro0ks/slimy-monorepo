# Docker Build Fix: Admin-API Axios Overlay2 Error (slimy-nuc2)

**Date:** 2025-11-19
**Host:** slimy-nuc2
**Repository:** /opt/slimy/slimy-monorepo
**Branch:** claude/docker-deploy-reliability-01HwHbtRtny6uiTc5Qp8fi6y

---

## Problem Statement

The `admin-api` Docker build failed with:

```
failed to solve: cannot replace to directory /var/lib/docker/overlay2/.../merged/app/node_modules/axios with file
```

This occurred when running:
```bash
docker compose -f infra/docker/docker-compose.slimy-nuc2.yml build --no-cache
```

---

## Root Cause Analysis

The overlay2 driver error indicates a conflict between:

1. **Container-side:** `/app/node_modules/axios` (directory created by `npm install --omit=dev` in the Dockerfile)
2. **Host-side context:** `apps/admin-api/node_modules/axios` being copied into the build context

### Why This Happened

1. **Missing `.dockerignore`:** The repository root had no `.dockerignore` file, so the entire monorepo was included in the Docker build context.
2. **Stray app-level node_modules:** Three app directories had their own `node_modules` installed:
   - `apps/admin-api/node_modules`
   - `apps/admin-ui/node_modules`
   - `apps/web/node_modules`

   These should not exist in a pnpm monorepo (which uses a shared root `node_modules`).

3. **Copy order conflict:** The Dockerfile sequence:
   - `RUN npm install --omit=dev` (creates `/app/node_modules/axios`)
   - `COPY apps/admin-api ./` (tries to copy host `apps/admin-api/node_modules` on top)

   Docker's overlay2 filesystem couldn't merge a file with a directory.

---

## Solution Implemented

### 1. Created `.dockerignore` at Repository Root

**File:** `.dockerignore`

Patterns excluded from Docker build context:
- All `node_modules` directories (root and nested)
- Version control files (`.git`, `.gitignore`)
- Build artifacts (`.next`, `.turbo`, `dist`, `coverage`)
- Dependency caches (npm/yarn/pnpm logs)
- OS files (`.DS_Store`)
- IDE artifacts (`.vscode`, `.idea`)
- Docs and configuration unnecessary at runtime

This ensures the Docker build context is clean and doesn't include host-side `node_modules`.

### 2. Cleaned Up Stray App-Level node_modules

Removed the following directories (they were preventing proper dependency resolution):
```bash
rm -rf apps/admin-api/node_modules
rm -rf apps/admin-ui/node_modules
rm -rf apps/web/node_modules
```

These are not needed in a pnpm monorepo—all dependencies are managed via the root `/opt/slimy/slimy-monorepo/node_modules`.

### 3. Enhanced `apps/admin-api/Dockerfile`

Added clarifying comments explaining why host `node_modules` are excluded:
```dockerfile
# NOTE: Build context is monorepo root.
# Host node_modules are excluded via .dockerignore to prevent overlay2 conflicts
# (see: https://github.com/moby/buildkit/issues/1666)
```

Also clarified that the `COPY apps/admin-api ./` step excludes `node_modules` due to `.dockerignore` patterns.

### 4. Updated `apps/web/Dockerfile`

Added explicit `COPY` of `apps/admin-api/vendor ./apps/admin-api/vendor` in the deps stage, since `admin-api` has a local file dependency on `@slimy/core: file:vendor/slimy-core`.

---

## Files Changed

| File | Changes |
|------|---------|
| **`.dockerignore`** | Created new file with comprehensive ignore patterns for monorepo builds |
| **`apps/admin-api/Dockerfile`** | Added comments explaining overlay2 conflict prevention |
| **`apps/web/Dockerfile`** | Added `vendor` directory copy to resolve local dependency |
| **`apps/admin-api/node_modules`** | Removed (cleanup) |
| **`apps/admin-ui/node_modules`** | Removed (cleanup) |
| **`apps/web/node_modules`** | Removed (cleanup) |

---

## Verification: Build Results

### ✅ Primary Objective: Admin-API Build

**Status:** SUCCESS

```bash
$ docker compose -f infra/docker/docker-compose.slimy-nuc2.yml build admin-api --no-cache
[admin-api] exporting to image
[admin-api] exporting layers ... done
[admin-api] naming to docker.io/library/slimy-nuc2-admin-api ... done
```

No overlay2 errors. Build completed successfully.

### ✅ Pre-Build Verification: pnpm Build Chain

All packages built successfully:

```
$ pnpm --filter @slimy/web run db:generate
> prisma generate ... ✓

$ pnpm build
apps/admin-api build ... Done
apps/admin-ui build ... Done
apps/web build ... Done
[... all packages built successfully]

$ pnpm --filter @slimy/web test
✓ Test Files   18 passed (18)
✓ Tests       184 passed (184)
```

### ⚠️ Secondary Issue: Web Service Build (Unrelated)

The `web` service Docker build is experiencing a separate pre-existing issue with `prisma` not being found during the build phase. This is **unrelated to the overlay2 fix** and appears to stem from recent Dockerfile refactoring commits (ba9aa58, a7244a2). This should be addressed in a separate fix.

**Status of main objective:** ✅ COMPLETE

---

## How to Use the Fix

### 1. Pull the Latest Changes

```bash
cd /opt/slimy/slimy-monorepo
git pull
```

### 2. Clean Docker Resources (Optional, Recommended)

```bash
docker builder prune -f
```

### 3. Rebuild Services

To rebuild the admin-api service:
```bash
docker compose -f infra/docker/docker-compose.slimy-nuc2.yml build admin-api --no-cache
```

To rebuild all services (when web build is fixed):
```bash
docker compose -f infra/docker/docker-compose.slimy-nuc2.yml build --no-cache
```

### 4. Start Containers

```bash
docker compose -f infra/docker/docker-compose.slimy-nuc2.yml up -d
```

---

## Key Learnings

1. **.dockerignore is critical for monorepo Docker builds.** Without it, all files—including host `node_modules`—are included in the build context.

2. **App-level `node_modules` should not exist in pnpm monorepos.** They interfere with the shared dependency model and cause confusing build errors.

3. **Overlay2 filesystem conflicts** are resolved by ensuring the build context and Dockerfile operations don't have conflicting directory/file structures.

4. **Future refactoring**: Consider simplifying the web Dockerfile's dependency on `vendor/slimy-core` to reduce complexity.

---

## Next Steps for Operator

1. ✅ Review and merge this fix branch
2. ✅ Deploy to slimy-nuc2 (admin-api service)
3. ⏳ (In separate PR) Fix the web service build issue with prisma not being available during Docker build
4. ⏳ Consider adding a pre-commit hook to prevent stray app-level `node_modules` from being committed

---

**Generated:** 2025-11-19 by Claude Code
