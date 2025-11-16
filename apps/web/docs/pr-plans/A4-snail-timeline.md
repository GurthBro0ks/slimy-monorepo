# PR_PLAN: Snail Timeline

## Scope

Implement a visual timeline component on the Snail dashboard, backed by a file-based history API.

## Changes

### New Features
- **Timeline Component:** A visual component to display a chronological list of events.
- **History API:** A route at `/api/snail/history` to fetch file-backed event data.
- **Snail Dashboard Integration:** Display the timeline on the `/snail` page.

### Files to Create
- `components/snail-timeline.tsx` - NEW: Timeline UI component
- `app/api/snail/history/route.ts` - NEW: History API endpoint
- `data/snail-events.json` - NEW: Sample event data
- `lib/snail-events.ts` - NEW: Logic for reading/parsing event data

### Files to Modify
- `app/snail/page.tsx` - Integrate `SnailTimeline` component.

## Risks

- **Low:** File-based storage is simple but not scalable (acceptable for initial version).
- **Low:** UI is self-contained.

## Rollback

1. Revert `app/snail/page.tsx`.
2. Remove new files: `components/snail-timeline.tsx`, `app/api/snail/history/route.ts`, `data/snail-events.json`, `lib/snail-events.ts`.

## Testing

- Integration: `/api/snail/history` returns correctly formatted, sorted event data.
- E2E: Timeline component renders events chronologically.

## Deployment

1. Deploy code changes.
2. Verify timeline loads on `/snail`.

## Acceptance Criteria

- ✅ Timeline component is visible on the Snail dashboard.
- ✅ Events are fetched from the API and displayed chronologically.
- ✅ API returns a maximum of 50 events.
