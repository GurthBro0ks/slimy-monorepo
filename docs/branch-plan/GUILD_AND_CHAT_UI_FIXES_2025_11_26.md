# Guild and Chat UI Fixes

## Summary
Fixed duplicate chat UIs on the marketing homepage, fixed "Guild not found" error on the dashboard, and updated the Club page to use the real guild ID.

## Changes

### Chat UI
- **`apps/web/components/layout/app-shell.tsx`**: Replaced `LazySlimeChatBar` with `AuthenticatedChatBar`.
- **`apps/web/components/layout/authenticated-chat-bar.tsx`**: Created a new component that renders `LazySlimeChatBar` only if the user is authenticated.
- **`apps/web/app/(marketing)/components/ChatWidget.tsx`**: Updated to return `null` if the user is authenticated, preventing it from showing alongside the real chat dock.

### Guild Dashboard
- **`apps/web/app/dashboard/[guildId]/page.tsx`**: Updated `GuildDashboardPage` to correctly await `params` (Next.js 15 requirement), resolving the "Guild not found" error caused by undefined `guildId`.

### Club Page
- **`apps/web/hooks/useAuth.ts`**: Updated `useAuth` hook to return `guilds` from the `/api/auth/me` response.
- **`apps/web/app/club/page.tsx`**: Updated to use the real guild ID from `useAuth` instead of a hardcoded placeholder. Added a "No connected guilds found" message.

## Verification
- **Marketing Homepage**:
    - Logged out: Shows `ChatWidget` (static preview) and `SlimeLoginModal` (on click). `LazySlimeChatBar` is hidden.
    - Logged in: Shows `LazySlimeChatBar` (real chat dock). `ChatWidget` is hidden.
- **Dashboard**:
    - Visiting `/dashboard/[guildId]` correctly loads the guild (assuming valid ID).
- **Club Page**:
    - Loads metrics for the first connected guild.
    - Shows a friendly message if no guilds are connected.

## Tests
- Ran `pnpm --filter @slimy/web test`: Passed.
- Ran `pnpm --filter admin-api test`: Passed.
