# BUG_2025-12-18_guild-selection-perms-propagation

## Baseline

$ git status -sb
## nuc2/verify-role-b33e616...origin/nuc2/verify-role-b33e616
 M apps/admin-api/src/routes/auth.js
 M apps/admin-api/src/services/discord-shared-guilds.js
 M apps/admin-ui/pages/api/admin-api/[...path].js
 M apps/admin-ui/pages/chat/index.js
 M apps/admin-ui/pages/guilds/index.js
?? docs/buglog/BUG_2025-12-18_guild-selection-perms-propagation.md

$ docker compose ps
NAME                         IMAGE                      COMMAND                  SERVICE     CREATED          STATUS                    PORTS
slimy-monorepo-admin-api-1   slimy-monorepo-admin-api   "docker-entrypoint.s…"   admin-api   35 minutes ago   Up 35 minutes (healthy)   0.0.0.0:3080->3080/tcp, :::3080->3080/tcp
slimy-monorepo-admin-ui-1    slimy-monorepo-admin-ui    "docker-entrypoint.s…"   admin-ui    35 minutes ago   Up 35 minutes             0.0.0.0:3001->3000/tcp, :::3001->3000/tcp
slimy-monorepo-db-1          mysql:8.0                  "docker-entrypoint.s…"   db          35 minutes ago   Up 35 minutes (healthy)   3306/tcp, 33060/tcp
slimy-monorepo-web-1         slimy-monorepo-web         "docker-entrypoint.s…"   web         35 minutes ago   Up 35 minutes             0.0.0.0:3000->3000/tcp, :::3000->3000/tcp

