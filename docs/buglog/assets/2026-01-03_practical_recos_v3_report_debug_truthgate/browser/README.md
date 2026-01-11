# Browser evidence checklist (manual)

This folder is reserved for manual browser truth-gate evidence for:
`docs/buglog/BUG_2026-01-03_practical_recos_v3_report_debug_truthgate.md`.

Expected files (do not fabricate; capture from DevTools + DebugDock):
- `unauth_network.png`
- `unauth_console.png`
- `unauth_copydebug.txt`
- `auth_chat_network.png`
- `auth_chat_ws_or_polling.png`
- `auth_chat_console.png`
- `auth_chat_copydebug.txt`

Notes:
- Use Incognito with DevTools “Preserve log” + “Disable cache” enabled.
- For polling evidence, ensure the screenshot shows the `0{...}` open packet response body.
- For WS evidence, ensure the screenshot shows `101 Switching Protocols` for the socket entry.

