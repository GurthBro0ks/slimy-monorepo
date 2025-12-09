# BUG: Database Schema Mismatch - Missing Column Mappings

**Date:** 2025-12-07  
**Status:** ✅ RESOLVED  
**Bug Name:** `final-db-schema-sync`

## Problem
The application crashed with `PrismaClientKnownRequestError` because Prisma was querying for camelCase column names (`guildId`, `userId`, `createdAt`) when the database uses snake_case (`guild_id`, `user_id`, `created_at`).

## Root Cause
The `apps/web/prisma/schema.prisma` had models without `@map()` decorators to translate between Prisma's camelCase fields and the database's snake_case columns.

## Symptoms
- Error: `The column slimyai_prod.club_analyses.guildId does not exist in the current database`
- Error: `The column slimyai_prod.club_sheets.guildId does not exist in the current database`
- Application crashed when accessing /club page

## Solution Applied
1. ✅ Added `@map("guild_id")`, `@map("user_id")`, `@map("created_at")`, `@map("updated_at")` to ClubAnalysis model
2. ✅ Added `@map("analysis_id")`, `@map("image_url")`, `@map("original_name")`, `@map("file_size")`, `@map("uploaded_at")` to ClubAnalysisImage model
3. ✅ Added `@map("analysis_id")`, `@map("created_at")` to ClubMetric model
4. ✅ ClubSheet model already had correct mappings
5. ✅ Performed clean rebuild (`--no-cache`) to regenerate Prisma client
6. ✅ Restarted web container

## Database Verification
Verified database tables have correct snake_case columns:
- `club_analyses`: guild_id, user_id, created_at, updated_at ✓
- `club_sheets`: guild_id, created_at, updated_at ✓

## Verification Results
- ✅ Container started without errors
- ✅ Page loads successfully at https://slimyai.xyz/club
- ✅ No Prisma errors in logs

## Files Modified
- `/opt/slimy/slimy-monorepo/apps/web/prisma/schema.prisma`
  - ClubAnalysis model (lines 15-33)
  - ClubAnalysisImage model (lines 35-49)
  - ClubMetric model (lines 51-67)

## Next Steps for User
Test the "Save" button at https://slimyai.xyz/club to confirm full functionality.
