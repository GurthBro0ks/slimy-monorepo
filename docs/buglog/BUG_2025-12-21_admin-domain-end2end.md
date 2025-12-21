# BUG_2025-12-21: Admin Domain End-to-End Verification

## Session Info
- **Date**: 2025-12-21T12:18:48+00:00
- **Host**: slimy@slimy-nuc2
- **Branch**: nuc2/verify-role-b33e616

## Baseline Snapshot

```bash
$ whoami; hostname; date -Is
slimy
slimy-nuc2
2025-12-21T12:18:48+00:00

$ git status -sb
## nuc2/verify-role-b33e616...origin/nuc2/verify-role-b33e616 [ahead 1]

$ docker compose ps
NAME                         STATUS         PORTS
slimy-monorepo-admin-api-1   Up (healthy)   0.0.0.0:3080->3080/tcp
slimy-monorepo-admin-ui-1    Up             0.0.0.0:3001->3000/tcp
slimy-monorepo-db-1          Up (healthy)   3306/tcp, 33060/tcp
slimy-monorepo-web-1         Up             0.0.0.0:3000->3000/tcp

$ sudo systemctl is-active caddy
active

$ ps -o pid,ppid,user,cmd -C caddy
PID   PPID USER  CMD
599090 1    caddy /usr/bin/caddy run --environ --config /etc/caddy/Caddyfile

$ sudo ss -ltnp | grep -E ':(80|443)\b'
LISTEN 0 4096 *:80  *:* users:(("caddy",pid=599090,fd=23))
LISTEN 0 4096 *:443 *:* users:(("caddy",pid=599090,fd=4))
```

## Outside-In Verification (Initial)

```bash
$ curl -sS -I https://admin.slimyai.xyz/ | head -20
HTTP/2 200
x-slimy-upstream: admin-ui
x-powered-by: Next.js
# PASS: admin-ui serving root

$ curl -sS -I https://admin.slimyai.xyz/api/health | head -10
HTTP/2 200
content-type: application/json; charset=utf-8
# PASS: admin-api health endpoint

$ curl -sS -D- -o /dev/null https://admin.slimyai.xyz/api/auth/discord/authorize-url 2>&1 | grep -i location
location: https://discord.com/oauth2/authorize?...&redirect_uri=https%3A%2F%2Fadmin.slimyai.xyz%2Fapi%2Fauth%2Fdiscord%2Fcallback&...
# PASS: OAuth redirect_uri uses correct domain
```

## Issues Found

### Issue 1: slime.chat ACME Errors
- **Finding**: `dig +short slime.chat A` returns empty (no DNS)
- **Impact**: Caddy attempts ACME for non-existent domain
- **Decision**: Comment out slime.chat block in Caddyfile

### Issue 2: Logout/returnTo Race Condition
- **Finding**: Layout.js logout does `router.push("/")` but race with session redirect can cause `/login?returnTo=%2Fguilds`
- **Decision**: Clear localStorage, use `router.replace("/")`, verify suppressRedirect

### Issue 3: Settings Page Needs Tabs
- **Finding**: Only guild settings exist at `/club/[guildId]/settings.js`
- **Decision**: Add Personal/Guild tabs with role-based visibility

---

## Fix Log

### Fix 1: slime.chat Caddyfile
**Action**: Comment out lines 101-104 in `/etc/caddy/Caddyfile` and `infra/docker/Caddyfile.slimy-nuc2`

```diff
-slime.chat, www.slime.chat {
-  import slime_common
-  reverse_proxy 127.0.0.1:3000
-}
+# slime.chat disabled - no DNS configured
+# slime.chat, www.slime.chat {
+#   import slime_common
+#   reverse_proxy 127.0.0.1:3000
+# }
```

**Verification**: `sudo systemctl reload caddy && sudo journalctl -u caddy -n 20`

---

### Fix 2: Logout/returnTo Race Condition
**Action**: Modified Layout.js logout handlers (lines 288-299 and 335-346)

```diff
onClick={async () => {
  try {
+   // Clear stored guild state to prevent stale returnTo
+   localStorage.removeItem("activeGuild");
    await api("/api/admin-api/api/auth/logout", { method: "POST" });
    await refresh({ suppressRedirect: true });
-   router.push("/");
+   // Use replace to prevent back-button returning to protected page
+   router.replace("/");
  } catch (err) {
    console.error(err);
  }
}}
```

**Files Modified**:
- `apps/admin-ui/components/Layout.js`

---

### Fix 3: Settings Page with Personal/Guild Tabs
**Action**: Refactored settings page to have tabbed interface with role-based visibility

**Changes**:
1. Created `apps/admin-ui/pages/settings.js` - standalone personal settings (redirects to guild settings if active)
2. Refactored `apps/admin-ui/pages/club/[guildId]/settings.js`:
   - Added tab state (useState for activeTab)
   - Personal tab: Account info, theme prefs (localStorage), session guilds list
   - Guild tab: Conditional visibility based on `canAccessGuildSettings`
   - Uses existing session data: `user.activeGuildId`, `user.activeGuildAppRole`

**Role Gating Logic**:
```javascript
const canAccessGuildSettings =
  isAdmin ||
  (activeGuildId === guildId &&
    (activeGuildAppRole === "admin" || activeGuildAppRole === "club"));
```

**Files Created/Modified**:
- `apps/admin-ui/pages/settings.js` (NEW)
- `apps/admin-ui/pages/club/[guildId]/settings.js` (MODIFIED)

---

## Verification

### Build Results
```bash
$ pnpm --filter @slimy/admin-ui build
> next build
✓ Compiled successfully
✓ Generating static pages (22/22)

Key routes built:
- /club/[guildId]/settings     2.38 kB
- /settings                    854 B
```

### Test Results
```bash
$ pnpm --filter @slimy/admin-api test
Test Suites: 12 skipped, 16 passed, 16 of 28 total
Tests:       12 skipped, 59 passed, 71 total
Time:        3.755 s
```

### Final URL Verification
```bash
$ curl -sS -I https://admin.slimyai.xyz/
HTTP/2 200
x-slimy-upstream: admin-ui
# PASS

$ curl -sS -I https://admin.slimyai.xyz/api/health
HTTP/2 200
# PASS

$ curl -sS -D- -o /dev/null https://admin.slimyai.xyz/api/auth/discord/authorize-url | grep location
location: https://discord.com/oauth2/authorize?...&redirect_uri=https%3A%2F%2Fadmin.slimyai.xyz%2Fapi%2Fauth%2Fdiscord%2Fcallback
# PASS - correct redirect_uri
```

---

## Summary

| Goal | Status |
|------|--------|
| admin.slimyai.xyz/ serves admin-ui (200) | PASS |
| admin.slimyai.xyz/api/health serves admin-api (200) | PASS |
| OAuth redirect_uri correct | PASS |
| Discord login end-to-end | NEEDS BROWSER TEST |
| Settings Personal/Guild tabs | IMPLEMENTED |
| Role-based gating | IMPLEMENTED |
| Logout returnTo fix | IMPLEMENTED |
| slime.chat ACME errors | FIXED (commented out) |

## Next Steps (Human)
1. Test Discord OAuth in browser: `https://admin.slimyai.xyz/`
2. Verify logout goes to `/` cleanly
3. Verify settings tabs show Personal (always) and Guild (role-gated)
