# PR_PLAN: Public Stats Cards

## Scope

Implement a public, read-only stats route with an OG image generator, controlled by a guild-scoped feature flag.

## Changes

### New Features
- **Public Stats Page:** A route at `/public-stats/[guildId]` that displays read-only stats.
- **OG Image Generator:** A route at `/api/og/stats` to generate an image for social sharing.
- **Guild Settings API:** A route at `/api/guilds/:id/settings` to manage the `publicStats` flag.
- **PII Scrubbing:** Logic to ensure no personally identifiable information is exposed on the public route.

### Files to Create
- `app/public-stats/[guildId]/page.tsx` - NEW: Public stats page
- `app/api/og/stats/route.tsx` - NEW: OG image generator
- `app/api/guilds/[id]/settings/route.ts` - NEW: Settings endpoint
- `lib/stats-scrubber.ts` - NEW: PII scrubbing logic
- `tests/unit/stats-scrubber.test.ts` - NEW: Unit tests

### Files to Modify
- `lib/feature-flags.ts` - `publicStats` flag already added.

## Risks

- **Medium:** PII exposure if scrubbing logic fails (mitigated by unit tests).
- **Medium:** OG image generation performance (mitigated by using Next.js Image Response).
- **Low:** Authentication bypass (mitigated by server-side role check on settings endpoint).

## Rollback

1. Remove new files: `app/public-stats/[guildId]/page.tsx`, `app/api/og/stats/route.tsx`, `app/api/guilds/[id]/settings/route.ts`, `lib/stats-scrubber.ts`.

## Testing

- Unit: PII scrubbing logic.
- Integration: `/api/og/stats` returns a valid image buffer.
- E2E: Public stats page returns 200 when flag is enabled, 404/403 when disabled.

## Deployment

1. Deploy code changes.
2. Verify the `publicStats` flag is off by default.
3. Test OG image generation with a curl command.

## Acceptance Criteria

- ✅ Public stats page is accessible when `publicStats` flag is true.
- ✅ Page returns 404/403 when `publicStats` flag is false.
- ✅ OG image is generated successfully.
- ✅ No PII is visible on the public page.