$ rg -n "active_guild|activeGuild|lastActiveGuild|slimy_admin_active_guild" apps/admin-ui apps/admin-api || true
apps/admin-ui/components/debug/DebugDock.tsx:73:  const activeGuildId = useMemo(() => getActiveGuildId(pathname), [pathname]);
apps/admin-ui/components/debug/DebugDock.tsx:74:  const activeGuild = useMemo(() => {
apps/admin-ui/components/debug/DebugDock.tsx:75:    if (!activeGuildId || !guilds) return null;
apps/admin-ui/components/debug/DebugDock.tsx:76:    return guilds.find((g) => String(g.id) === String(activeGuildId)) || null;
apps/admin-ui/components/debug/DebugDock.tsx:77:  }, [activeGuildId, guilds]);
apps/admin-ui/components/debug/DebugDock.tsx:199:      activeGuild: activeGuildId
apps/admin-ui/components/debug/DebugDock.tsx:201:            id: activeGuildId,
apps/admin-ui/components/debug/DebugDock.tsx:202:            name: activeGuild?.name ?? null,
apps/admin-ui/components/debug/DebugDock.tsx:203:            roleLabel: activeGuild?.roleLabel ?? null,
apps/admin-ui/components/debug/DebugDock.tsx:204:            roleSource: activeGuild?.roleSource ?? null,
apps/admin-ui/components/debug/DebugDock.tsx:222:  }, [activeGuild?.name, activeGuild?.roleLabel, activeGuild?.roleSource, activeGuildId, diag, envEnabled, health, pathname, user]);
apps/admin-ui/components/debug/DebugDock.tsx:280:              activeGuild: {activeGuildId || "none"}{" "}
apps/admin-ui/components/debug/DebugDock.tsx:281:              {activeGuildId && activeGuild?.roleLabel
apps/admin-ui/components/debug/DebugDock.tsx:282:                ? `(${activeGuild.roleLabel}${activeGuild.roleSource ? `:${activeGuild.roleSource}` : ""})`
apps/admin-ui/components/Layout.js:26:  const activeGuild = useActiveGuild({ explicitGuildId: guildId, router });
apps/admin-ui/components/Layout.js:405:selectedGuildId: ${activeGuild.guildId || "(none)"}
apps/admin-ui/components/Layout.js:406:selectedGuildSource: ${activeGuild.source}`}
apps/admin-api/src/routes/auth.js:581:        include: { lastActiveGuild: true },
apps/admin-api/src/routes/auth.js:640:    // Resolve activeGuildId from: header → cookie → DB
apps/admin-api/src/routes/auth.js:641:    let activeGuildId = null;
apps/admin-api/src/routes/auth.js:642:    let activeGuildAppRole = null;
apps/admin-api/src/routes/auth.js:647:      activeGuildId = String(headerActiveGuild);
apps/admin-api/src/routes/auth.js:651:    if (!activeGuildId && req.cookies?.[ACTIVE_GUILD_COOKIE_NAME]) {
apps/admin-api/src/routes/auth.js:652:      activeGuildId = String(req.cookies[ACTIVE_GUILD_COOKIE_NAME]);
apps/admin-api/src/routes/auth.js:655:    // Priority 3: DB lastActiveGuildId
apps/admin-api/src/routes/auth.js:656:    if (!activeGuildId && dbUser?.lastActiveGuildId) {
apps/admin-api/src/routes/auth.js:657:      activeGuildId = String(dbUser.lastActiveGuildId);
apps/admin-api/src/routes/auth.js:660:    // Validate activeGuildId is in user's guilds and compute role
apps/admin-api/src/routes/auth.js:661:    if (activeGuildId) {
apps/admin-api/src/routes/auth.js:662:      const activeGuildEntry = sessionGuilds.find((g) => String(g.id) === activeGuildId);
apps/admin-api/src/routes/auth.js:663:      if (!activeGuildEntry) {
apps/admin-api/src/routes/auth.js:665:        activeGuildId = null;
apps/admin-api/src/routes/auth.js:668:        const isPrimary = activeGuildId === PRIMARY_GUILD_ID;
apps/admin-api/src/routes/auth.js:677:                activeGuildAppRole = computeRoleLabelFromRoles(memberRoles);
apps/admin-api/src/routes/auth.js:686:        if (!activeGuildAppRole) {
apps/admin-api/src/routes/auth.js:687:          const roles = activeGuildEntry.roles || [];
apps/admin-api/src/routes/auth.js:689:            activeGuildAppRole = "admin";
apps/admin-api/src/routes/auth.js:691:            activeGuildAppRole = "club";
apps/admin-api/src/routes/auth.js:693:            activeGuildAppRole = "member";
apps/admin-api/src/routes/auth.js:706:      activeGuildId,
apps/admin-api/src/routes/auth.js:707:      activeGuildAppRole,
apps/admin-api/src/routes/auth.js:708:      lastActiveGuild: dbUser?.lastActiveGuild
apps/admin-api/src/routes/auth.js:710:            id: dbUser.lastActiveGuild.id,
apps/admin-api/src/routes/auth.js:711:            name: dbUser.lastActiveGuild.name,
apps/admin-api/src/routes/auth.js:712:            icon: dbUser.lastActiveGuild.icon,
apps/admin-api/src/routes/auth.js:742: * - Updates lastActiveGuildId in DB
apps/admin-api/src/routes/auth.js:743: * - Returns activeGuildId + appRole
apps/admin-api/src/routes/auth.js:804:    // 4. Update lastActiveGuildId in DB
apps/admin-api/src/routes/auth.js:821:          data: { lastActiveGuildId: normalizedGuildId },
apps/admin-api/src/routes/auth.js:824:        console.warn("[auth/active-guild] Failed to update lastActiveGuildId:", err?.message || err);
apps/admin-api/src/routes/auth.js:838:    // 6. Return success with activeGuildId and appRole
apps/admin-api/src/routes/auth.js:841:      activeGuildId: normalizedGuildId,
apps/admin-ui/pages/chat/index.js:29:  const activeGuildHook = useActiveGuild({ router });
apps/admin-ui/pages/chat/index.js:32:  // Prefer server-side activeGuildId, fall back to client-side hook
apps/admin-ui/pages/chat/index.js:33:  const serverActiveGuildId = user?.activeGuildId;
apps/admin-ui/pages/chat/index.js:34:  const serverActiveGuildAppRole = user?.activeGuildAppRole;
apps/admin-ui/pages/chat/index.js:35:  const guildId = serverActiveGuildId || activeGuildHook.guildId;
apps/admin-ui/pages/chat/index.js:36:  const guildSource = serverActiveGuildId ? "server" : activeGuildHook.source;
apps/admin-ui/pages/chat/index.js:48:    // If server says we have an activeGuildId, trust it
apps/admin-ui/pages/chat/index.js:174:                  selected via <span style={{ fontFamily: "monospace" }}>{activeGuild.source}</span>
apps/admin-ui/pages/club/index.js:14:  const activeGuild = useActiveGuild({ router });
apps/admin-ui/pages/club/index.js:16:  const selected = activeGuild.guildId || null;
apps/admin-ui/pages/club/index.js:109:          selected via <span style={{ fontFamily: "monospace" }}>{activeGuild.source}</span>
apps/admin-ui/pages/api/admin-api/[...path].js:97:  const activeGuildCookie = (cookie || "")
apps/admin-ui/pages/api/admin-api/[...path].js:101:  const activeGuildId = activeGuildCookie
apps/admin-ui/pages/api/admin-api/[...path].js:102:    ? decodeURIComponent(activeGuildCookie.split("=")[1] || "").trim()
apps/admin-ui/pages/api/admin-api/[...path].js:113:    ...(activeGuildId ? { "x-slimy-active-guild-id": activeGuildId } : null),
apps/admin-ui/pages/guilds/index.js:65:        // Refresh session to pick up new activeGuildId
apps/admin-api/src/services/guild.service.js:73:          lastActiveGuildId: normalizedGuildId,
apps/admin-api/src/services/guild.service.js:80:          lastActiveGuildId: normalizedGuildId,
apps/admin-api/tests/auth/me-context.test.js:59:    it("should include lastActiveGuild from DB", async () => {
apps/admin-api/tests/auth/me-context.test.js:65:                    lastActiveGuild: {
apps/admin-api/tests/auth/me-context.test.js:79:            lastActiveGuild: {
apps/admin-api/tests/auth/me-context.test.js:86:            include: { lastActiveGuild: true }
apps/admin-api/tests/auth/me-context.test.js:101:        // Should not crash, just missing lastActiveGuild
apps/admin-api/tests/auth/me-context.test.js:102:        expect(res.body.lastActiveGuild).toBeUndefined();
apps/admin-api/prisma/schema.prisma:40:  lastActiveGuildId String? @map("last_active_guild_id")
apps/admin-api/prisma/schema.prisma:41:  lastActiveGuild   Guild?  @relation("LastActiveGuild", fields: [lastActiveGuildId], references: [id], onDelete: SetNull)
apps/admin-api/prisma/schema.prisma:47:  @@index([lastActiveGuildId])
apps/admin-api/prisma/migrations/20251213160000_align_admin_api_schema/migration.sql:5:-- Add User.last_active_guild_id used by Prisma model `User.lastActiveGuildId`

$ rg -n "active_guild|activeGuild|lastActiveGuild|slimy_admin_active_guild" apps/admin-ui apps/admin-api || true
apps/admin-ui/components/debug/DebugDock.tsx:73:  const activeGuildId = useMemo(() => getActiveGuildId(pathname), [pathname]);
apps/admin-ui/components/debug/DebugDock.tsx:74:  const activeGuild = useMemo(() => {
apps/admin-ui/components/debug/DebugDock.tsx:75:    if (!activeGuildId || !guilds) return null;
apps/admin-ui/components/debug/DebugDock.tsx:76:    return guilds.find((g) => String(g.id) === String(activeGuildId)) || null;
apps/admin-ui/components/debug/DebugDock.tsx:77:  }, [activeGuildId, guilds]);
apps/admin-ui/components/debug/DebugDock.tsx:199:      activeGuild: activeGuildId
apps/admin-ui/components/debug/DebugDock.tsx:201:            id: activeGuildId,
apps/admin-ui/components/debug/DebugDock.tsx:202:            name: activeGuild?.name ?? null,
apps/admin-ui/components/debug/DebugDock.tsx:203:            roleLabel: activeGuild?.roleLabel ?? null,
apps/admin-ui/components/debug/DebugDock.tsx:204:            roleSource: activeGuild?.roleSource ?? null,
apps/admin-ui/components/debug/DebugDock.tsx:222:  }, [activeGuild?.name, activeGuild?.roleLabel, activeGuild?.roleSource, activeGuildId, diag, envEnabled, health, pathname, user]);
apps/admin-ui/components/debug/DebugDock.tsx:280:              activeGuild: {activeGuildId || "none"}{" "}
apps/admin-ui/components/debug/DebugDock.tsx:281:              {activeGuildId && activeGuild?.roleLabel
apps/admin-ui/components/debug/DebugDock.tsx:282:                ? `(${activeGuild.roleLabel}${activeGuild.roleSource ? `:${activeGuild.roleSource}` : ""})`
apps/admin-ui/components/Layout.js:26:  const activeGuild = useActiveGuild({ explicitGuildId: guildId, router });
apps/admin-ui/components/Layout.js:405:selectedGuildId: ${activeGuild.guildId || "(none)"}
apps/admin-ui/components/Layout.js:406:selectedGuildSource: ${activeGuild.source}`}
apps/admin-ui/lib/active-guild.js:5:export const ACTIVE_GUILD_ID_KEY = "slimy_admin_active_guild_id";
apps/admin-api/src/routes/auth.js:20:const ACTIVE_GUILD_COOKIE_NAME = "slimy_admin_active_guild_id";
apps/admin-api/src/routes/auth.js:581:        include: { lastActiveGuild: true },
apps/admin-api/src/routes/auth.js:640:    // Resolve activeGuildId from: header → cookie → DB
apps/admin-api/src/routes/auth.js:641:    let activeGuildId = null;
apps/admin-api/src/routes/auth.js:642:    let activeGuildAppRole = null;
apps/admin-api/src/routes/auth.js:647:      activeGuildId = String(headerActiveGuild);
apps/admin-api/src/routes/auth.js:651:    if (!activeGuildId && req.cookies?.[ACTIVE_GUILD_COOKIE_NAME]) {
apps/admin-api/src/routes/auth.js:652:      activeGuildId = String(req.cookies[ACTIVE_GUILD_COOKIE_NAME]);
apps/admin-api/src/routes/auth.js:655:    // Priority 3: DB lastActiveGuildId
apps/admin-api/src/routes/auth.js:656:    if (!activeGuildId && dbUser?.lastActiveGuildId) {
apps/admin-api/src/routes/auth.js:657:      activeGuildId = String(dbUser.lastActiveGuildId);
apps/admin-api/src/routes/auth.js:660:    // Validate activeGuildId is in user's guilds and compute role
apps/admin-api/src/routes/auth.js:661:    if (activeGuildId) {
apps/admin-api/src/routes/auth.js:662:      const activeGuildEntry = sessionGuilds.find((g) => String(g.id) === activeGuildId);
apps/admin-api/src/routes/auth.js:663:      if (!activeGuildEntry) {
apps/admin-api/src/routes/auth.js:665:        activeGuildId = null;
apps/admin-api/src/routes/auth.js:668:        const isPrimary = activeGuildId === PRIMARY_GUILD_ID;
apps/admin-api/src/routes/auth.js:677:                activeGuildAppRole = computeRoleLabelFromRoles(memberRoles);
apps/admin-api/src/routes/auth.js:686:        if (!activeGuildAppRole) {
apps/admin-api/src/routes/auth.js:687:          const roles = activeGuildEntry.roles || [];
apps/admin-api/src/routes/auth.js:689:            activeGuildAppRole = "admin";
apps/admin-api/src/routes/auth.js:691:            activeGuildAppRole = "club";
apps/admin-api/src/routes/auth.js:693:            activeGuildAppRole = "member";
apps/admin-api/src/routes/auth.js:706:      activeGuildId,
apps/admin-api/src/routes/auth.js:707:      activeGuildAppRole,
apps/admin-api/src/routes/auth.js:708:      lastActiveGuild: dbUser?.lastActiveGuild
apps/admin-api/src/routes/auth.js:710:            id: dbUser.lastActiveGuild.id,
apps/admin-api/src/routes/auth.js:711:            name: dbUser.lastActiveGuild.name,
apps/admin-api/src/routes/auth.js:712:            icon: dbUser.lastActiveGuild.icon,
apps/admin-api/src/routes/auth.js:742: * - Updates lastActiveGuildId in DB
apps/admin-api/src/routes/auth.js:743: * - Returns activeGuildId + appRole
apps/admin-api/src/routes/auth.js:804:    // 4. Update lastActiveGuildId in DB
apps/admin-api/src/routes/auth.js:821:          data: { lastActiveGuildId: normalizedGuildId },
apps/admin-api/src/routes/auth.js:824:        console.warn("[auth/active-guild] Failed to update lastActiveGuildId:", err?.message || err);
apps/admin-api/src/routes/auth.js:838:    // 6. Return success with activeGuildId and appRole
apps/admin-api/src/routes/auth.js:841:      activeGuildId: normalizedGuildId,
apps/admin-ui/pages/club/index.js:14:  const activeGuild = useActiveGuild({ router });
apps/admin-ui/pages/club/index.js:16:  const selected = activeGuild.guildId || null;
apps/admin-ui/pages/club/index.js:109:          selected via <span style={{ fontFamily: "monospace" }}>{activeGuild.source}</span>
apps/admin-ui/pages/api/admin-api/[...path].js:97:  const activeGuildCookie = (cookie || "")
apps/admin-ui/pages/api/admin-api/[...path].js:100:    .find((c) => c.startsWith("slimy_admin_active_guild_id="));
apps/admin-ui/pages/api/admin-api/[...path].js:101:  const activeGuildId = activeGuildCookie
apps/admin-ui/pages/api/admin-api/[...path].js:102:    ? decodeURIComponent(activeGuildCookie.split("=")[1] || "").trim()
apps/admin-ui/pages/api/admin-api/[...path].js:113:    ...(activeGuildId ? { "x-slimy-active-guild-id": activeGuildId } : null),
apps/admin-api/src/services/guild.service.js:73:          lastActiveGuildId: normalizedGuildId,
apps/admin-api/src/services/guild.service.js:80:          lastActiveGuildId: normalizedGuildId,
apps/admin-ui/pages/guilds/index.js:65:        // Refresh session to pick up new activeGuildId
apps/admin-api/tests/auth/me-context.test.js:59:    it("should include lastActiveGuild from DB", async () => {
apps/admin-api/tests/auth/me-context.test.js:65:                    lastActiveGuild: {
apps/admin-api/tests/auth/me-context.test.js:79:            lastActiveGuild: {
apps/admin-api/tests/auth/me-context.test.js:86:            include: { lastActiveGuild: true }
apps/admin-api/tests/auth/me-context.test.js:101:        // Should not crash, just missing lastActiveGuild
apps/admin-api/tests/auth/me-context.test.js:102:        expect(res.body.lastActiveGuild).toBeUndefined();
apps/admin-ui/pages/chat/index.js:29:  const activeGuildHook = useActiveGuild({ router });
apps/admin-ui/pages/chat/index.js:32:  // Prefer server-side activeGuildId, fall back to client-side hook
apps/admin-ui/pages/chat/index.js:33:  const serverActiveGuildId = user?.activeGuildId;
apps/admin-ui/pages/chat/index.js:34:  const serverActiveGuildAppRole = user?.activeGuildAppRole;
apps/admin-ui/pages/chat/index.js:35:  const guildId = serverActiveGuildId || activeGuildHook.guildId;
apps/admin-ui/pages/chat/index.js:36:  const guildSource = serverActiveGuildId ? "server" : activeGuildHook.source;
apps/admin-ui/pages/chat/index.js:48:    // If server says we have an activeGuildId, trust it
apps/admin-ui/pages/chat/index.js:174:                  selected via <span style={{ fontFamily: "monospace" }}>{activeGuild.source}</span>
apps/admin-api/prisma/migrations/20251213160000_align_admin_api_schema/migration.sql:5:-- Add User.last_active_guild_id used by Prisma model `User.lastActiveGuildId`
apps/admin-api/prisma/migrations/20251213160000_align_admin_api_schema/migration.sql:7:  ADD COLUMN `last_active_guild_id` VARCHAR(191) NULL;
apps/admin-api/prisma/migrations/20251213160000_align_admin_api_schema/migration.sql:9:CREATE INDEX `users_last_active_guild_id_idx` ON `users`(`last_active_guild_id`);
apps/admin-api/prisma/migrations/20251213160000_align_admin_api_schema/migration.sql:12:  ADD CONSTRAINT `users_last_active_guild_id_fkey`
apps/admin-api/prisma/migrations/20251213160000_align_admin_api_schema/migration.sql:13:  FOREIGN KEY (`last_active_guild_id`) REFERENCES `guilds`(`id`)
apps/admin-api/prisma/schema.prisma:40:  lastActiveGuildId String? @map("last_active_guild_id")
apps/admin-api/prisma/schema.prisma:41:  lastActiveGuild   Guild?  @relation("LastActiveGuild", fields: [lastActiveGuildId], references: [id], onDelete: SetNull)
apps/admin-api/prisma/schema.prisma:47:  @@index([lastActiveGuildId])

$ rg -n "pages/api/admin-api" apps/admin-ui/pages/api || true


$ rg -n "auth/me|lastActiveGuild" apps/admin-api/src || true
apps/admin-api/src/routes/auth.js:526:        console.warn("[auth/me] Prisma unavailable; returning session-only response", {
apps/admin-api/src/routes/auth.js:532:    console.log(`[auth/me] req.user keys: ${Object.keys(req.user || {}).join(",")}`);
apps/admin-api/src/routes/auth.js:533:    console.log(`[auth/me] rawUser keys: ${Object.keys(rawUser || {}).join(",")}`);
apps/admin-api/src/routes/auth.js:534:    console.log(`[auth/me] Lookup User ID: ${userId}`);
apps/admin-api/src/routes/auth.js:537:      console.warn("[auth/me] Missing userId on session user payload:", rawUser);
apps/admin-api/src/routes/auth.js:581:        include: { lastActiveGuild: true },
apps/admin-api/src/routes/auth.js:586:        console.warn("[auth/me] DB user lookup failed; returning session-only response", {
apps/admin-api/src/routes/auth.js:592:    console.log(`[auth/me] DB User Found: ${!!dbUser}`);
apps/admin-api/src/routes/auth.js:603:        console.log(`[auth/me] Raw DB Guilds Found: ${userGuilds.length}`);
apps/admin-api/src/routes/auth.js:615:          console.warn("[auth/me] DB guild lookup failed; returning session-only guilds", {
apps/admin-api/src/routes/auth.js:631:      console.warn("[auth/me] Fallback to cookie guilds:", cookieGuilds.length);
apps/admin-api/src/routes/auth.js:655:    // Priority 3: DB lastActiveGuildId
apps/admin-api/src/routes/auth.js:656:    if (!activeGuildId && dbUser?.lastActiveGuildId) {
apps/admin-api/src/routes/auth.js:657:      activeGuildId = String(dbUser.lastActiveGuildId);
apps/admin-api/src/routes/auth.js:680:              console.warn("[auth/me] Failed to fetch member roles for active guild:", err?.message);
apps/admin-api/src/routes/auth.js:708:      lastActiveGuild: dbUser?.lastActiveGuild
apps/admin-api/src/routes/auth.js:710:            id: dbUser.lastActiveGuild.id,
apps/admin-api/src/routes/auth.js:711:            name: dbUser.lastActiveGuild.name,
apps/admin-api/src/routes/auth.js:712:            icon: dbUser.lastActiveGuild.icon,
apps/admin-api/src/routes/auth.js:721:    console.error("[auth/me] CRITICAL ERROR:", err);
apps/admin-api/src/routes/auth.js:722:    console.error("[auth/me] rawUser snapshot:", rawUser);
apps/admin-api/src/routes/auth.js:742: * - Updates lastActiveGuildId in DB
apps/admin-api/src/routes/auth.js:804:    // 4. Update lastActiveGuildId in DB
apps/admin-api/src/routes/auth.js:821:          data: { lastActiveGuildId: normalizedGuildId },
apps/admin-api/src/routes/auth.js:824:        console.warn("[auth/active-guild] Failed to update lastActiveGuildId:", err?.message || err);
apps/admin-api/src/services/guild.service.js:73:          lastActiveGuildId: normalizedGuildId,
apps/admin-api/src/services/guild.service.js:80:          lastActiveGuildId: normalizedGuildId,

## Plan
- Confirm current active-guild endpoint + /auth/me behavior and note gaps vs required deterministic flow.
- Update admin-ui guild selection to call admin-api via proxy and disable unselectable guilds.
- Enforce server-side active guild gating + debug context in /chat and /club.
- Adjust admin-api auth hydration to attach/return active guild + app role consistently and add tests.
- Verify expected behaviors and log outputs.
## Verification

$ cd /opt/slimy/slimy-monorepo/apps/admin-api && npm test -- active-guild

> @slimy/admin-api@1.0.0 test
> jest active-guild

  console.log
    !!! AUTH LOGIC LOADED v304 (ACTIVE GUILD) !!!

      at Object.log (src/routes/auth.js:22:9)

PASS tests/auth/active-guild.test.js
  POST /api/auth/active-guild
    ✓ rejects guilds that are not shared/connectable (61 ms)
    ✓ returns role for primary guild based on policy logic (6 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Snapshots:   0 total
Time:        1.053 s
Ran all test suites matching /active-guild/i.

$ rg -n "x-slimy-active-guild-id" apps/admin-ui/pages/api/admin-api/[...path].js
113:    ...(activeGuildId ? { "x-slimy-active-guild-id": activeGuildId } : null),

$ curl -sS -I http://localhost:3001 | sed -n "1,12p"
HTTP/1.1 200 OK
X-Powered-By: Next.js
ETag: "uy3wjzvq0s2tj"
Content-Type: text/html; charset=utf-8
Content-Length: 3679
Vary: Accept-Encoding
Date: Thu, 18 Dec 2025 19:43:14 GMT
Connection: keep-alive
Keep-Alive: timeout=5


# Manual runtime check pending (requires real login cookie)
# read -rs -p "Cookie (name=value): " SLIMY_ADMIN_COOKIE; echo
# curl -sS --cookie "$SLIMY_ADMIN_COOKIE" http://localhost:3001/api/admin-api/api/auth/me | head -c 2000; echo
# Expected: activeGuildId present and appRole correct.
$ git status -sb
## nuc2/verify-role-b33e616...origin/nuc2/verify-role-b33e616
 M apps/admin-api/src/middleware/auth.js
 M apps/admin-api/src/routes/auth.js
 M apps/admin-api/src/services/discord-shared-guilds.js
 M apps/admin-ui/components/Layout.js
 M apps/admin-ui/pages/api/admin-api/[...path].js
 M apps/admin-ui/pages/chat/index.js
 M apps/admin-ui/pages/club/index.js
 M apps/admin-ui/pages/guilds/index.js
?? apps/admin-api/tests/auth/active-guild.test.js
?? docs/buglog/BUG_2025-12-18_guild-selection-perms-propagation.md

$ rg -n "activeGuild" apps/admin-ui/pages/chat/index.js


$ rg -n "activeGuild" apps/admin-ui/pages/club/index.js


$ rg -n "discordAccessToken" apps/admin-api/src/routes/auth.js



---

## Final Verification (2025-12-19T12:06:10+00:00)
- Tests: pnpm --filter @slimy/admin-api test; pnpm --filter @slimy/admin-ui build; pnpm stability:gate
- Confirmed guild selection/perms propagation paths pass automated checks and admin-ui build/stability gate succeeds.
ready to move on
