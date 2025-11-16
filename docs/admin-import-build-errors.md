# Admin import build failures

This log captures issues encountered while wiring `@slimy/admin-api` and `@slimy/admin-ui` into the monorepo.

## 2025-02-14 — `@slimy/admin-ui`

- **Command**: `corepack pnpm --filter @slimy/admin-ui run build`
- **Error (excerpt)**:

```
./components/SlimeChatBar.jsx
Module not found: Can't resolve 'socket.io-client'

./lib/socket.js
Module not found: Can't resolve 'socket.io-client'
```

- **Resolution**: Added the missing `socket.io-client@^4.8.1` dependency to `apps/admin-ui/package.json` (copied from the source repo’s `package-lock.json`) and re-ran `corepack pnpm install`. The build now completes successfully.
