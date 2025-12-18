# BUG 2025-12-18 — snail-page-shows-all-guilds

## Summary

- Current status: OAuth works; `/guilds` shows the correct filtered list (2 guilds).
- Bug: `/snail` shows **all** guilds the user is in (unfiltered). This violates the “guild gate” product rule and also conflicts with `/snail` being reserved for “Personal Snail”.

## Product Rules (hard)

1. After login, always land on `/guilds`.
2. Users must select a guild before entering any guild-scoped area (chat/club/snail tools/etc).
3. `/snail` is reserved for the user’s personal snail (no guild list, no guild picker UI).
4. Guild-scoped Snail Tools remain at `/snail/[guildId]` (do not break deep links).

## Baseline Evidence (no code changes)

### A1) Which files power `/guilds` and `/snail`

Command:
- `ls -la apps/admin-ui/pages`

Key entries:
- `apps/admin-ui/pages/guilds/index.js`
- `apps/admin-ui/pages/snail/index.js`
- `apps/admin-ui/pages/snail/[guildId]/index.js`
- `apps/admin-ui/pages/chat/index.js`
- `apps/admin-ui/pages/club/index.js`

Command:
- `ls -la apps/admin-ui/pages/guilds* apps/admin-ui/pages/snail*`

Key entries:
- `apps/admin-ui/pages/guilds/index.js`
- `apps/admin-ui/pages/snail/index.js`

### A2) “Selected guild” storage mechanism (what exists today)

Command:
- `rg -n "lastActiveGuild|selectedGuild|activeGuild|guildId" apps/admin-ui/pages/guilds* apps/admin-ui -S`

Findings:
- `/guilds` navigates by pushing links (`/guilds/:id`, `/snail/:id`, `/club?guildId=:id`) but does **not** persist a “selected guild” in cookie/localStorage.
- `/chat` holds a `guildId` in React state and defaults it to `user.guilds[0].id` (acts like a guild picker).
- `/club` holds a `selected` guild in React state and uses a `<select>` dropdown (acts like a guild picker).

Command:
- `rg -n "Set-Cookie|document\\.cookie|localStorage" apps/admin-ui/pages/guilds* apps/admin-ui -S`

Findings:
- No existing `Set-Cookie` / `document.cookie` usage for a selected guild.
- `localStorage` exists for debug toggles and chat bar history, but not for guild selection.

### A3) Where `/snail` gets the (unfiltered) guild list from

Command:
- `rg -n "/api/.*/guilds|discord/guilds|sessionGuilds|guilds\\b" apps/admin-ui/pages/snail* apps/admin-ui -S`

Findings:
- `apps/admin-ui/pages/snail/index.js` uses `const guilds = useMemo(() => user?.guilds || [], [user]);` and renders a guild grid.
- This relies on `useSession()` user payload (`GET /api/admin-api/api/auth/me`), specifically the `user.guilds` field, which is observed to contain more guilds than the filtered `/guilds` page.

### A4) Live HTTP probes (safe)

Commands (without cookie):
- `curl -sS http://localhost:3001/api/admin-api/api/auth/me | head -c 4000; echo`
  - Output: `{"error":"unauthorized"}`
- `curl -sS http://localhost:3001/api/admin-api/api/discord/guilds | head -c 4000; echo`
  - Output: `{"ok":false,"code":"UNAUTHORIZED","message":"Authentication required"}`

## STOP CHECKPOINT #1 (root cause statement)

- `/snail` is unfiltered because it renders `user.guilds` from the session payload.
- `/guilds` is filtered because it fetches `GET /api/guilds` (admin-api), which returns the gated list.

## File-Mod Plan (before edits)

1. Convert `/snail` into “Personal Snail” (no guild listing, no redirects to `/snail/:id`).
2. Introduce a single “selected guild” mechanism (persisted client-side) and use it across guild-scoped pages.
3. Remove guild-picking UI from `/chat` and `/club`; redirect to `/guilds` if no selected guild.
4. Keep `/snail/[guildId]` working; entering a guild-scoped page should set selected guild (deep-link friendly).
5. Add a small debug box on relevant pages showing: path, selected guild id, and source (query vs path vs localStorage).

## Implementation (minimal + defensive)

### Selected guild mechanism

- Persisted key: `localStorage["slimy_admin_active_guild_id"]`
- Sources (shown in debug):
  - `path` (e.g. `/snail/:guildId`, `/guilds/:guildId`)
  - `query` (e.g. `/club?guildId=:guildId`)
  - `localStorage` (stored from `/guilds` selection or prior visit)

### Guild gate

- `/guilds` remains the only guild selection UI.
- Guild-scoped pages that do not contain a guild id in the URL are gated client-side:
  - `/chat` redirects to `/guilds` if no selected guild id (or if selected id is not in the gated `/api/guilds` list).
  - `/club` redirects to `/guilds` if no selected guild id (or if selected id is not in the gated `/api/guilds` list).

### Personal Snail

- `/snail` is now “Personal Snail” (no guild listing / no auto-redirect).
- Guild-scoped Snail Tools remain at `/snail/[guildId]`.

### Debug/status box (no secrets)

- Added a small fixed debug box (bottom-right) via `Layout` for non-root pages showing:
  - `path`
  - `selectedGuildId`
  - `selectedGuildSource`

## Verification (NUC2)

### Rebuild

- `docker compose up -d --build admin-ui admin-api`

### /snail is Personal Snail (no guild picker strings)

Command:
- `curl -sS http://localhost:3001/snail | head -c 4000 | rg -n "Personal Snail|Choose a guild|We didn’t detect" || true`

Observed:
- Contains `Personal Snail`
- Does not contain `Choose a guild`

### /snail HTML has no direct `/snail/<guildId>` links

Command:
- `curl -sS http://localhost:3001/snail | head -c 4000 | rg -n "href=\\\"/snail/|/api/admin-api/api/discord/guilds|oauth2/authorize\" || true`

Observed:
- No matches

### Post-login always lands on /guilds (authorize-url ignores returnTo)

Command:
- `curl -sS -D- -o /dev/null "http://localhost:3001/api/auth/discord/authorize-url?returnTo=%2Fdashboard" | sed -n '1,12p'`

Observed:
- `Set-Cookie: oauth_return_to=%2Fguilds; ...` (always)

## Manual Verification (WORK PC, no secrets)

- Incognito: login to `http://localhost:3001` → should land on `/guilds`
- Visit `http://localhost:3001/snail` → should show “Personal Snail” (no guild grid/list)
- With no selection in localStorage, visit `http://localhost:3001/chat` → should redirect to `/guilds`
- Select a guild on `/guilds` (click Open) → then visit `/chat` → should load chat for that selected guild (no guild dropdown)
- Visit `http://localhost:3001/snail/<guildId>` (deep link) → should work for allowed guilds; should show Access denied for disallowed guilds

## Files Changed

- `apps/admin-ui/pages/snail/index.js`
- `apps/admin-ui/pages/snail/[guildId]/index.js`
- `apps/admin-ui/pages/guilds/index.js`
- `apps/admin-ui/pages/chat/index.js`
- `apps/admin-ui/pages/club/index.js`
- `apps/admin-ui/components/Layout.js`
- `apps/admin-ui/lib/active-guild.js` (new)
- `apps/admin-ui/lib/gated-guilds.js` (new)
