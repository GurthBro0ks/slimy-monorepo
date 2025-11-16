# PR_PLAN: Codes Hub v2 Enhancements

## Scope

Enhance the existing codes aggregator with search, reporting, and performance optimizations.

## Changes

### New Features
- **Search box** for client-side code filtering
- **Report dead code** button with server logging
- **Performance optimization** with improved caching
- **Offline support** for copy buttons

### Files to Create
- `app/api/codes/report/route.ts` - Report endpoint
- `lib/codes-aggregator.ts` - Extracted aggregator logic
- `tests/unit/codes-aggregator.test.ts` - Unit tests

### Files to Modify
- `app/snail/codes/page.tsx` - Add search UI and report button
- `app/api/codes/route.ts` - Use extracted aggregator, optimize caching
- `components/ui/copy-box.tsx` - Ensure offline support

## Performance Targets

- **Load time:** <200ms after first warm load
- **Search:** <50ms client-side filtering
- **Copy:** Works offline with clipboard API + fallback

## Risks

- **Low:** Search is client-side only (no backend changes)
- **Low:** Report endpoint is write-only (no DB schema)
- **Medium:** Clipboard API may fail in some browsers (mitigated with fallback)

## Rollback

1. Revert `app/snail/codes/page.tsx` to remove search UI
2. Remove `app/api/codes/report/route.ts`
3. Restore original `app/api/codes/route.ts`

No data loss risk - reports are logged to files only.

## Testing

- Unit: Aggregator deduplication and filtering
- Integration: Report endpoint logs correctly
- E2E: Search filters codes, copy works offline

## Deployment

1. Deploy code changes
2. Verify `/snail/codes` loads
3. Test search and copy functionality
4. Monitor report logs in `data/reports/`

## Acceptance Criteria

- ✅ Codes load in <200ms (warm)
- ✅ Search filters codes instantly
- ✅ Copy buttons work offline
- ✅ Report logs with guildId, codeId, userId, timestamp
