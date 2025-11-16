# PR_PLAN: Ask Manus Bar

## Scope

Implement a sticky, runtime-aware chat bar on app pages (`/club` and `/snail`).

## Changes

### New Features
- **Ask Manus Bar Component:** A sticky chat interface at the bottom of the screen.
- **Chat API Endpoint:** `/api/chat/bot` to handle chat requests and return structured actions.
- **Layout Integration:** Add the bar to the layouts of `/snail` and `/club`.
- **Rate Limiting:** Server-side rate limiting for the chat endpoint.

### Files to Create
- `components/ask-manus-bar.tsx` - NEW: Sticky chat bar UI
- `app/api/chat/bot/route.ts` - NEW: Chat endpoint
- `lib/chat-actions.ts` - NEW: Logic for handling actions (copy, post, link)
- `lib/rate-limiter.ts` - NEW: Simple server-side rate limiter
- `tests/unit/rate-limiter.test.ts` - NEW: Unit tests for rate limiter

### Files to Modify
- `app/snail/layout.tsx` - Wrap children with the bar
- `app/club/layout.tsx` - Wrap children with the bar
- `lib/feature-flags.ts` - Add `askManus` experiment flag

## Risks

- **Medium:** Chat endpoint needs careful rate limiting to prevent abuse.
- **Low:** UI is minimal and contained in a sticky footer.

## Rollback

1. Remove `AskManusBar` from layouts.
2. Remove new files: `components/ask-manus-bar.tsx`, `app/api/chat/bot/route.ts`, `lib/chat-actions.ts`, `lib/rate-limiter.ts`.

## Testing

- Unit: Rate limiter logic.
- Integration: `/api/chat/bot` returns a valid response with actions.
- E2E: Bar is visible on `/snail` and `/club`; chat and copy action work.

## Deployment

1. Deploy code changes.
2. Ensure the `askManus` feature flag is off by default.
3. Test chat endpoint rate limiting.

## Acceptance Criteria

- ✅ Bar is sticky and visible on `/snail` and `/club`.
- ✅ Chat endpoint returns `reply` and `actions[]`.
- ✅ `copy` action works (non-expiring).
- ✅ Rate limit is enforced server-side.
- ✅ Feature is toggleable via the `askManus` flag.
