# PR_PLAN: Usage Soft Caps

## Scope

Implement color badges for spend thresholds and inline failure states for model probes.

## Changes

### New Features
- **Usage Badge:** A component to display current usage level (e.g., Free, Pro, Over Cap).
- **Usage API:** A mock endpoint to fetch current user usage data.
- **Header Integration:** Display the usage badge in the site header.

### Files to Create
- `components/usage-badge.tsx` - NEW: Usage badge component
- `lib/usage-thresholds.ts` - NEW: Threshold configuration and logic
- `app/api/usage/route.ts` - NEW: Mock usage endpoint
- `tests/unit/usage-thresholds.test.ts` - NEW: Unit tests

### Files to Modify
- `components/layout/header.tsx` - Integrate `UsageBadge`

## Risks

- **Low:** Mock API endpoint is used; no external service dependency yet.
- **Low:** UI integration is minimal.

## Rollback

1. Revert `components/layout/header.tsx`.
2. Remove new files: `components/usage-badge.tsx`, `lib/usage-thresholds.ts`, `app/api/usage/route.ts`.

## Testing

- Unit: Threshold logic (Free, Pro, Over Cap)
- E2E: Badge is visible on the header.

## Deployment

1. Deploy code changes.
2. Verify usage badge is visible and reflects mock data.
3. Replace mock `app/api/usage/route.ts` with real implementation when available.

## Acceptance Criteria

- ✅ Usage badge is visible in the header.
- ✅ Badge color changes based on usage level.
- ✅ Mock API returns usage data correctly.
