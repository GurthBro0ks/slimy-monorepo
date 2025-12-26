# BUGLOG — bot-image-missing-discordjs (2025-12-26)

## Symptom / Context
- Container: `bot` (`slimy-monorepo-bot-1`) restarts continuously.
- Error in logs:
  - `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'discord.js' imported from /app/dist/index.js`
- Repo: `/opt/slimy/slimy-monorepo`
- Branch at start: `nuc2/verify-role-b33e616`
- Head at start: `bd455ed7af670b9500a30f077530e0f437d00c72` (matches reported “web settings UI v0.31” commit)

## Plan
1) Confirm failure in Docker.
2) Inspect bot deps + Dockerfile and explain why runtime misses `discord.js`.
3) Apply smallest correct fix to ensure runtime deps present in image.
4) Add local regression script to assert `discord.js` import works inside container.
5) Rebuild + verify bot stays running.
6) Commit + update continuity.

## Commands run (with outputs)

### Confirm failure
```bash
docker compose ps
```
Output (snippet):
```text
slimy-monorepo-bot-1         slimy-monorepo-bot         "docker-entrypoint.s…"   bot         2 hours ago   Restarting (1) 36 seconds ago
```

```bash
docker compose logs --tail 200 bot
```
Output (snippet):
```text
bot-1  | Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'discord.js' imported from /app/dist/index.js
bot-1  |   code: 'ERR_MODULE_NOT_FOUND'
```

### Verify runtime image lacks bot deps
```bash
docker compose run --rm --entrypoint node bot -e "try{console.log('contracts',require.resolve('@slimy/contracts'));}catch(e){console.error('contracts missing',e.code)}; try{console.log('discord',require.resolve('discord.js'));}catch(e){console.error('discord missing',e.code)}"
```
Output:
```text
contracts missing MODULE_NOT_FOUND
discord missing MODULE_NOT_FOUND
```

```bash
docker compose run --rm --entrypoint bash bot -lc "ls -la /app/node_modules | head -30"
```
Output (snippet):
```text
drwxr-xr-x    2 botuser botuser  4096 Dec 26 17:50 @eslint
lrwxrwxrwx    1 botuser botuser    50 Dec 26 17:50 eslint -> .pnpm/eslint@...
lrwxrwxrwx    1 botuser botuser    33 Dec 26 17:50 tsx -> .pnpm/tsx@...
lrwxrwxrwx    1 botuser botuser    46 Dec 26 17:50 typescript -> .pnpm/typescript@...
```

## Notes / Diagnosis (in progress)
- `apps/bot/package.json` declares `discord.js` in `dependencies` (not `devDependencies`), so the runtime image was missing *installed* deps, not missing the declaration.
- Root cause: `apps/bot/Dockerfile` copied only workspace root `/app/node_modules` into the runtime image and ran the bot from `/app/dist`, but pnpm workspace dependencies were installed under `/app/apps/bot/node_modules` and relied on `/app/packages/*` being present for `workspace:*` packages.
  - Result: runtime couldn’t resolve `discord.js` (or `@slimy/contracts`, `@slimy/admin-api-client`).

## Fix
- `apps/bot/Dockerfile`: install filtered workspace deps for `@slimy/bot...`, copy bot + workspace node_modules, build required workspace packages, run bot from `/app/apps/bot`.
- `docker-compose.yml`: ensure bot has an internal admin-api URL, and wire `ADMIN_API_INTERNAL_BOT_TOKEN` through (value provided via local `.env` / runtime env, not committed).
- Added local regression script: `scripts/verify/bot-runtime-deps.sh`.

## Verification
```bash
NO_CACHE=1 bash scripts/verify/bot-runtime-deps.sh
```
Output (tail):
```text
[info] verifying bot runtime deps import
PASS: bot runtime deps import ok
```

```bash
docker compose logs --tail 120 bot
```
Output (snippet, after fix):
```text
[bot] Fatal error: Error [TokenInvalid]: An invalid token was provided.
...
```
Note: this indicates `discord.js` is now present and executing; remaining restarts are due to runtime configuration (token/auth), not missing modules.

## Files changed
- `docs/buglog/BUG_2025-12-26_bot-image-missing-discordjs.md`
- `apps/bot/Dockerfile`
- `docker-compose.yml`
- `scripts/verify/bot-runtime-deps.sh`

## Verification evidence
- `ERR_MODULE_NOT_FOUND` resolved (verify script imports `discord.js` successfully inside container).
