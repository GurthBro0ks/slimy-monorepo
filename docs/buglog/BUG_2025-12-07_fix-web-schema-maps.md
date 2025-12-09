# Bug Fix: Prisma Client Stale Mappings

**Date:** 2025-12-07
**Bug Name:** `fix-web-prisma-maps`
**Status:** Deployed - Ready for Verification

## Problem
Web app crashes with `PrismaClientKnownRequestError`:
```
The column slimyai_prod.club_sheets.guildId does not exist
```

## Root Cause
The Prisma schema file (`apps/web/prisma/schema.prisma`) has correct `@map()` decorators, but the Prisma Client in the web container is stale and was generated before these mappings were added. The client is querying for camelCase columns (`guildId`) but the database uses snake_case (`guild_id`).

## Solution
Rebuild the web container with `--no-cache` to force regeneration of the Prisma Client with the correct column mappings.

## Schema Status (Verified)
✓ `ClubSheet.guildId` has `@map("guild_id")`
✓ `ClubSheet.createdAt` has `@map("created_at")`
✓ `ClubSheet.updatedAt` has `@map("updated_at")`
✓ `ClubAnalysis` has all proper `@map` decorators

## Actions Taken
1. ✅ Verified schema has correct `@map` decorators (apps/web/prisma/schema.prisma:72-79)
2. ✅ Rebuilt web container with `--no-cache` to regenerate Prisma Client
3. ✅ Deployed updated container (slimy-web recreated and started)
4. ✅ Container running successfully (Next.js 16.0.1 ready in 126ms)

## Deployment Info
- **Build Time**: ~55 seconds
- **Prisma Client**: v6.19.0 (regenerated with correct mappings)
- **Container Status**: Running
- **Next.js**: 16.0.1 ready on port 3000

## Verification Steps
- User clicks "Save" at `/club`
- Logs should show `[Auth] SUCCESS` followed by successful database queries
- No `PrismaClientKnownRequestError` should occur
