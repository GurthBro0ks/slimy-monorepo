# Browser evidence checklist (Discord guilds 429 hardening — Evidence v2)

This folder is reserved for real browser truth evidence for:
`docs/buglog/BUG_2026-01-03_discord_guilds_429_hardening_observability.md`.

Required (do not fabricate; capture from DevTools + DebugDock):
- `auth_baseline_network.png` (must show `/api/guilds` + `/api/discord/guilds` rows and response headers)
- `auth_baseline_console.png`
- `auth_baseline_copydebug.txt` (or `auth_baseline_copydebug.png` if captured as a screenshot)

Notes:
- Use Incognito with DevTools “Preserve log” + “Disable cache” enabled.
- For the network proof, open the request headers pane so `X-Slimy-Discord-Source` and `X-Slimy-Discord-Stale` are visible.
