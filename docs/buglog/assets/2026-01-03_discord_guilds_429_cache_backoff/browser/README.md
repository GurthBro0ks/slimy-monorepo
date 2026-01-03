# Browser evidence checklist (Practical Recos v4)

This folder is reserved for browser truth evidence for:
`docs/buglog/BUG_2026-01-03_discord_guilds_429_cache_backoff.md`.

Expected files (do not fabricate; capture from DevTools + DebugDock):
- `unauth_network.png`
- `unauth_console.png`
- `unauth_copydebug.txt`
- `auth_guilds_network.png` (must show the `429` request row for the exact URL)
- `auth_guilds_console.png`
- `auth_guilds_copydebug.txt`

Notes:
- Use Incognito with DevTools “Preserve log” + “Disable cache” enabled.
- The proof screenshot must show the endpoint and `429` status (and ideally the response body).

