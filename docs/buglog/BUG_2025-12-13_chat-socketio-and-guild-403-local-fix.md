# BUG: chat-socketio-and-guild-403-local-fix
Date: 2025-12-13T18:55:22-05:00

## Workspace State (initial)
### pwd
/home/mint/Desktop/slimy-monorepo

### git status -sb
## main...origin/main [ahead 9]
 M apps/admin-api/lib/session-store.js
 M apps/admin-api/package.json
 M apps/admin-api/server.js
 M apps/admin-api/src/middleware/auth.js
 M apps/admin-api/src/routes/auth.js
 M apps/admin-api/src/socket.js
 M apps/admin-ui/components/Layout.js
 M apps/admin-ui/components/SlimeChatBar.jsx
 M apps/admin-ui/lib/socket.js
 M apps/admin-ui/next.config.js
 M apps/admin-ui/pages/admin-api-usage.jsx
 M apps/admin-ui/pages/api/admin-api/[...path].js
 M apps/admin-ui/pages/auth-me.jsx
 M apps/admin-ui/pages/dashboard.jsx
 M apps/admin-ui/pages/guilds/[guildId]/settings.js
 M apps/admin-ui/pages/index.js
 M apps/admin-ui/pages/status.jsx
 M apps/admin-ui/styles/globals.css
 M docs/docker-setup.md
 M pnpm-lock.yaml
 M scripts/smoke/docker-smoke.sh
?? apps/admin-api/prisma/migrations/20251213160000_align_admin_api_schema/
?? docs/buglog/BUG_2025-12-13_admin-ui-style-parity-status-dashboard.md
?? docs/buglog/BUG_2025-12-13_auth-me-500-when-logged-in.md
?? docs/buglog/BUG_2025-12-13_chat-socketio-and-guild-403-local-fix.md
?? docs/buglog/BUG_2025-12-13_dashboard-auth-flow-finalize.md
?? docs/buglog/BUG_2025-12-13_prisma-mysql-schema-missing.md
?? docs/buglog/BUG_2025-12-13_sitewide-theme-slimyai-login-parity.md
?? scripts/dev/

### git rev-parse HEAD
b30288745db9cf764bdb335b2ce6a87d2dadf805

### git diff
diff --git a/apps/admin-api/lib/session-store.js b/apps/admin-api/lib/session-store.js
index 1ea5c44..b682825 100644
--- a/apps/admin-api/lib/session-store.js
+++ b/apps/admin-api/lib/session-store.js
@@ -40,8 +40,14 @@ async function storeSession(userId, data) {
 
 async function getSession(userId) {
   try {
-    // Fetch user's guilds from the database
-    const userGuilds = await database.getUserGuilds(userId);
+    const discordId = String(userId || "").trim();
+    if (!discordId) return null;
+
+    const user = await database.findUserByDiscordId(discordId);
+    if (!user) return null;
+
+    // Fetch user's guilds from the database (expects internal user.id)
+    const userGuilds = await database.getUserGuilds(user.id);
 
     if (!userGuilds || userGuilds.length === 0) {
       return null;
diff --git a/apps/admin-api/package.json b/apps/admin-api/package.json
index 2c9e686..c5d475b 100644
--- a/apps/admin-api/package.json
+++ b/apps/admin-api/package.json
@@ -42,6 +42,7 @@
     "pino": "^9.7.0",
     "redis": "^4.6.8",
     "sharp": "^0.33.5",
+    "socket.io": "^4.8.1",
     "undici": "^7.16.0",
     "uuid": "^11.0.5",
     "zod": "^3.25.6"
diff --git a/apps/admin-api/server.js b/apps/admin-api/server.js
index bdd438f..1fa53b3 100644
--- a/apps/admin-api/server.js
+++ b/apps/admin-api/server.js
@@ -37,6 +37,7 @@ const database = require("./lib/database");
 const prismaDatabase = require("./src/lib/database");
 const { applyDatabaseUrl } = require("./src/utils/apply-db-url");
 const logger = require("./lib/logger");
+const { initSocket } = require("./src/socket");
 
 async function start() {
   applyDatabaseUrl(process.env.DB_URL);
@@ -79,6 +80,8 @@ async function start() {
     logger.info({ port, host }, `[admin-api] Listening on http://${host}:${port}`);
   });
 
+  initSocket(server);
+
   process.on("SIGINT", () => {
     logger.info("[admin-api] Caught SIGINT, shutting down");
     server.close(() => {
diff --git a/apps/admin-api/src/middleware/auth.js b/apps/admin-api/src/middleware/auth.js
index 68f8efe..4a37214 100644
--- a/apps/admin-api/src/middleware/auth.js
+++ b/apps/admin-api/src/middleware/auth.js
@@ -234,6 +234,11 @@ function forbidden(res, message = "Insufficient role") {
   });
 }
 
+function shouldDebugAuth() {
+  const flag = String(process.env.ADMIN_AUTH_DEBUG || "").trim().toLowerCase();
+  return process.env.NODE_ENV !== "production" || flag === "1" || flag === "true" || flag === "yes";
+}
+
 async function requireAuth(req, res, next) {
   const user = req.user || await resolveUser(req);
   if (!user) {
@@ -288,8 +293,16 @@ function requireGuildMember(paramKey = "guildId") {
     }
 
     const guilds = user.guilds || [];
-    const guild = guilds.find((entry) => entry.id === guildId);
+    const guildIdStr = String(guildId);
+    const guild = guilds.find((entry) => String(entry?.id) === guildIdStr);
     if (!guild) {
+      if (shouldDebugAuth()) {
+        console.warn("[admin-api] guild membership check failed", {
+          userId: user.id,
+          guildId: guildIdStr,
+          guildIds: guilds.map((g) => String(g?.id)).slice(0, 25),
+        });
+      }
       return forbidden(res, "You are not a member of this guild");
     }
 
diff --git a/apps/admin-api/src/routes/auth.js b/apps/admin-api/src/routes/auth.js
index 732fe3e..5c86797 100644
--- a/apps/admin-api/src/routes/auth.js
+++ b/apps/admin-api/src/routes/auth.js
@@ -377,9 +377,20 @@ router.get("/me", async (req, res) => {
   // @ts-ignore
   const rawUser = req.user.user || req.user;
   const userId = rawUser?.id || rawUser?.discordId || rawUser?.sub;
+  const warnings = [];
 
   try {
-    const prisma = prismaDatabase.getClient();
+    let prisma = null;
+    try {
+      prisma = prismaDatabase.getClient();
+    } catch (err) {
+      warnings.push("db_unavailable");
+      if (shouldDebugAuth()) {
+        console.warn("[auth/me] Prisma unavailable; returning session-only response", {
+          error: err?.message || String(err),
+        });
+      }
+    }
 
     console.log(`[auth/me] req.user keys: ${Object.keys(req.user || {}).join(",")}`);
     console.log(`[auth/me] rawUser keys: ${Object.keys(rawUser || {}).join(",")}`);
@@ -387,67 +398,131 @@ router.get("/me", async (req, res) => {
 
     if (!userId) {
       console.warn("[auth/me] Missing userId on session user payload:", rawUser);
-      return res.json({ id: null, username: "Guest", guilds: [], sessionGuilds: [] });
+      warnings.push("missing_user_id");
+      return res.json({
+        id: null,
+        username: "Guest",
+        guilds: [],
+        sessionGuilds: [],
+        warnings,
+      });
     }
 
-    const dbUser = await prisma.user.findUnique({
-      where: { discordId: String(userId) },
-    });
+    // Base response: usable even when DB calls fail.
+    const baseResponse = {
+      id: userId,
+      discordId: userId,
+      username: rawUser?.username || rawUser?.name || "Unknown",
+      globalName: rawUser?.globalName,
+      avatar: rawUser?.avatar,
+      role: rawUser?.role || "member",
+      sessionGuilds: [],
+      guilds: [],
+      warnings,
+    };
+
+    // If DB is unavailable, return the session-only response instead of 500.
+    if (!prisma) {
+      const cookieGuilds = Array.isArray(rawUser?.guilds) ? rawUser.guilds : [];
+      const sessionGuilds = cookieGuilds.map((g) => ({
+        id: g?.id,
+        roles: g?.roles,
+        name: "Unknown (DB unavailable)",
+        installed: false,
+      }));
+      baseResponse.sessionGuilds = sessionGuilds;
+      baseResponse.guilds = sessionGuilds;
+      return res.json(baseResponse);
+    }
+
+    let dbUser = null;
+    try {
+      dbUser = await prisma.user.findUnique({
+        where: { discordId: String(userId) },
+      });
+    } catch (err) {
+      warnings.push("db_user_lookup_failed");
+      if (shouldDebugAuth()) {
+        console.warn("[auth/me] DB user lookup failed; returning session-only response", {
+          error: err?.message || String(err),
+        });
+      }
+    }
 
     console.log(`[auth/me] DB User Found: ${!!dbUser}`);
 
     let sessionGuilds = [];
     if (dbUser) {
       // Fetch UserGuilds AND JOIN Guild
-      const userGuilds = await prisma.userGuild.findMany({
-        where: { userId: dbUser.id },
-        include: { guild: true },
-      });
-
-      console.log(`[auth/me] Raw DB Guilds Found: ${userGuilds.length}`);
+      try {
+        const userGuilds = await prisma.userGuild.findMany({
+          where: { userId: dbUser.id },
+          include: { guild: true },
+        });
 
-      sessionGuilds = userGuilds.map((ug) => ({
-        id: ug.guild?.id,
-        name: ug.guild?.name,
-        icon: ug.guild?.icon,
-        installed: true,
-        roles: ug.roles || [],
-      }));
+        console.log(`[auth/me] Raw DB Guilds Found: ${userGuilds.length}`);
+
+        sessionGuilds = userGuilds.map((ug) => ({
+          id: ug.guild?.id,
+          name: ug.guild?.name,
+          icon: ug.guild?.icon,
+          installed: true,
+          roles: ug.roles || [],
+        }));
+      } catch (err) {
+        warnings.push("db_guilds_lookup_failed");
+        if (shouldDebugAuth()) {
+          console.warn("[auth/me] DB guild lookup failed; returning session-only guilds", {
+            error: err?.message || String(err),
+          });
+        }
+        const cookieGuilds = Array.isArray(rawUser?.guilds) ? rawUser.guilds : [];
+        sessionGuilds = cookieGuilds.map((g) => ({
+          id: g?.id,
+          roles: g?.roles,
+          name: "Unknown (DB guild lookup failed)",
+          installed: false,
+        }));
+      }
     } else {
       // Fallback: Use cookie guilds if available (will lack names)
       // But ensure we at least pass the ID
-      const cookieGuilds = rawUser.guilds || [];
+      const cookieGuilds = Array.isArray(rawUser?.guilds) ? rawUser.guilds : [];
       console.warn("[auth/me] Fallback to cookie guilds:", cookieGuilds.length);
       sessionGuilds = cookieGuilds.map((g) => ({
-        id: g.id,
-        roles: g.roles,
+        id: g?.id,
+        roles: g?.roles,
         name: "Unknown (Not in DB)",
         installed: false,
       }));
     }
 
-    const response = {
-      id: dbUser?.discordId || userId,
-      discordId: dbUser?.discordId || userId,
-      username: dbUser?.username || rawUser.username || "Unknown",
-      globalName: dbUser?.globalName || rawUser.globalName,
-      avatar: dbUser?.avatar || rawUser.avatar,
-      role: rawUser.role || "member",
-      sessionGuilds: sessionGuilds,
-      // Legacy field for compatibility
+    return res.json({
+      id: dbUser?.discordId || baseResponse.id,
+      discordId: dbUser?.discordId || baseResponse.discordId,
+      username: dbUser?.username || baseResponse.username,
+      globalName: dbUser?.globalName || baseResponse.globalName,
+      avatar: dbUser?.avatar || baseResponse.avatar,
+      role: baseResponse.role,
+      sessionGuilds,
       guilds: sessionGuilds,
-    };
-
-    return res.json(response);
+      warnings,
+    });
   } catch (err) {
+    // Last line of defense: never 500 for authenticated sessions.
     console.error("[auth/me] CRITICAL ERROR:", err);
     console.error("[auth/me] rawUser snapshot:", rawUser);
-    return res.status(500).json({
-      error: "internal_error",
+    warnings.push("me_handler_failed");
+    return res.json({
       id: userId || null,
+      discordId: userId || null,
       username: rawUser?.username || rawUser?.name || "Unknown",
+      globalName: rawUser?.globalName,
+      avatar: rawUser?.avatar,
+      role: rawUser?.role || "member",
       sessionGuilds: [],
       guilds: [],
+      warnings,
     });
   }
 });
diff --git a/apps/admin-api/src/socket.js b/apps/admin-api/src/socket.js
index 8925283..cda434d 100644
--- a/apps/admin-api/src/socket.js
+++ b/apps/admin-api/src/socket.js
@@ -1,6 +1,7 @@
 "use strict";
 
 const { Server } = require("socket.io");
+const config = require("./config");
 const { verifySession, COOKIE_NAME } = require("../lib/jwt");
 const { getSession } = require("../lib/session-store");
 const metrics = require("./lib/metrics");
@@ -36,14 +37,21 @@ function buildEmitterPayload(user, text) {
 }
 
 function initSocket(server) {
+  const allowedOrigins = Array.isArray(config.ui?.origins) ? config.ui.origins : [];
+
   const io = new Server(server, {
     cors: {
-      origin: "https://admin.slimyai.xyz",
+      origin(origin, callback) {
+        if (!origin) return callback(null, true);
+        if (!allowedOrigins.length) return callback(null, true);
+        if (allowedOrigins.includes(origin)) return callback(null, true);
+        return callback(new Error("origin_not_allowed"), false);
+      },
       credentials: true,
     },
   });
 
-  io.use((socket, next) => {
+  io.use(async (socket, next) => {
     try {
       const cookies = parseCookies(socket.handshake.headers.cookie || "");
       const token = cookies[COOKIE_NAME];
@@ -57,7 +65,7 @@ function initSocket(server) {
       }
 
       // Guilds are stored in session store, not JWT (to keep JWT under 4KB)
-      const sessionData = getSession(socket.user.id);
+      const sessionData = await getSession(socket.user.id);
       socket.session = sessionData;
       const guilds = Array.isArray(sessionData?.guilds) ? sessionData.guilds : [];
       socket.guildIds = guilds.map((g) => String(g.id));
diff --git a/apps/admin-ui/components/Layout.js b/apps/admin-ui/components/Layout.js
index 31ce9f1..59e91a6 100644
--- a/apps/admin-ui/components/Layout.js
+++ b/apps/admin-ui/components/Layout.js
@@ -123,7 +123,7 @@ export default function Layout({ guildId, children, title, hideSidebar = false }
       <nav className="sticky-nav">
         <div className="nav-left">
           <button className="burger" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">☰</button>
-          <span>🐌 slimy.ai</span>
+          <span>slimy.ai</span>
           <div className="nav-links">
             {isAdmin && guildId && navLinks.map((link) => (
               <Link key={link.href} href={link.href} legacyBehavior>
@@ -173,6 +173,13 @@ export default function Layout({ guildId, children, title, hideSidebar = false }
         </div>
       </nav>
 
+      <div className="top-marquee" aria-hidden>
+        <div className="top-marquee__inner">
+          <span>WELCOME</span> TO SLIMY.AI ADMIN • <span>/DASHBOARD</span> • <span>/GUILDS</span> • <span>/SNAIL</span> • <span>/CHAT</span> • <span>SLIME MODE</span> •
+        </div>
+      </div>
+      <div className="slime-drips" aria-hidden />
+
       {!hideSidebar && (
         <div className="dashboard-wrapper">
           {/* Mobile header */}
diff --git a/apps/admin-ui/components/SlimeChatBar.jsx b/apps/admin-ui/components/SlimeChatBar.jsx
index fc7300d..39e0dc6 100644
--- a/apps/admin-ui/components/SlimeChatBar.jsx
+++ b/apps/admin-ui/components/SlimeChatBar.jsx
@@ -4,9 +4,10 @@ import { useEffect, useState, useRef } from "react";
 import { io } from "socket.io-client";
 import { useSession } from "../lib/session";
 
-const API_BASE = typeof window !== "undefined" 
-  ? (process.env.NEXT_PUBLIC_ADMIN_API_BASE || "")
-  : "";
+const SOCKET_BASE =
+  typeof window !== "undefined"
+    ? String(process.env.NEXT_PUBLIC_ADMIN_SOCKET_URL || "").trim()
+    : "";
 
 export default function SlimeChatBar({ guildId }) {
   const { user } = useSession();
@@ -47,7 +48,7 @@ export default function SlimeChatBar({ guildId }) {
   useEffect(() => {
     if (!user) return;
 
-    const socketUrl = API_BASE || window.location.origin;
+    const socketUrl = SOCKET_BASE || window.location.origin;
     console.log("[chat-bar] connecting to", socketUrl);
 
     const socket = io(socketUrl, {
diff --git a/apps/admin-ui/lib/socket.js b/apps/admin-ui/lib/socket.js
index 4ba9e89..70d753a 100644
--- a/apps/admin-ui/lib/socket.js
+++ b/apps/admin-ui/lib/socket.js
@@ -2,11 +2,19 @@ import { io } from "socket.io-client";
 
 let socket = null;
 
+function resolveSocketBaseUrl() {
+  if (typeof window === "undefined") return "";
+  const override = String(process.env.NEXT_PUBLIC_ADMIN_SOCKET_URL || "").trim();
+  if (override) return override;
+  return window.location.origin;
+}
+
 export function getSocket() {
   if (!socket) {
-    socket = io("https://admin.slimyai.xyz", {
+    const baseUrl = resolveSocketBaseUrl();
+    socket = io(baseUrl, {
       withCredentials: true,
-      transports: ["websocket"],
+      transports: ["websocket", "polling"],
     });
   }
   return socket;
diff --git a/apps/admin-ui/next.config.js b/apps/admin-ui/next.config.js
index 030abda..2aa3e2f 100644
--- a/apps/admin-ui/next.config.js
+++ b/apps/admin-ui/next.config.js
@@ -6,6 +6,10 @@ const { randomUUID } = require("crypto");
 const nextConfig = {
   reactStrictMode: true,
   output: 'standalone',
+  // Socket.IO clients request `/socket.io/…` (note the trailing slash).
+  // Next's default trailing-slash normalization can 308-redirect these requests,
+  // which breaks websocket/polling handshakes. Disable it for this app.
+  skipTrailingSlashRedirect: true,
   generateBuildId: async () => {
     if (process.env.NEXT_BUILD_ID) {
       return process.env.NEXT_BUILD_ID;
@@ -30,6 +34,19 @@ const nextConfig = {
           source: '/auth/:path*',
           destination: `${backendUrl}/auth/:path*`,
         },
+        // Socket.IO proxy (websocket upgrade + polling) - keep same-origin in local/dev.
+        {
+          source: '/socket.io',
+          destination: `${backendUrl}/socket.io/`,
+        },
+        {
+          source: '/socket.io/',
+          destination: `${backendUrl}/socket.io/`,
+        },
+        {
+          source: '/socket.io/:path*',
+          destination: `${backendUrl}/socket.io/:path*`,
+        },
       ],
       // Important: keep the broad /api proxy as a fallback so dynamic local API routes
       // (like /api/admin-api/[...path]) can take precedence.
diff --git a/apps/admin-ui/pages/admin-api-usage.jsx b/apps/admin-ui/pages/admin-api-usage.jsx
index 0cf7384..30d2fd2 100644
--- a/apps/admin-ui/pages/admin-api-usage.jsx
+++ b/apps/admin-ui/pages/admin-api-usage.jsx
@@ -68,73 +68,6 @@ export default function AdminApiUsagePage() {
 
         <pre className="box">{state.data ? JSON.stringify(state.data, null, 2) : "No data yet."}</pre>
       </div>
-      <style jsx>{`
-        .wrap {
-          max-width: 900px;
-          margin: 0 auto;
-          padding: 24px 20px 48px;
-        }
-        h1 {
-          margin: 0 0 8px;
-          font-size: 1.35rem;
-        }
-        .muted {
-          margin: 0 0 16px;
-          opacity: 0.75;
-        }
-        .row {
-          display: flex;
-          align-items: center;
-          gap: 12px;
-          margin: 12px 0 16px;
-          flex-wrap: wrap;
-        }
-        .btn {
-          padding: 8px 12px;
-          border-radius: 10px;
-          border: 1px solid rgba(255, 255, 255, 0.12);
-          background: rgba(15, 23, 42, 0.45);
-          color: #fff;
-          cursor: pointer;
-          font-weight: 700;
-        }
-        .btn:disabled {
-          opacity: 0.6;
-          cursor: not-allowed;
-        }
-        .err {
-          color: #fca5a5;
-          font-weight: 700;
-        }
-        .list {
-          display: grid;
-          gap: 12px;
-          margin-bottom: 16px;
-        }
-        .item {
-          padding: 12px;
-          border-radius: 12px;
-          background: rgba(15, 23, 42, 0.25);
-          border: 1px solid rgba(255, 255, 255, 0.08);
-        }
-        .idx {
-          font-size: 0.75rem;
-          opacity: 0.65;
-          margin-bottom: 6px;
-        }
-        .pre {
-          margin: 0;
-          overflow: auto;
-        }
-        .box {
-          padding: 14px;
-          border-radius: 12px;
-          background: rgba(15, 23, 42, 0.35);
-          border: 1px solid rgba(255, 255, 255, 0.08);
-          overflow: auto;
-        }
-      `}</style>
     </Layout>
   );
 }
-
diff --git a/apps/admin-ui/pages/api/admin-api/[...path].js b/apps/admin-ui/pages/api/admin-api/[...path].js
index 4d4966a..31ac8d8 100644
--- a/apps/admin-ui/pages/api/admin-api/[...path].js
+++ b/apps/admin-ui/pages/api/admin-api/[...path].js
@@ -6,6 +6,41 @@ function isJsonContentType(contentType) {
   return normalized.includes("application/json") || normalized.includes("+json");
 }
 
+function splitSetCookieHeader(value) {
+  const raw = String(value || "").trim();
+  if (!raw) return [];
+
+  const parts = [];
+  let current = "";
+  let inExpires = false;
+
+  for (let i = 0; i < raw.length; i += 1) {
+    const ch = raw[i];
+
+    if (ch === ",") {
+      if (!inExpires) {
+        const trimmed = current.trim();
+        if (trimmed) parts.push(trimmed);
+        current = "";
+        continue;
+      }
+    }
+
+    current += ch;
+
+    if (!inExpires && current.length >= 8) {
+      const tail = current.slice(-8).toLowerCase();
+      if (tail === "expires=") inExpires = true;
+    } else if (inExpires && ch === ";") {
+      inExpires = false;
+    }
+  }
+
+  const last = current.trim();
+  if (last) parts.push(last);
+  return parts;
+}
+
 function getQueryString(reqUrl) {
   if (!reqUrl) return "";
   const idx = reqUrl.indexOf("?");
@@ -89,10 +124,14 @@ export default async function handler(req, res) {
         ? upstreamRes.headers.getSetCookie()
         : [];
     const setCookieFallback = upstreamRes.headers.get("set-cookie") || "";
+    const setCookieParsed = !setCookies.length && setCookieFallback
+      ? splitSetCookieHeader(setCookieFallback)
+      : [];
 
     if (upstreamContentType) res.setHeader("content-type", upstreamContentType);
     if (location) res.setHeader("location", location);
     if (setCookies.length) res.setHeader("set-cookie", setCookies);
+    else if (setCookieParsed.length) res.setHeader("set-cookie", setCookieParsed);
     else if (setCookieFallback) res.setHeader("set-cookie", setCookieFallback);
 
     const text = await upstreamRes.text().catch(() => "");
diff --git a/apps/admin-ui/pages/auth-me.jsx b/apps/admin-ui/pages/auth-me.jsx
index 4bdd954..fdb77e3 100644
--- a/apps/admin-ui/pages/auth-me.jsx
+++ b/apps/admin-ui/pages/auth-me.jsx
@@ -83,7 +83,7 @@ export default function AuthMePage() {
         ) : null}
 
         {Array.isArray(guilds) ? (
-          <div className="table">
+          <div className="table-grid">
             <div className="thead">
               <div>ID</div>
               <div>Name</div>
@@ -105,89 +105,6 @@ export default function AuthMePage() {
 
         <pre className="box">{state.data ? JSON.stringify(state.data, null, 2) : "No data yet."}</pre>
       </div>
-      <style jsx>{`
-        .wrap {
-          max-width: 900px;
-          margin: 0 auto;
-          padding: 24px 20px 48px;
-        }
-        h1 {
-          margin: 0 0 8px;
-          font-size: 1.35rem;
-        }
-        .muted {
-          margin: 0 0 16px;
-          opacity: 0.75;
-        }
-        .row {
-          display: flex;
-          align-items: center;
-          gap: 12px;
-          margin: 12px 0 16px;
-          flex-wrap: wrap;
-        }
-        .btn {
-          padding: 8px 12px;
-          border-radius: 10px;
-          border: 1px solid rgba(255, 255, 255, 0.12);
-          background: rgba(15, 23, 42, 0.45);
-          color: #fff;
-          cursor: pointer;
-          font-weight: 700;
-        }
-        .btn:disabled {
-          opacity: 0.6;
-          cursor: not-allowed;
-        }
-        .err {
-          color: #fca5a5;
-          font-weight: 700;
-        }
-        .callout {
-          padding: 10px 12px;
-          border-radius: 12px;
-          margin: 12px 0 16px;
-          border: 1px solid rgba(255, 255, 255, 0.08);
-          background: rgba(251, 191, 36, 0.12);
-        }
-        .table {
-          display: grid;
-          gap: 8px;
-          margin-bottom: 16px;
-        }
-        .thead,
-        .trow {
-          display: grid;
-          grid-template-columns: 1.3fr 1.4fr 0.6fr 1fr;
-          gap: 10px;
-          align-items: center;
-        }
-        .thead {
-          opacity: 0.7;
-          font-weight: 800;
-          font-size: 0.8rem;
-        }
-        .trow {
-          padding: 10px 12px;
-          border-radius: 12px;
-          background: rgba(15, 23, 42, 0.25);
-          border: 1px solid rgba(255, 255, 255, 0.08);
-        }
-        .mono {
-          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
-            "Courier New", monospace;
-          overflow: hidden;
-          text-overflow: ellipsis;
-          white-space: nowrap;
-        }
-        .box {
-          padding: 14px;
-          border-radius: 12px;
-          background: rgba(15, 23, 42, 0.35);
-          border: 1px solid rgba(255, 255, 255, 0.08);
-          overflow: auto;
-        }
-      `}</style>
     </Layout>
   );
 }
diff --git a/apps/admin-ui/pages/dashboard.jsx b/apps/admin-ui/pages/dashboard.jsx
index 7df05d0..e73b042 100644
--- a/apps/admin-ui/pages/dashboard.jsx
+++ b/apps/admin-ui/pages/dashboard.jsx
@@ -83,7 +83,8 @@ export default function DashboardPage({ user, meError }) {
     };
   }, []);
 
-  const displayName = user?.globalName || user?.username || user?.name || "Unknown";
+  const displayName =
+    user?.globalName || user?.username || user?.name || user?.discordId || user?.id || "Unknown";
   const guilds = Array.isArray(user?.sessionGuilds) ? user.sessionGuilds : Array.isArray(user?.guilds) ? user.guilds : [];
 
   return (
@@ -92,106 +93,117 @@ export default function DashboardPage({ user, meError }) {
         <title>slimy.ai – Dashboard</title>
       </Head>
 
-      {meError ? (
-        <div className="card" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
-          <div style={{ color: "#fca5a5", fontWeight: 800 }}>Auth Error</div>
-          <div style={{ opacity: 0.8 }}>{meError}</div>
-          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
-            <Link href="/status?returnTo=%2Fdashboard" legacyBehavior>
-              <a className="btn">Go to Status</a>
-            </Link>
-          </div>
-        </div>
-      ) : null}
-
-      <div className="card-grid">
-        <div className="card" style={{ padding: "1.25rem" }}>
-          <h4 style={{ marginTop: 0 }}>Session</h4>
-          <div style={{ display: "grid", gap: 6 }}>
-            <div>
-              Logged in as <strong>{displayName}</strong>
+      <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%", display: "grid", gap: "1rem" }}>
+        {meError ? (
+          <div className="card">
+            <div style={{ color: "#fca5a5", fontWeight: 800 }}>Auth Error</div>
+            <div style={{ opacity: 0.8 }}>{meError}</div>
+            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
+              <Link href="/status?returnTo=%2Fdashboard" legacyBehavior>
+                <a className="btn">Go to Status</a>
+              </Link>
             </div>
-            {user?.id ? (
-              <div style={{ opacity: 0.8 }}>
-                ID: <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" }}>{user.id}</span>
-              </div>
-            ) : null}
-            {user?.role ? (
-              <div style={{ opacity: 0.8 }}>
-                Role: <strong>{String(user.role).toUpperCase()}</strong>
-              </div>
-            ) : null}
-          </div>
-          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
-            <Link href="/guilds" legacyBehavior>
-              <a className="btn">Select a Guild</a>
-            </Link>
-            <Link href="/status?returnTo=%2Fdashboard" legacyBehavior>
-              <a className="btn outline">Status</a>
-            </Link>
           </div>
-        </div>
+        ) : null}
 
-        <div className="card" style={{ padding: "1.25rem" }}>
-          <h4 style={{ marginTop: 0 }}>Admin API</h4>
-          {health.loading ? (
-            <div style={{ opacity: 0.8 }}>Checking…</div>
-          ) : health.error ? (
-            <div style={{ color: "#fca5a5", fontWeight: 800 }}>{health.error}</div>
-          ) : (
+        <div className="card-grid">
+          <div className="card">
+            <div className="panel-header" style={{ marginBottom: 12, paddingBottom: 10 }}>
+              Session
+            </div>
             <div style={{ display: "grid", gap: 6 }}>
               <div>
-                Status:{" "}
-                <strong style={{ color: health.data?.status === "ok" ? "#86efac" : "#fca5a5" }}>
-                  {health.data?.status || "unknown"}
-                </strong>
+                Logged in as <strong>{displayName}</strong>
               </div>
-              {typeof health.data?.uptime === "number" ? (
-                <div style={{ opacity: 0.8 }}>Uptime: {health.data.uptime}s</div>
+              {user?.discordId || user?.id ? (
+                <div style={{ opacity: 0.8 }}>
+                  ID:{" "}
+                  <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" }}>
+                    {user?.discordId || user?.id}
+                  </span>
+                </div>
               ) : null}
-              {health.data?.timestamp ? (
-                <div style={{ opacity: 0.8 }}>TS: {health.data.timestamp}</div>
+              {user?.role ? (
+                <div style={{ opacity: 0.8 }}>
+                  Role: <strong>{String(user.role).toUpperCase()}</strong>
+                </div>
               ) : null}
             </div>
-          )}
-        </div>
-      </div>
-
-      {guilds.length ? (
-        <div className="card" style={{ padding: "1.25rem", marginTop: "1rem" }}>
-          <h4 style={{ marginTop: 0 }}>Guilds</h4>
-          <div style={{ opacity: 0.75, marginBottom: 12 }}>
-            Click a guild from <Link href="/guilds">/guilds</Link> to open its dashboard.
+            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
+              <Link href="/guilds" legacyBehavior>
+                <a className="btn">Select a Guild</a>
+              </Link>
+              <Link href="/status?returnTo=%2Fdashboard" legacyBehavior>
+                <a className="btn outline">Status</a>
+              </Link>
+            </div>
           </div>
-          <div style={{ display: "grid", gap: 10 }}>
-            {guilds.slice(0, 12).map((g) => (
-              <div
-                key={g?.id || JSON.stringify(g)}
-                className="card"
-                style={{
-                  padding: "0.9rem 1rem",
-                  display: "flex",
-                  justifyContent: "space-between",
-                  gap: 12,
-                  alignItems: "center",
-                }}
-              >
-                <div style={{ minWidth: 0 }}>
-                  <div style={{ fontWeight: 700 }}>{g?.name || "Unknown guild"}</div>
-                  <div style={{ opacity: 0.75, fontSize: "0.85rem" }}>
-                    <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" }}>
-                      {g?.id || "-"}
-                    </span>
-                  </div>
-                </div>
-                <div style={{ opacity: 0.8, textAlign: "right" }}>
-                  {Array.isArray(g?.roles) && g.roles.length ? g.roles.join(", ") : g?.role ? String(g.role) : "member"}
+
+          <div className="card">
+            <div className="panel-header" style={{ marginBottom: 12, paddingBottom: 10 }}>
+              Admin API
+            </div>
+            {health.loading ? (
+              <div style={{ opacity: 0.8 }}>Checking…</div>
+            ) : health.error ? (
+              <div style={{ color: "#fca5a5", fontWeight: 800 }}>{health.error}</div>
+            ) : (
+              <div style={{ display: "grid", gap: 6 }}>
+                <div>
+                  Status:{" "}
+                  <strong style={{ color: health.data?.status === "ok" ? "#86efac" : "#fca5a5" }}>
+                    {health.data?.status || "unknown"}
+                  </strong>
                 </div>
+                {typeof health.data?.uptime === "number" ? (
+                  <div style={{ opacity: 0.8 }}>Uptime: {health.data.uptime}s</div>
+                ) : null}
+                {health.data?.timestamp ? (
+                  <div style={{ opacity: 0.8 }}>TS: {health.data.timestamp}</div>
+                ) : null}
               </div>
-            ))}
+            )}
           </div>
         </div>
-      ) : null}
+
+        {guilds.length ? (
+          <div className="card">
+            <div className="panel-header" style={{ marginBottom: 12, paddingBottom: 10 }}>
+              Guilds
+            </div>
+            <div style={{ opacity: 0.75, marginBottom: 12 }}>
+              Click a guild from <Link href="/guilds">/guilds</Link> to open its dashboard.
+            </div>
+            <div style={{ display: "grid", gap: 10 }}>
+              {guilds.slice(0, 12).map((g) => (
+                <div
+                  key={g?.id || JSON.stringify(g)}
+                  className="card"
+                  style={{
+                    padding: "0.9rem 1rem",
+                    display: "flex",
+                    justifyContent: "space-between",
+                    gap: 12,
+                    alignItems: "center",
+                  }}
+                >
+                  <div style={{ minWidth: 0 }}>
+                    <div style={{ fontWeight: 700 }}>{g?.name || "Unknown guild"}</div>
+                    <div style={{ opacity: 0.75, fontSize: "0.85rem" }}>
+                      <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" }}>
+                        {g?.id || "-"}
+                      </span>
+                    </div>
+                  </div>
+                  <div style={{ opacity: 0.8, textAlign: "right" }}>
+                    {Array.isArray(g?.roles) && g.roles.length ? g.roles.join(", ") : g?.role ? String(g.role) : "member"}
+                  </div>
+                </div>
+              ))}
+            </div>
+          </div>
+        ) : null}
+      </div>
     </Layout>
   );
 }
diff --git a/apps/admin-ui/pages/guilds/[guildId]/settings.js b/apps/admin-ui/pages/guilds/[guildId]/settings.js
index 87b22db..fa7e155 100644
--- a/apps/admin-ui/pages/guilds/[guildId]/settings.js
+++ b/apps/admin-ui/pages/guilds/[guildId]/settings.js
@@ -49,6 +49,7 @@ export default function GuildSettingsPage(){
                 <label>Sheet ID</label>
                 <input
                   type="text"
+                  className="input"
                   defaultValue={s.sheet_id || ""}
                   onBlur={(e)=> save({ sheet_id: e.target.value })}
                 />
@@ -58,6 +59,7 @@ export default function GuildSettingsPage(){
                 <label>Default Tab (e.g., Baseline (10-24-25))</label>
                 <input
                   type="text"
+                  className="input"
                   defaultValue={s.sheet_tab || ""}
                   onBlur={(e)=> save({ sheet_tab: e.target.value })}
                 />
@@ -66,6 +68,7 @@ export default function GuildSettingsPage(){
               <div className="form-row">
                 <label>Default View</label>
                 <select
+                  className="select"
                   defaultValue={s.view_mode || "baseline"}
                   onChange={(e)=> save({ view_mode: e.target.value })}
                 >
@@ -91,6 +94,7 @@ export default function GuildSettingsPage(){
                   <label>Screenshot Channel ID</label>
                   <input
                     type="text"
+                    className="input"
                     defaultValue={s.screenshot_channel_id || ""}
                     onBlur={(e)=> save({ screenshot_channel_id: e.target.value })}
                     placeholder="Pick from Channels tab or paste ID"
@@ -109,10 +113,10 @@ export default function GuildSettingsPage(){
                 <div className="form-row" style={{ gridColumn: "1 / -1" }}>
                   <label>Notes</label>
                   <textarea
+                    className="textarea"
                     defaultValue={s.notes || ""}
                     onBlur={(e)=> save({ notes: e.target.value })}
                     rows={4}
-                    style={{ width: "100%", padding: ".6rem .7rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,.15)", background: "rgba(0,0,0,.2)", color: "#fff", outline: "none", resize: "vertical" }}
                   />
                 </div>
               </div>
@@ -120,18 +124,6 @@ export default function GuildSettingsPage(){
           </>
         )}
       </div>
-
-      <style jsx>{`
-        .card{ padding:1rem; border:1px solid rgba(255,255,255,.12); border-radius:12px; background:rgba(255,255,255,.02); }
-        .grid{ display:grid; gap:1rem; }
-        @media (max-width: 640px){ .grid.cols-2{ grid-template-columns: 1fr; } }
-        @media (min-width: 641px){ .grid.cols-2{ grid-template-columns: 1fr 1fr; } }
-        .form-row label{ display:block; font-size:.9rem; opacity:.75; margin-bottom:.3rem; }
-        .form-row input, .form-row select{
-          width:100%; padding:.6rem .7rem; border-radius:8px; border:1px solid rgba(255,255,255,.15);
-          background:rgba(0,0,0,.2); color:#fff; outline:none;
-        }
-      `}</style>
     </Layout>
   );
 }
diff --git a/apps/admin-ui/pages/index.js b/apps/admin-ui/pages/index.js
index 8e19312..b9552de 100644
--- a/apps/admin-ui/pages/index.js
+++ b/apps/admin-ui/pages/index.js
@@ -32,84 +32,6 @@ export default function Home() {
       <footer className="hero__footer">
         UI is online on port 3081 behind Caddy.
       </footer>
-
-      <style jsx>{`
-        .hero {
-          display: flex;
-          flex-direction: column;
-          align-items: center;
-          text-align: center;
-          padding: 3.5rem 0 3.25rem;
-          gap: 12px;
-        }
-        .hero__logo {
-          margin-bottom: 0.5rem;
-          filter: drop-shadow(0 6px 18px rgba(80, 200, 255, 0.25));
-        }
-        .hero__title {
-          margin: 0;
-          font-weight: 800;
-          line-height: 1.1;
-          font-size: 2rem;
-          letter-spacing: 0.2px;
-          background: linear-gradient(135deg, #60a5fa, #22c55e);
-          -webkit-background-clip: text;
-          background-clip: text;
-          color: transparent;
-          text-shadow: 0 0 16px rgba(34, 197, 94, 0.08);
-        }
-        .hero__tagline {
-          margin: 0;
-          font-size: 1rem;
-          opacity: 0.9;
-          padding: 0.3rem 0.75rem;
-          border-radius: 10px;
-          background: rgba(15, 23, 42, 0.45);
-          border: 1px solid rgba(255, 255, 255, 0.06);
-          box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
-        }
-        .hero__tagline span {
-          background: linear-gradient(135deg, #a78bfa, #22c55e);
-          -webkit-background-clip: text;
-          background-clip: text;
-          color: transparent;
-          text-shadow: 0 0 10px rgba(167, 139, 250, 0.18);
-          font-weight: 700;
-        }
-        .hero__cta {
-          display: inline-block;
-          padding: 0.75rem 1.25rem;
-          border-radius: 12px;
-          font-weight: 700;
-          text-decoration: none;
-          color: #fff;
-          background: linear-gradient(135deg, #5865f2, #3ba55d);
-          box-shadow: 0 6px 20px rgba(88, 101, 242, 0.35), 0 2px 0 rgba(0, 0, 0, 0.15) inset;
-          transition: transform 120ms ease, box-shadow 200ms ease, filter 200ms ease;
-        }
-        .hero__cta:hover {
-          transform: translateY(-1px);
-          filter: brightness(1.05);
-          box-shadow: 0 10px 26px rgba(88, 101, 242, 0.45), 0 2px 0 rgba(0, 0, 0, 0.18) inset;
-        }
-        .hero__footer {
-          margin-top: 48px;
-          text-align: center;
-          opacity: 0.6;
-          font-size: 8pt;
-        }
-        @media (max-width: 520px) {
-          .hero {
-            padding-top: 2.5rem;
-          }
-          .hero__title {
-            font-size: 1.7rem;
-          }
-          .hero__tagline {
-            font-size: 0.92rem;
-          }
-        }
-      `}</style>
     </Layout>
   );
 }
diff --git a/apps/admin-ui/pages/status.jsx b/apps/admin-ui/pages/status.jsx
index 6674798..58cc784 100644
--- a/apps/admin-ui/pages/status.jsx
+++ b/apps/admin-ui/pages/status.jsx
@@ -71,120 +71,59 @@ export default function StatusPage() {
   }
 
   return (
-    <Layout>
+    <Layout title="Status">
       <Head>
         <title>slimy.ai – Admin Status</title>
       </Head>
-      <div className="wrap">
-        <h1>Admin Status</h1>
-        <p className="muted">
-          Checks the Admin UI → Admin API bridge at <code>/api/admin-api/api/health</code> and{" "}
-          <code>/api/admin-api/api/diag</code>.
-        </p>
-        <div className="kpis">
-          <div className="kpi">
-            <div className="k">Admin API</div>
-            <div className={adminApiOk ? "v ok" : "v bad"}>{adminApiOk ? "OK" : "FAIL"}</div>
+      <div style={{ maxWidth: 980, margin: "0 auto", width: "100%", display: "grid", gap: "1rem" }}>
+        <div className="card" style={{ display: "grid", gap: "0.75rem" }}>
+          <div style={{ opacity: 0.8 }}>
+            Checks the Admin UI → Admin API bridge at{" "}
+            <code>/api/admin-api/api/health</code> and <code>/api/admin-api/api/diag</code>.
           </div>
-          <div className="kpi">
-            <div className="k">Auth</div>
-            <div className={authenticated ? "v ok" : "v"}>{authStatus}</div>
+
+          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
+            <button className="btn" onClick={refresh} disabled={state.loading}>
+              {state.loading ? "Checking…" : "Refresh"}
+            </button>
+            <button className="btn" onClick={handleLogin} disabled={state.loading}>
+              Login
+            </button>
+            {authenticated ? (
+              <button className="btn outline" onClick={handleLogout} disabled={state.loading}>
+                Logout
+              </button>
+            ) : null}
+            {state.error ? (
+              <span style={{ color: "#fca5a5", fontWeight: 700 }}>{state.error}</span>
+            ) : null}
           </div>
         </div>
-        <div className="row">
-          <button className="btn" onClick={refresh} disabled={state.loading}>
-            {state.loading ? "Checking…" : "Refresh"}
-          </button>
-          <button className="btn" onClick={handleLogin} disabled={state.loading}>
-            Login
-          </button>
-          {authenticated ? (
-            <button className="btn" onClick={handleLogout} disabled={state.loading}>
-              Logout
-            </button>
-          ) : null}
-          {state.error ? <span className="err">{state.error}</span> : null}
+
+        <div className="card-grid">
+          <div className="card">
+            <div style={{ fontFamily: "var(--font-pixel)", opacity: 0.8, marginBottom: 6 }}>Admin API</div>
+            <div style={{ fontSize: "1.4rem", fontWeight: 900, color: adminApiOk ? "#86efac" : "#fca5a5" }}>
+              {adminApiOk ? "OK" : "FAIL"}
+            </div>
+          </div>
+          <div className="card">
+            <div style={{ fontFamily: "var(--font-pixel)", opacity: 0.8, marginBottom: 6 }}>Auth</div>
+            <div style={{ fontSize: "1.4rem", fontWeight: 900, color: authenticated ? "#86efac" : "rgba(255,255,255,0.82)" }}>
+              {authStatus}
+            </div>
+          </div>
+        </div>
+
+        <div className="card">
+          <div style={{ fontFamily: "var(--font-pixel)", opacity: 0.8, marginBottom: 10 }}>Raw JSON</div>
+          <pre style={{ margin: 0, overflowX: "auto" }}>
+            {state.health || state.diag
+              ? JSON.stringify({ health: state.health, diag: state.diag }, null, 2)
+              : "No data yet."}
+          </pre>
         </div>
-        <pre className="box">
-          {state.health || state.diag
-            ? JSON.stringify({ health: state.health, diag: state.diag }, null, 2)
-            : "No data yet."}
-        </pre>
       </div>
-      <style jsx>{`
-        .wrap {
-          max-width: 900px;
-          margin: 0 auto;
-          padding: 24px 20px 48px;
-        }
-        h1 {
-          margin: 0 0 8px;
-          font-size: 1.35rem;
-        }
-        .muted {
-          margin: 0 0 16px;
-          opacity: 0.75;
-        }
-        .kpis {
-          display: flex;
-          gap: 12px;
-          margin: 12px 0 14px;
-          flex-wrap: wrap;
-        }
-        .kpi {
-          flex: 0 0 auto;
-          min-width: 160px;
-          padding: 10px 12px;
-          border-radius: 12px;
-          background: rgba(15, 23, 42, 0.25);
-          border: 1px solid rgba(255, 255, 255, 0.08);
-        }
-        .k {
-          font-size: 0.75rem;
-          opacity: 0.7;
-          margin-bottom: 4px;
-        }
-        .v {
-          font-weight: 900;
-        }
-        .v.ok {
-          color: #86efac;
-        }
-        .v.bad {
-          color: #fca5a5;
-        }
-        .row {
-          display: flex;
-          align-items: center;
-          gap: 12px;
-          margin: 12px 0 16px;
-          flex-wrap: wrap;
-        }
-        .btn {
-          padding: 8px 12px;
-          border-radius: 10px;
-          border: 1px solid rgba(255, 255, 255, 0.12);
-          background: rgba(15, 23, 42, 0.45);
-          color: #fff;
-          cursor: pointer;
-          font-weight: 700;
-        }
-        .btn:disabled {
-          opacity: 0.6;
-          cursor: not-allowed;
-        }
-        .err {
-          color: #fca5a5;
-          font-weight: 700;
-        }
-        .box {
-          padding: 14px;
-          border-radius: 12px;
-          background: rgba(15, 23, 42, 0.35);
-          border: 1px solid rgba(255, 255, 255, 0.08);
-          overflow: auto;
-        }
-      `}</style>
     </Layout>
   );
 }
diff --git a/apps/admin-ui/styles/globals.css b/apps/admin-ui/styles/globals.css
index e14b40d..8bc5ce4 100644
--- a/apps/admin-ui/styles/globals.css
+++ b/apps/admin-ui/styles/globals.css
@@ -1,16 +1,24 @@
-@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=VT323&display=swap');
+@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap');
 
 :root {
-  --bg-deep: #0d0720;
-  --bg-panel: #120a2e;
+  --bg-deep: #050010;
+  --bg-nav: #0d001a;
+  --bg-panel: rgba(16, 6, 36, 0.78);
   --neon-pink: #ff5ccf;
   --neon-purple: #b875ff;
   --neon-green: #3dff8c;
   --neon-blue: #4d4dff;
   --glass-border: rgba(255, 255, 255, 0.1);
-  --font-main: 'Space Grotesk', system-ui, -apple-system, sans-serif;
-  --font-pixel: 'VT323', monospace;
+  --font-body: 'VT323', monospace;
+  --font-display: 'Press Start 2P', monospace;
+  --font-main: var(--font-body);
+  --font-pixel: var(--font-body);
   --ease-elastic: cubic-bezier(0.175, 0.885, 0.32, 1.275);
+  --topbar-height: 70px;
+  --marquee-height: 28px;
+  --header-height: calc(var(--topbar-height) + var(--marquee-height));
+  --grid-size: 44px;
+  --grid-line: rgba(184, 117, 255, 0.18);
   color-scheme: dark;
 }
 
@@ -23,11 +31,12 @@ body {
   min-height: 100vh;
   background-color: var(--bg-deep);
   background-image:
-    radial-gradient(circle at 20% 30%, rgba(255, 92, 207, 0.08), transparent 25%),
-    radial-gradient(circle at 80% 20%, rgba(61, 255, 140, 0.08), transparent 22%),
-    radial-gradient(circle at 50% 70%, rgba(77, 77, 255, 0.08), transparent 20%);
+    linear-gradient(to right, var(--grid-line) 1px, transparent 1px),
+    linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px);
+  background-size: var(--grid-size) var(--grid-size);
   color: #fff;
   font-family: var(--font-main);
+  font-size: 18px;
 }
 
 a {
@@ -57,23 +66,98 @@ nav.sticky-nav {
   top: 0;
   left: 0;
   width: 100%;
-  height: 70px;
-  background: rgba(13, 7, 32, 0.9);
+  height: var(--topbar-height);
+  background: var(--bg-nav);
   border-bottom: 1px solid var(--glass-border);
   display: flex;
   align-items: center;
   justify-content: space-between;
   padding: 0 20px;
   z-index: 1100;
-  backdrop-filter: blur(12px);
+}
+
+.top-marquee {
+  position: fixed;
+  top: var(--topbar-height);
+  left: 0;
+  right: 0;
+  height: var(--marquee-height);
+  background: var(--bg-nav);
+  border-bottom: 1px solid var(--glass-border);
+  z-index: 1090;
+  overflow: hidden;
+}
+
+.top-marquee__inner {
+  display: inline-flex;
+  align-items: center;
+  gap: 24px;
+  white-space: nowrap;
+  will-change: transform;
+  animation: marquee-scroll 28s linear infinite;
+  padding-left: 100%;
+  font-family: var(--font-display);
+  font-size: 10px;
+  letter-spacing: 0.6px;
+  opacity: 0.9;
+}
+
+.top-marquee__inner span {
+  color: var(--neon-green);
+}
+
+@keyframes marquee-scroll {
+  0% {
+    transform: translateX(0);
+  }
+  100% {
+    transform: translateX(-100%);
+  }
+}
+
+.slime-drips {
+  position: fixed;
+  top: var(--header-height);
+  left: 0;
+  right: 0;
+  height: 64px;
+  pointer-events: none;
+  z-index: 8;
+  background: linear-gradient(to bottom, rgba(61, 255, 140, 0.12), transparent);
+  opacity: 0.55;
+  clip-path: polygon(
+    0% 0%,
+    100% 0%,
+    100% 45%,
+    96% 55%,
+    92% 40%,
+    88% 62%,
+    84% 48%,
+    78% 72%,
+    74% 50%,
+    68% 70%,
+    62% 44%,
+    56% 68%,
+    50% 46%,
+    44% 74%,
+    38% 50%,
+    32% 70%,
+    26% 46%,
+    20% 66%,
+    14% 44%,
+    8% 58%,
+    4% 40%,
+    0% 52%
+  );
 }
 
 .nav-left {
   display: flex;
   align-items: center;
   gap: 12px;
-  font-family: var(--font-pixel);
-  font-size: 1.2rem;
+  font-family: var(--font-display);
+  font-size: 12px;
+  letter-spacing: 0.6px;
 }
 
 .nav-links {
@@ -105,14 +189,15 @@ nav.sticky-nav {
 .badge {
   padding: 6px 10px;
   border-radius: 8px;
-  background: rgba(77, 77, 255, 0.2);
-  color: #d6d9ff;
-  font-size: 0.8rem;
-  font-family: var(--font-pixel);
+  background: rgba(184, 117, 255, 0.18);
+  color: rgba(255, 255, 255, 0.9);
+  font-size: 12px;
+  font-family: var(--font-display);
+  letter-spacing: 0.4px;
 }
 
 .dashboard-wrapper {
-  padding-top: 90px;
+  padding-top: calc(var(--header-height) + 22px);
   min-height: 100vh;
 }
 
@@ -126,13 +211,12 @@ nav.sticky-nav {
 }
 
 .panel {
-  background: rgba(18, 10, 46, 0.6);
+  background: var(--bg-panel);
   border: 1px solid var(--glass-border);
   border-radius: 12px;
   padding: 20px;
-  backdrop-filter: blur(10px);
   transition: border-color 0.3s;
-  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45), 0 0 40px rgba(184, 117, 255, 0.15);
+  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45), 0 0 44px rgba(184, 117, 255, 0.18);
 }
 
 .panel:hover {
@@ -140,26 +224,26 @@ nav.sticky-nav {
 }
 
 .panel-header {
-  font-family: var(--font-pixel);
-  font-size: 1.2rem;
+  font-family: var(--font-display);
+  font-size: 12px;
   color: var(--neon-green);
   margin-bottom: 15px;
   border-bottom: 1px solid var(--glass-border);
   padding-bottom: 10px;
+  letter-spacing: 0.6px;
 }
 
 .shell {
   display: grid;
   grid-template-columns: 280px 1fr;
-  min-height: calc(100vh - 70px);
+  min-height: calc(100vh - var(--header-height));
   position: relative;
 }
 
 aside {
-  background: rgba(18, 10, 46, 0.72);
+  background: rgba(16, 6, 36, 0.86);
   border-right: 1px solid var(--glass-border);
   padding: 20px;
-  backdrop-filter: blur(14px);
   z-index: 1010;
 }
 
@@ -195,9 +279,9 @@ aside[data-open="true"] {
   justify-content: space-between;
   padding: 12px 16px;
   border-bottom: 1px solid var(--glass-border);
-  background: rgba(13, 7, 32, 0.9);
+  background: var(--bg-nav);
   position: sticky;
-  top: 70px;
+  top: var(--header-height);
   z-index: 1005;
 }
 
@@ -206,25 +290,35 @@ aside[data-open="true"] {
 }
 
 .btn {
-  background: linear-gradient(135deg, rgba(255, 92, 207, 0.7), rgba(61, 255, 140, 0.8));
-  color: #0b0720;
-  border: 1px solid var(--neon-purple);
-  border-radius: 10px;
+  font-family: var(--font-display);
+  font-size: 11px;
+  letter-spacing: 0.6px;
+  text-transform: uppercase;
+  background: linear-gradient(180deg, rgba(61, 255, 140, 0.92), rgba(61, 255, 140, 0.68));
+  color: #050010;
+  border: 2px solid var(--neon-purple);
+  border-radius: 12px;
   padding: 10px 16px;
   cursor: pointer;
-  font-weight: 700;
-  transition: transform 0.2s var(--ease-elastic), box-shadow 0.2s;
+  transition: transform 0.12s var(--ease-elastic), box-shadow 0.12s, filter 0.12s;
+  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.55), 0 0 22px rgba(184, 117, 255, 0.25);
 }
 
 .btn.outline {
-  background: transparent;
+  background: rgba(13, 0, 26, 0.35);
   color: #fff;
-  border: 1px solid var(--glass-border);
+  border: 2px solid var(--glass-border);
+  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.35);
 }
 
 .btn:hover {
-  transform: translateY(-2px);
-  box-shadow: 0 0 24px rgba(184, 117, 255, 0.35);
+  filter: brightness(1.05);
+  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.55), 0 0 28px rgba(255, 92, 207, 0.22), 0 0 26px rgba(184, 117, 255, 0.24);
+}
+
+.btn:active {
+  transform: translateY(4px);
+  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.55), 0 0 18px rgba(184, 117, 255, 0.18);
 }
 
 .card-grid {
@@ -234,11 +328,11 @@ aside[data-open="true"] {
 }
 
 .card {
-  background: rgba(30, 41, 59, 0.7);
-  border: 1px solid rgba(148, 163, 184, 0.2);
+  background: rgba(16, 6, 36, 0.72);
+  border: 1px solid rgba(184, 117, 255, 0.22);
   border-radius: 12px;
   padding: 20px;
-  box-shadow: 0 10px 40px rgba(15, 23, 42, 0.3);
+  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.42), 0 0 30px rgba(184, 117, 255, 0.1);
 }
 
 .table {
@@ -388,9 +482,9 @@ aside[data-open="true"] {
 
   aside {
     position: fixed;
-    top: 70px;
+    top: var(--header-height);
     left: 0;
-    height: calc(100vh - 70px);
+    height: calc(100vh - var(--header-height));
     width: 260px;
     transition: transform 0.25s var(--ease-elastic), opacity 0.2s;
   }
@@ -431,3 +525,205 @@ aside[data-open="true"] {
     display: inline-flex;
   }
 }
+
+/* ---- Typography ---- */
+h1, h2, h3, h4 {
+  font-family: var(--font-display);
+  letter-spacing: 0.6px;
+}
+
+code, pre, .mono {
+  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
+}
+
+/* ---- Landing hero (index) ---- */
+.hero {
+  display: flex;
+  flex-direction: column;
+  align-items: center;
+  text-align: center;
+  padding: 2.75rem 0 2.5rem;
+  gap: 12px;
+}
+
+.hero__logo {
+  margin-bottom: 0.5rem;
+  filter: drop-shadow(0 8px 22px rgba(184, 117, 255, 0.22));
+}
+
+.hero__title {
+  margin: 0;
+  font-weight: 400;
+  line-height: 1.25;
+  font-size: 1.35rem;
+  color: var(--neon-green);
+  text-shadow: 0 0 18px rgba(61, 255, 140, 0.18);
+}
+
+.hero__tagline {
+  margin: 0;
+  font-size: 1.1rem;
+  opacity: 0.9;
+  padding: 0.4rem 0.9rem;
+  border-radius: 12px;
+  background: rgba(13, 0, 26, 0.45);
+  border: 1px solid rgba(184, 117, 255, 0.22);
+}
+
+.hero__tagline span {
+  color: var(--neon-pink);
+}
+
+.hero__cta {
+  display: inline-block;
+  padding: 12px 18px;
+  border-radius: 12px;
+  font-family: var(--font-display);
+  font-size: 11px;
+  letter-spacing: 0.6px;
+  text-transform: uppercase;
+  color: #050010;
+  background: linear-gradient(180deg, rgba(255, 92, 207, 0.9), rgba(255, 92, 207, 0.65));
+  border: 2px solid var(--neon-purple);
+  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.55), 0 0 24px rgba(255, 92, 207, 0.22);
+  transition: transform 0.12s var(--ease-elastic), box-shadow 0.12s, filter 0.12s;
+}
+
+.hero__cta:hover {
+  filter: brightness(1.05);
+  box-shadow: 0 6px 0 rgba(0, 0, 0, 0.55), 0 0 28px rgba(255, 92, 207, 0.28), 0 0 26px rgba(184, 117, 255, 0.22);
+}
+
+.hero__cta:active {
+  transform: translateY(4px);
+  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.55), 0 0 18px rgba(255, 92, 207, 0.18);
+}
+
+.hero__footer {
+  margin-top: 40px;
+  text-align: center;
+  opacity: 0.75;
+  font-size: 12px;
+}
+
+/* ---- Shared page helpers (for pages that used <style jsx>) ---- */
+.wrap {
+  max-width: 980px;
+  margin: 0 auto;
+  padding: 18px 16px 38px;
+}
+
+.muted {
+  opacity: 0.8;
+  margin: 0 0 14px;
+}
+
+.row {
+  display: flex;
+  align-items: center;
+  gap: 12px;
+  margin: 12px 0 16px;
+  flex-wrap: wrap;
+}
+
+.err {
+  color: #fca5a5;
+  font-weight: 700;
+}
+
+.box {
+  padding: 14px;
+  border-radius: 12px;
+  background: rgba(13, 0, 26, 0.45);
+  border: 1px solid rgba(184, 117, 255, 0.22);
+  overflow: auto;
+}
+
+.list {
+  display: grid;
+  gap: 12px;
+  margin-bottom: 16px;
+}
+
+.item {
+  padding: 12px;
+  border-radius: 12px;
+  background: rgba(13, 0, 26, 0.35);
+  border: 1px solid rgba(184, 117, 255, 0.18);
+}
+
+.idx {
+  font-size: 12px;
+  opacity: 0.75;
+  margin-bottom: 6px;
+  font-family: var(--font-display);
+  letter-spacing: 0.4px;
+}
+
+.pre {
+  margin: 0;
+  overflow: auto;
+}
+
+.callout {
+  padding: 10px 12px;
+  border-radius: 12px;
+  margin: 12px 0 16px;
+  border: 1px solid rgba(255, 255, 255, 0.14);
+  background: rgba(255, 92, 207, 0.12);
+}
+
+.table-grid {
+  display: grid;
+  gap: 8px;
+  margin-bottom: 16px;
+}
+
+.thead,
+.trow {
+  display: grid;
+  grid-template-columns: 1.3fr 1.4fr 0.6fr 1fr;
+  gap: 10px;
+  align-items: center;
+}
+
+.thead {
+  opacity: 0.8;
+  font-family: var(--font-display);
+  font-size: 11px;
+  letter-spacing: 0.4px;
+}
+
+.trow {
+  padding: 10px 12px;
+  border-radius: 12px;
+  background: rgba(13, 0, 26, 0.35);
+  border: 1px solid rgba(184, 117, 255, 0.18);
+}
+
+/* ---- Settings page helpers ---- */
+.grid {
+  display: grid;
+  gap: 1rem;
+}
+
+@media (max-width: 640px) {
+  .grid.cols-2 {
+    grid-template-columns: 1fr;
+  }
+}
+
+@media (min-width: 641px) {
+  .grid.cols-2 {
+    grid-template-columns: 1fr 1fr;
+  }
+}
+
+.form-row label {
+  display: block;
+  font-size: 0.95rem;
+  opacity: 0.85;
+  margin-bottom: 0.35rem;
+  font-family: var(--font-display);
+  letter-spacing: 0.4px;
+}
diff --git a/docs/docker-setup.md b/docs/docker-setup.md
index a5d408c..4935750 100644
--- a/docs/docker-setup.md
+++ b/docs/docker-setup.md
@@ -266,16 +266,15 @@ docker compose exec db mysql -u slimyai -pslimypassword slimyai
 The admin-api service automatically generates the Prisma client during build. To run migrations:
 
 ```bash
-# Access the admin-api container
-docker compose exec admin-api sh
-
-# Inside the container, run migrations
-npx prisma migrate deploy
+# Recommended (idempotent): run migrations via helper script
+bash scripts/dev/migrate-admin-api-db.sh
 
-# Or generate Prisma client
-npx prisma generate
+# Manual (inside container)
+docker compose exec admin-api sh -lc 'cd /app/apps/admin-api && pnpm prisma migrate deploy'
 ```
 
+> Note: `pnpm smoke:docker` now runs this migration step automatically after the DB is healthy.
+
 ### Backup Database
 
 ```bash
diff --git a/pnpm-lock.yaml b/pnpm-lock.yaml
index 72f8f83..3040af5 100644
--- a/pnpm-lock.yaml
+++ b/pnpm-lock.yaml
@@ -116,6 +116,9 @@ importers:
       sharp:
         specifier: ^0.33.5
         version: 0.33.5
+      socket.io:
+        specifier: ^4.8.1
+        version: 4.8.1
       undici:
         specifier: ^7.16.0
         version: 7.16.0
@@ -2611,6 +2614,9 @@ packages:
   '@types/cookies@0.9.2':
     resolution: {integrity: sha512-1AvkDdZM2dbyFybL4fxpuNCaWyv//0AwsuUk2DWeXyM1/5ZKm6W3z6mQi24RZ4l2ucY+bkSHzbDVpySqPGuV8A==}
 
+  '@types/cors@2.8.19':
+    resolution: {integrity: sha512-mFNylyeyqN93lfe/9CSxOGREz8cpzAhH+E93xJ4xWQf62V8sQ/24reV2nyzUWM6H6Xji+GGHpkbLe7pVoUEskg==}
+
   '@types/debug@4.1.12':
     resolution: {integrity: sha512-vIChWdVG3LG1SMxEvI/AK+FWJthlrqlTu7fbrlywTkkaONwk/UAGaULXRlf8vkzFBLVm0zkMdCquhL5aOjhXPQ==}
 
@@ -3311,6 +3317,10 @@ packages:
   base64-js@1.5.1:
     resolution: {integrity: sha512-AKpaYlHn8t4SVbOHCy+b5+KKgvR4vrsD8vbvrbiQJps7fKDTkjkDry6ji0rUJjC0kzbNePLwzxq8iypo41qeWA==}
 
+  base64id@2.0.0:
+    resolution: {integrity: sha512-lGe34o6EHj9y3Kts9R4ZYs/Gr+6N7MCaMlIFA3F1R2O5/m7K06AxfSeO5530PEERE6/WyEg3lsuyw4GHlPZHog==}
+    engines: {node: ^4.5.0 || >= 5.9}
+
   baseline-browser-mapping@2.9.2:
     resolution: {integrity: sha512-PxSsosKQjI38iXkmb3d0Y32efqyA0uW4s41u4IVBsLlWLhCiYNpH/AfNOVWRqCQBlD8TFJTz6OUWNd4DFJCnmw==}
     hasBin: true
@@ -3923,6 +3933,10 @@ packages:
     resolution: {integrity: sha512-HqD3yTBfnBxIrbnM1DoD6Pcq8NECnh8d4As1Qgh0z5Gg3jRRIqijury0CL3ghu/edArpUYiYqQiDUQBIs4np3Q==}
     engines: {node: '>=10.0.0'}
 
+  engine.io@6.6.4:
+    resolution: {integrity: sha512-ZCkIjSYNDyGn0R6ewHDtXgns/Zre/NT6Agvq1/WobF7JXgFff4SeDroKiCO3fNJreU9YG429Sc81o4w5ok/W5g==}
+    engines: {node: '>=10.2.0'}
+
   enhanced-resolve@5.18.3:
     resolution: {integrity: sha512-d4lC8xfavMeBjzGr2vECC3fsGXziXZQyJxD868h2M/mBI3PwAuODxAkLkq5HYuvrPYcUtiLzsTo8U3PgX3Ocww==}
     engines: {node: '>=10.13.0'}
@@ -6609,6 +6623,9 @@ packages:
     resolution: {integrity: sha512-94hK0Hh8rPqQl2xXc3HsaBoOXKV20MToPkcXvwbISWLEs+64sBq5kFgn2kJDHb1Pry9yrP0dxrCI9RRci7RXKg==}
     engines: {node: '>= 6.0.0', npm: '>= 3.0.0'}
 
+  socket.io-adapter@2.5.5:
+    resolution: {integrity: sha512-eLDQas5dzPgOWCk9GuuJC2lBqItuhKI4uxGgo9aIV7MYbk2h9Q6uULEh8WBzThoI7l+qU9Ast9fVUmkqPP9wYg==}
+
   socket.io-client@4.8.1:
     resolution: {integrity: sha512-hJVXfu3E28NmzGk8o1sHhN3om52tRvwYeidbj7xKy2eIIse5IoKX3USlS6Tqt3BHAtflLIkCQBkzVrEEfWUyYQ==}
     engines: {node: '>=10.0.0'}
@@ -6617,6 +6634,10 @@ packages:
     resolution: {integrity: sha512-/GbIKmo8ioc+NIWIhwdecY0ge+qVBSMdgxGygevmdHj24bsfgtCmcUUcQ5ZzcylGFHsN3k4HB4Cgkl96KVnuew==}
     engines: {node: '>=10.0.0'}
 
+  socket.io@4.8.1:
+    resolution: {integrity: sha512-oZ7iUCxph8WYRHHcjBEc9unw3adt5CmSNlppj/5Q4k2RIrhl8Z5yY2Xr4j9zj0+wzVZ0bxmYoGSzKJnRl6A4yg==}
+    engines: {node: '>=10.2.0'}
+
   socks-proxy-agent@8.0.5:
     resolution: {integrity: sha512-HehCEsotFqbPW9sJ8WVYB6UbmIMv7kUUORIF2Nncq4VQvBfNBLibW9YZR5dlYCSUhwcD628pRllm7n+E+YTzJw==}
     engines: {node: '>= 14'}
@@ -9720,6 +9741,10 @@ snapshots:
       '@types/keygrip': 1.0.6
       '@types/node': 20.19.25
 
+  '@types/cors@2.8.19':
+    dependencies:
+      '@types/node': 20.19.25
+
   '@types/debug@4.1.12':
     dependencies:
       '@types/ms': 2.1.0
@@ -10594,6 +10619,8 @@ snapshots:
 
   base64-js@1.5.1: {}
 
+  base64id@2.0.0: {}
+
   baseline-browser-mapping@2.9.2: {}
 
   basic-auth@2.0.1:
@@ -11210,6 +11237,22 @@ snapshots:
 
   engine.io-parser@5.2.3: {}
 
+  engine.io@6.6.4:
+    dependencies:
+      '@types/cors': 2.8.19
+      '@types/node': 20.19.25
+      accepts: 1.3.8
+      base64id: 2.0.0
+      cookie: 0.7.2
+      cors: 2.8.5
+      debug: 4.3.7
+      engine.io-parser: 5.2.3
+      ws: 8.17.1
+    transitivePeerDependencies:
+      - bufferutil
+      - supports-color
+      - utf-8-validate
+
   enhanced-resolve@5.18.3:
     dependencies:
       graceful-fs: 4.2.11
@@ -15016,6 +15059,15 @@ snapshots:
 
   smart-buffer@4.2.0: {}
 
+  socket.io-adapter@2.5.5:
+    dependencies:
+      debug: 4.3.7
+      ws: 8.17.1
+    transitivePeerDependencies:
+      - bufferutil
+      - supports-color
+      - utf-8-validate
+
   socket.io-client@4.8.1:
     dependencies:
       '@socket.io/component-emitter': 3.1.2
@@ -15034,6 +15086,20 @@ snapshots:
     transitivePeerDependencies:
       - supports-color
 
+  socket.io@4.8.1:
+    dependencies:
+      accepts: 1.3.8
+      base64id: 2.0.0
+      cors: 2.8.5
+      debug: 4.3.7
+      engine.io: 6.6.4
+      socket.io-adapter: 2.5.5
+      socket.io-parser: 4.2.4
+    transitivePeerDependencies:
+      - bufferutil
+      - supports-color
+      - utf-8-validate
+
   socks-proxy-agent@8.0.5:
     dependencies:
       agent-base: 7.1.4
diff --git a/scripts/smoke/docker-smoke.sh b/scripts/smoke/docker-smoke.sh
index 1c3426f..8a1948f 100755
--- a/scripts/smoke/docker-smoke.sh
+++ b/scripts/smoke/docker-smoke.sh
@@ -126,6 +126,10 @@ retry "admin-api /api/health" "curl -fsS http://127.0.0.1:3080/api/health" 60 2
 retry "web /" "curl -fsS http://127.0.0.1:3000/" 60 2
 retry "admin-ui /" "curl -fsS http://127.0.0.1:3001/" 60 2
 
+log ""
+log "Applying admin-api database migrations..."
+bash scripts/dev/migrate-admin-api-db.sh
+
 log ""
 log "Checking admin-ui /dashboard routing..."
 dashboard_url="http://127.0.0.1:3001/dashboard"
@@ -146,6 +150,47 @@ if [[ ! -s /tmp/slimy-dashboard.html ]]; then
 fi
 log "OK: admin-ui /dashboard (HTTP $dashboard_code)"
 
+log ""
+log "Checking admin-ui /dashboard with synthetic auth cookie..."
+synthetic_token="$(docker compose exec -T admin-api node -e 'const jwt=require("jsonwebtoken"); const secret=process.env.JWT_SECRET; const token=jwt.sign({user:{id:"smoke-user",discordId:"smoke-user",username:"SmokeUser",globalName:"Smoke User",avatar:null,role:"admin",guilds:[]}}, secret, {algorithm:"HS256",expiresIn:3600}); process.stdout.write(token);')"
+dashboard_authed_code="$(curl -sS -o /tmp/slimy-dashboard-authed.html -w "%{http_code}" -H "Cookie: slimy_admin_token=${synthetic_token}" "$dashboard_url")"
+if [[ "$dashboard_authed_code" == "500" || "$dashboard_authed_code" == "502" ]]; then
+  log "FAIL: $dashboard_url (authed HTTP $dashboard_authed_code)"
+  cat /tmp/slimy-dashboard-authed.html || true
+  exit 1
+fi
+if [[ "$dashboard_authed_code" != "200" ]]; then
+  log "FAIL: $dashboard_url (expected 200 when authed, got $dashboard_authed_code)"
+  cat /tmp/slimy-dashboard-authed.html || true
+  exit 1
+fi
+if [[ ! -s /tmp/slimy-dashboard-authed.html ]]; then
+  log "FAIL: $dashboard_url (authed empty response body)"
+  exit 1
+fi
+log "OK: admin-ui /dashboard with synthetic auth (HTTP $dashboard_authed_code)"
+
+log ""
+log "Checking admin-ui Socket.IO proxy with synthetic auth cookie..."
+socketio_url="http://127.0.0.1:3001/socket.io/?EIO=4&transport=polling&t=$(date +%s)"
+socketio_code="$(curl -sS -o /tmp/slimy-socketio.txt -w "%{http_code}" -H "Cookie: slimy_admin_token=${synthetic_token}" "$socketio_url")"
+if [[ "$socketio_code" == "500" || "$socketio_code" == "502" || "$socketio_code" == "404" ]]; then
+  log "FAIL: $socketio_url (HTTP $socketio_code)"
+  cat /tmp/slimy-socketio.txt || true
+  exit 1
+fi
+if [[ "$socketio_code" != "200" ]]; then
+  log "FAIL: $socketio_url (expected 200, got $socketio_code)"
+  cat /tmp/slimy-socketio.txt || true
+  exit 1
+fi
+if ! grep -q '"sid"' /tmp/slimy-socketio.txt; then
+  log "FAIL: $socketio_url (missing sid in response)"
+  cat /tmp/slimy-socketio.txt || true
+  exit 1
+fi
+log "OK: admin-ui Socket.IO polling handshake (HTTP $socketio_code)"
+
 retry "admin-ui -> admin-api bridge /api/admin-api/health" "curl -fsS http://127.0.0.1:3001/api/admin-api/health >/dev/null" 60 2
 retry "admin-ui -> admin-api bridge /api/admin-api/diag" "curl -fsS http://127.0.0.1:3001/api/admin-api/diag >/dev/null" 60 2
 retry "admin-ui catch-all /api/admin-api/api/health" "curl -fsS http://127.0.0.1:3001/api/admin-api/api/health >/dev/null" 60 2

## Repro attempts
- Ran `pnpm smoke:docker` to ensure stack up (see output below). Containers rebuilt and healthy.
- CLI-only environment; browser devtools not available. Used curl to probe chat/socket handshake and noted logs.

### pnpm smoke:docker output
```
(passed; stack rebuilt and started)
```

### Curl check for socket.io polling
```
$ curl -i "http://localhost:3001/socket.io/?EIO=4&transport=polling"
HTTP/1.1 200 OK
...
0{"sid":"8UHQyxXFnoZ7S09CAAAB","upgrades":["websocket"],"pingInterval":25000,"pingTimeout":20000,"maxPayload":1000000}
```

### docker compose logs --tail 200 admin-ui
```
$(docker compose logs --tail 200 admin-ui)
```

### docker compose logs --tail 200 admin-api
```
$(docker compose logs --tail 200 admin-api)
```

### docker compose logs --tail 200 admin-ui (captured)


### docker compose logs --tail 200 admin-api (captured)

### docker compose logs --tail 200 admin-ui (captured)
admin-ui-1  |   ▲ Next.js 14.2.5
admin-ui-1  |   - Local:        http://localhost:3000
admin-ui-1  |   - Network:      http://0.0.0.0:3000
admin-ui-1  | 
admin-ui-1  |  ✓ Starting...
admin-ui-1  |  ✓ Ready in 61ms
admin-ui-1  | (node:1) [DEP0060] DeprecationWarning: The `util._extend` API is deprecated. Please use Object.assign() instead.
admin-ui-1  | (Use `node --trace-deprecation ...` to show where the warning was created)
\n### docker compose logs --tail 200 admin-api (captured)
admin-api-1  | [admin-api] Entrypoint file: /app/apps/admin-api/server.js
admin-api-1  | [database] Resolving @prisma/client: /app/apps/admin-api/node_modules/.prisma/client/index.js
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:37.580Z","pid":1,"hostname":"6496d48738d5","service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Configuration validated successfully"}
admin-api-1  | [database] Prisma middleware API unavailable; skipping query instrumentation
admin-api-1  | [database] Connected to MySQL database
admin-api-1  | [INFO 2025-12-13T23:53:37.738Z] [admin-api] Prisma database initialized successfully
admin-api-1  | !!! AUTH LOGIC LOADED v303 (DATA INTEGRITY) !!!
admin-api-1  | [INFO 2025-12-13T23:53:38.463Z] { port: 3080, host: '0.0.0.0' } [admin-api] Listening on http://0.0.0.0:3080
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:42.545Z","pid":1,"hostname":"6496d48738d5","requestId":"68cf28ae-208d-4f38-bfeb-f561bb68f684","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | 127.0.0.1 - - [13/Dec/2025:23:53:42 +0000] "GET /api/health HTTP/1.1" 200 83 "-" "-"
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:42.547Z","pid":1,"hostname":"6496d48738d5","requestId":"68cf28ae-208d-4f38-bfeb-f561bb68f684","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:42.555Z","pid":1,"hostname":"6496d48738d5","requestId":"68cf28ae-208d-4f38-bfeb-f561bb68f684","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":10,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:42.557Z","pid":1,"hostname":"6496d48738d5","requestId":"68cf28ae-208d-4f38-bfeb-f561bb68f684","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":10,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:43.198Z","pid":1,"hostname":"6496d48738d5","requestId":"b2bb2810-18bb-4201-834d-85462e08585b","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"172.18.0.1","service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | 172.18.0.1 - - [13/Dec/2025:23:53:43 +0000] "GET /api/health HTTP/1.1" 200 83 "-" "curl/8.5.0"
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:43.199Z","pid":1,"hostname":"6496d48738d5","requestId":"b2bb2810-18bb-4201-834d-85462e08585b","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"172.18.0.1","service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:43.200Z","pid":1,"hostname":"6496d48738d5","requestId":"b2bb2810-18bb-4201-834d-85462e08585b","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":2,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:43.200Z","pid":1,"hostname":"6496d48738d5","requestId":"b2bb2810-18bb-4201-834d-85462e08585b","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:47.388Z","pid":1,"hostname":"6496d48738d5","requestId":"13969d41-89d2-4d4f-9656-4096a253ac57","method":"GET","path":"/api/auth/me","method":"GET","path":"/api/auth/me","query":{},"ip":"172.18.0.5","service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | 172.18.0.5 - - [13/Dec/2025:23:53:47 +0000] "GET /api/auth/me HTTP/1.1" 401 24 "-" "node"
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:47.388Z","pid":1,"hostname":"6496d48738d5","requestId":"13969d41-89d2-4d4f-9656-4096a253ac57","method":"GET","path":"/api/auth/me","method":"GET","path":"/api/auth/me","query":{},"ip":"172.18.0.5","service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:47.390Z","pid":1,"hostname":"6496d48738d5","requestId":"13969d41-89d2-4d4f-9656-4096a253ac57","method":"GET","path":"/api/auth/me","method":"GET","path":"/me","statusCode":401,"duration":2,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:47.390Z","pid":1,"hostname":"6496d48738d5","requestId":"13969d41-89d2-4d4f-9656-4096a253ac57","method":"GET","path":"/api/auth/me","method":"GET","path":"/me","statusCode":401,"duration":2,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:47.548Z","pid":1,"hostname":"6496d48738d5","requestId":"8f249d8d-fe05-46ca-bb65-53acafa9db2c","method":"GET","path":"/api/auth/me","method":"GET","path":"/api/auth/me","query":{},"ip":"172.18.0.5","service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }
admin-api-1  | [admin-api] readAuth: user hydrated { userId: 'smoke-user' }
admin-api-1  | [auth/me] req.user keys: avatar,guilds,role,id,discordId,username,globalName,sub
admin-api-1  | [auth/me] rawUser keys: avatar,guilds,role,id,discordId,username,globalName,sub
admin-api-1  | [auth/me] Lookup User ID: smoke-user
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:47.549Z","pid":1,"hostname":"6496d48738d5","requestId":"8f249d8d-fe05-46ca-bb65-53acafa9db2c","method":"GET","path":"/api/auth/me","method":"GET","path":"/api/auth/me","query":{},"ip":"172.18.0.5","service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Incoming request"}
admin-api-1  | [auth/me] DB User Found: false
admin-api-1  | [auth/me] Fallback to cookie guilds: 0
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:47.575Z","pid":1,"hostname":"6496d48738d5","requestId":"8f249d8d-fe05-46ca-bb65-53acafa9db2c","method":"GET","path":"/api/auth/me","method":"GET","path":"/me","statusCode":200,"duration":27,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Request completed"}
admin-api-1  | 172.18.0.5 - - [13/Dec/2025:23:53:47 +0000] "GET /api/auth/me HTTP/1.1" 200 167 "-" "node"
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:47.575Z","pid":1,"hostname":"6496d48738d5","requestId":"8f249d8d-fe05-46ca-bb65-53acafa9db2c","method":"GET","path":"/api/auth/me","method":"GET","path":"/me","statusCode":200,"duration":26,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:47.641Z","pid":1,"hostname":"6496d48738d5","requestId":"61ee941e-44f7-4077-ac39-4f2c5c99693e","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"172.18.0.5","service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | 172.18.0.5 - - [13/Dec/2025:23:53:47 +0000] "GET /api/health HTTP/1.1" 200 83 "-" "node"
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:47.642Z","pid":1,"hostname":"6496d48738d5","requestId":"61ee941e-44f7-4077-ac39-4f2c5c99693e","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"172.18.0.5","service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:47.643Z","pid":1,"hostname":"6496d48738d5","requestId":"61ee941e-44f7-4077-ac39-4f2c5c99693e","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:47.643Z","pid":1,"hostname":"6496d48738d5","requestId":"61ee941e-44f7-4077-ac39-4f2c5c99693e","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:47.653Z","pid":1,"hostname":"6496d48738d5","requestId":"33aec9e2-f434-42a8-bea4-0d71f36f5b0b","method":"GET","path":"/api/diag","method":"GET","path":"/api/diag","query":{},"ip":"172.18.0.5","service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | [admin-api] /api/diag called { hasUser: false, userId: null }
admin-api-1  | 172.18.0.5 - - [13/Dec/2025:23:53:47 +0000] "GET /api/diag HTTP/1.1" 200 33 "-" "node"
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:47.654Z","pid":1,"hostname":"6496d48738d5","requestId":"33aec9e2-f434-42a8-bea4-0d71f36f5b0b","method":"GET","path":"/api/diag","method":"GET","path":"/api/diag","query":{},"ip":"172.18.0.5","service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:47.655Z","pid":1,"hostname":"6496d48738d5","requestId":"33aec9e2-f434-42a8-bea4-0d71f36f5b0b","method":"GET","path":"/api/diag","method":"GET","path":"/","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:47.655Z","pid":1,"hostname":"6496d48738d5","requestId":"33aec9e2-f434-42a8-bea4-0d71f36f5b0b","method":"GET","path":"/api/diag","method":"GET","path":"/","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:47.664Z","pid":1,"hostname":"6496d48738d5","requestId":"97ede598-ca29-46ae-a668-c7543b343be7","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"172.18.0.5","service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | 172.18.0.5 - - [13/Dec/2025:23:53:47 +0000] "GET /api/health HTTP/1.1" 200 83 "-" "node"
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:47.664Z","pid":1,"hostname":"6496d48738d5","requestId":"97ede598-ca29-46ae-a668-c7543b343be7","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"172.18.0.5","service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:47.665Z","pid":1,"hostname":"6496d48738d5","requestId":"97ede598-ca29-46ae-a668-c7543b343be7","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:47.665Z","pid":1,"hostname":"6496d48738d5","requestId":"97ede598-ca29-46ae-a668-c7543b343be7","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:47.675Z","pid":1,"hostname":"6496d48738d5","requestId":"1fdb4fe2-ee5a-4584-af49-e81177cd7534","method":"GET","path":"/api/diag","method":"GET","path":"/api/diag","query":{},"ip":"172.18.0.5","service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | [admin-api] /api/diag called { hasUser: false, userId: null }
admin-api-1  | 172.18.0.5 - - [13/Dec/2025:23:53:47 +0000] "GET /api/diag HTTP/1.1" 200 33 "-" "node"
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:47.675Z","pid":1,"hostname":"6496d48738d5","requestId":"1fdb4fe2-ee5a-4584-af49-e81177cd7534","method":"GET","path":"/api/diag","method":"GET","path":"/api/diag","query":{},"ip":"172.18.0.5","service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:47.676Z","pid":1,"hostname":"6496d48738d5","requestId":"1fdb4fe2-ee5a-4584-af49-e81177cd7534","method":"GET","path":"/api/diag","method":"GET","path":"/","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:47.676Z","pid":1,"hostname":"6496d48738d5","requestId":"1fdb4fe2-ee5a-4584-af49-e81177cd7534","method":"GET","path":"/api/diag","method":"GET","path":"/","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:47.686Z","pid":1,"hostname":"6496d48738d5","requestId":"d59971a3-c6ff-46d0-bd9a-5e927b16ab4f","method":"GET","path":"/api/usage","method":"GET","path":"/api/usage","query":{},"ip":"172.18.0.5","service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | 172.18.0.5 - - [13/Dec/2025:23:53:47 +0000] "GET /api/usage HTTP/1.1" 200 96 "-" "node"
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:47.687Z","pid":1,"hostname":"6496d48738d5","requestId":"d59971a3-c6ff-46d0-bd9a-5e927b16ab4f","method":"GET","path":"/api/usage","method":"GET","path":"/api/usage","query":{},"ip":"172.18.0.5","service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:47.688Z","pid":1,"hostname":"6496d48738d5","requestId":"d59971a3-c6ff-46d0-bd9a-5e927b16ab4f","method":"GET","path":"/api/usage","method":"GET","path":"/","statusCode":200,"duration":2,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:47.688Z","pid":1,"hostname":"6496d48738d5","requestId":"d59971a3-c6ff-46d0-bd9a-5e927b16ab4f","method":"GET","path":"/api/usage","method":"GET","path":"/","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:47.697Z","pid":1,"hostname":"6496d48738d5","requestId":"28914d4b-7aa6-4522-88e0-a1c7f067716b","method":"GET","path":"/api/auth/me","method":"GET","path":"/api/auth/me","query":{},"ip":"172.18.0.5","service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | 172.18.0.5 - - [13/Dec/2025:23:53:47 +0000] "GET /api/auth/me HTTP/1.1" 401 24 "-" "node"
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:47.698Z","pid":1,"hostname":"6496d48738d5","requestId":"28914d4b-7aa6-4522-88e0-a1c7f067716b","method":"GET","path":"/api/auth/me","method":"GET","path":"/api/auth/me","query":{},"ip":"172.18.0.5","service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:47.699Z","pid":1,"hostname":"6496d48738d5","requestId":"28914d4b-7aa6-4522-88e0-a1c7f067716b","method":"GET","path":"/api/auth/me","method":"GET","path":"/me","statusCode":401,"duration":2,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:47.699Z","pid":1,"hostname":"6496d48738d5","requestId":"28914d4b-7aa6-4522-88e0-a1c7f067716b","method":"GET","path":"/api/auth/me","method":"GET","path":"/me","statusCode":401,"duration":1,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:47.709Z","pid":1,"hostname":"6496d48738d5","requestId":"de489183-f89e-44f0-8ff3-9c210b2560df","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"172.18.0.5","service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | 172.18.0.5 - - [13/Dec/2025:23:53:47 +0000] "GET /api/health HTTP/1.1" 200 83 "-" "node"
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:47.709Z","pid":1,"hostname":"6496d48738d5","requestId":"de489183-f89e-44f0-8ff3-9c210b2560df","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"172.18.0.5","service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:47.710Z","pid":1,"hostname":"6496d48738d5","requestId":"de489183-f89e-44f0-8ff3-9c210b2560df","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:47.710Z","pid":1,"hostname":"6496d48738d5","requestId":"de489183-f89e-44f0-8ff3-9c210b2560df","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":0,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:47.719Z","pid":1,"hostname":"6496d48738d5","requestId":"f2eac1bd-2f30-48d2-ab6b-7c281c908b91","method":"GET","path":"/api/diag","method":"GET","path":"/api/diag","query":{},"ip":"172.18.0.5","service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | [admin-api] /api/diag called { hasUser: false, userId: null }
admin-api-1  | 172.18.0.5 - - [13/Dec/2025:23:53:47 +0000] "GET /api/diag HTTP/1.1" 200 33 "-" "node"
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:47.720Z","pid":1,"hostname":"6496d48738d5","requestId":"f2eac1bd-2f30-48d2-ab6b-7c281c908b91","method":"GET","path":"/api/diag","method":"GET","path":"/api/diag","query":{},"ip":"172.18.0.5","service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:47.720Z","pid":1,"hostname":"6496d48738d5","requestId":"f2eac1bd-2f30-48d2-ab6b-7c281c908b91","method":"GET","path":"/api/diag","method":"GET","path":"/","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:53:47.720Z","pid":1,"hostname":"6496d48738d5","requestId":"f2eac1bd-2f30-48d2-ab6b-7c281c908b91","method":"GET","path":"/api/diag","method":"GET","path":"/","statusCode":200,"duration":0,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:54:12.662Z","pid":1,"hostname":"6496d48738d5","requestId":"1902150b-73c9-4bcc-a9ce-5f662be3895a","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | 127.0.0.1 - - [13/Dec/2025:23:54:12 +0000] "GET /api/health HTTP/1.1" 200 84 "-" "-"
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:54:12.662Z","pid":1,"hostname":"6496d48738d5","requestId":"1902150b-73c9-4bcc-a9ce-5f662be3895a","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:54:12.663Z","pid":1,"hostname":"6496d48738d5","requestId":"1902150b-73c9-4bcc-a9ce-5f662be3895a","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:54:12.663Z","pid":1,"hostname":"6496d48738d5","requestId":"1902150b-73c9-4bcc-a9ce-5f662be3895a","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:54:42.764Z","pid":1,"hostname":"6496d48738d5","requestId":"f4e83762-9778-463c-ba1e-3c2d12964bb0","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | 127.0.0.1 - - [13/Dec/2025:23:54:42 +0000] "GET /api/health HTTP/1.1" 200 84 "-" "-"
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:54:42.764Z","pid":1,"hostname":"6496d48738d5","requestId":"f4e83762-9778-463c-ba1e-3c2d12964bb0","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:54:42.765Z","pid":1,"hostname":"6496d48738d5","requestId":"f4e83762-9778-463c-ba1e-3c2d12964bb0","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:54:42.765Z","pid":1,"hostname":"6496d48738d5","requestId":"f4e83762-9778-463c-ba1e-3c2d12964bb0","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:55:12.873Z","pid":1,"hostname":"6496d48738d5","requestId":"5feb4359-c0ed-453b-9dc5-6ad8c044af9e","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | 127.0.0.1 - - [13/Dec/2025:23:55:12 +0000] "GET /api/health HTTP/1.1" 200 84 "-" "-"
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:55:12.873Z","pid":1,"hostname":"6496d48738d5","requestId":"5feb4359-c0ed-453b-9dc5-6ad8c044af9e","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:55:12.874Z","pid":1,"hostname":"6496d48738d5","requestId":"5feb4359-c0ed-453b-9dc5-6ad8c044af9e","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:55:12.874Z","pid":1,"hostname":"6496d48738d5","requestId":"5feb4359-c0ed-453b-9dc5-6ad8c044af9e","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:55:42.977Z","pid":1,"hostname":"6496d48738d5","requestId":"15dd45bc-9db3-4a0f-9e31-2f80b899a499","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | 127.0.0.1 - - [13/Dec/2025:23:55:42 +0000] "GET /api/health HTTP/1.1" 200 85 "-" "-"
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:55:42.978Z","pid":1,"hostname":"6496d48738d5","requestId":"15dd45bc-9db3-4a0f-9e31-2f80b899a499","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:55:42.978Z","pid":1,"hostname":"6496d48738d5","requestId":"15dd45bc-9db3-4a0f-9e31-2f80b899a499","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:55:42.978Z","pid":1,"hostname":"6496d48738d5","requestId":"15dd45bc-9db3-4a0f-9e31-2f80b899a499","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":0,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:56:13.082Z","pid":1,"hostname":"6496d48738d5","requestId":"289aee83-18db-4fb3-9d56-d47f8b8eae5c","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | 127.0.0.1 - - [13/Dec/2025:23:56:13 +0000] "GET /api/health HTTP/1.1" 200 85 "-" "-"
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:56:13.082Z","pid":1,"hostname":"6496d48738d5","requestId":"289aee83-18db-4fb3-9d56-d47f8b8eae5c","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:56:13.083Z","pid":1,"hostname":"6496d48738d5","requestId":"289aee83-18db-4fb3-9d56-d47f8b8eae5c","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-13T23:56:13.083Z","pid":1,"hostname":"6496d48738d5","requestId":"289aee83-18db-4fb3-9d56-d47f8b8eae5c","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"6496d48738d5","pid":1,"msg":"Request completed"}
\n### rg admin.slimyai.xyz
apps/admin-api/README.md:35:DISCORD_REDIRECT_URI=https://admin.slimyai.xyz/api/auth/callback
apps/admin-api/README.md:43:COOKIE_DOMAIN=.slimyai.xyz
apps/admin-api/README.md:51:ALLOWED_ORIGIN=https://admin.slimyai.xyz
apps/admin-api/.env.example:38:DISCORD_REDIRECT_URI=https://admin.slimyai.xyz/api/auth/callback
apps/admin-api/.env.example:55:# Examples: .slimyai.xyz (for *.slimyai.xyz), .example.com, localhost
apps/admin-api/.env.example:56:# If not set, defaults to .slimyai.xyz in production, undefined in development
apps/admin-api/.env.example:57:SESSION_COOKIE_DOMAIN=.slimyai.xyz
apps/admin-api/.env.example:58:COOKIE_DOMAIN=.slimyai.xyz
apps/admin-api/.env.example:64:# Examples: https://admin.slimyai.xyz, http://localhost:3000, http://127.0.0.1:3000
apps/admin-api/.env.example:66:CORS_ORIGIN=https://admin.slimyai.xyz
apps/admin-api/admin-api/src/routes/auth.js:12:const REDIRECT_URI  = process.env.DISCORD_REDIRECT_URI || "https://admin.slimyai.xyz/api/auth/callback";
apps/admin-api/admin-api/src/routes/auth.js:19:    domain:(process.env.COOKIE_DOMAIN||".slimyai.xyz"), path:"/",
apps/admin-api/admin-api/src/routes/auth.js:61:    res.clearCookie("oauth_state", { httpOnly:true, secure:true, sameSite:"lax", domain:(process.env.COOKIE_DOMAIN||".slimyai.xyz"), path:"/" });
apps/admin-api/src/config.js:42:      ? "https://slimyai.xyz"
apps/admin-api/admin-api/lib/jwt.js:9:  const domain = process.env.COOKIE_DOMAIN || '.slimyai.xyz'; // or 'admin.slimyai.xyz'
apps/admin-api/admin-api/lib/jwt.js:13:  const domain = process.env.COOKIE_DOMAIN || '.slimyai.xyz';
apps/admin-api/src/lib/config/index.js:137:    "https://admin.slimyai.xyz",
apps/admin-api/src/lib/config/index.js:142:  const DEFAULT_REDIRECT_URI = "https://admin.slimyai.xyz/api/auth/callback";
apps/admin-api/src/lib/config/index.js:158:      cookieDomain: (process.env.COOKIE_DOMAIN || ".slimyai.xyz").trim(),
apps/admin-api/src/lib/config/index.js:167:      cookieDomain: process.env.NODE_ENV === "production" ? (process.env.COOKIE_DOMAIN || ".slimyai.xyz").trim() : undefined,
apps/admin-api/src/routes/auth.js.bak:22:const REDIRECT_URI = env("DISCORD_REDIRECT_URI", "https://admin.slimyai.xyz/api/auth/callback");
apps/admin-api/src/routes/auth.js.bak:31:    domain: process.env.COOKIE_DOMAIN || ".slimyai.xyz",
apps/admin-api/src/routes/auth.js.bak:102:      domain: process.env.COOKIE_DOMAIN || ".slimyai.xyz", path: "/"
apps/admin-api/src/routes/auth.js:364:      (config.ui && config.ui.successRedirect) || "https://slimyai.xyz/dashboard";
\n### rg socket.io
apps/admin-ui/next.config.js:9:  // Socket.IO clients request `/socket.io/…` (note the trailing slash).
apps/admin-ui/next.config.js:39:          source: '/socket.io',
apps/admin-ui/next.config.js:40:          destination: `${backendUrl}/socket.io/`,
apps/admin-ui/next.config.js:43:          source: '/socket.io/',
apps/admin-ui/next.config.js:44:          destination: `${backendUrl}/socket.io/`,
apps/admin-ui/next.config.js:47:          source: '/socket.io/:path*',
apps/admin-ui/next.config.js:48:          destination: `${backendUrl}/socket.io/:path*`,
apps/admin-ui/lib/socket.js:1:import { io } from "socket.io-client";
apps/admin-ui/lib/socket.js:15:    socket = io(baseUrl, {
apps/admin-ui/components/SlimeChatBar.jsx:4:import { io } from "socket.io-client";
apps/admin-ui/components/SlimeChatBar.jsx:54:    const socket = io(socketUrl, {
apps/admin-ui/package.json:16:    "socket.io-client": "^4.8.1",
apps/admin-api/package.json:45:    "socket.io": "^4.8.1",
apps/admin-api/src/socket.js:3:const { Server } = require("socket.io");
\n### rg NEXT_PUBLIC|CHAT|SOCKET|WS
apps/admin-ui/next.config.js:23:    NEXT_PUBLIC_ADMIN_API_BASE:
apps/admin-ui/next.config.js:24:      process.env.NEXT_PUBLIC_ADMIN_API_BASE !== undefined
apps/admin-ui/next.config.js:25:        ? process.env.NEXT_PUBLIC_ADMIN_API_BASE
apps/admin-ui/README.md:9:- **API Base**: Configured via `NEXT_PUBLIC_ADMIN_API_BASE` environment variable
apps/admin-ui/README.md:22:NEXT_PUBLIC_ADMIN_API_BASE="" NODE_ENV=production npm run build
apps/admin-ui/README.md:34:NEXT_PUBLIC_ADMIN_API_BASE=""
apps/admin-ui/README.md:37:NEXT_PUBLIC_BOT_CLIENT_ID=1415387116564910161
apps/admin-ui/README.md:38:NEXT_PUBLIC_BOT_INVITE_SCOPES=bot applications.commands
apps/admin-ui/README.md:39:NEXT_PUBLIC_BOT_PERMISSIONS=274878286848
apps/admin-ui/README.md:61:env NEXT_PUBLIC_ADMIN_API_BASE="" NODE_ENV=production npm run build
apps/admin-ui/README.md:73:The `NEXT_PUBLIC_ADMIN_API_BASE` must be:
apps/admin-ui/README.md:94:1. Check `.env.production` has `NEXT_PUBLIC_ADMIN_API_BASE=""`
apps/admin-ui/Dockerfile:37:ARG NEXT_PUBLIC_ADMIN_API_BASE
apps/admin-ui/Dockerfile:38:ARG NEXT_PUBLIC_ADMIN_API_PUBLIC_URL
apps/admin-ui/Dockerfile:41:ENV NEXT_PUBLIC_ADMIN_API_BASE=$NEXT_PUBLIC_ADMIN_API_BASE
apps/admin-ui/Dockerfile:42:ENV NEXT_PUBLIC_ADMIN_API_PUBLIC_URL=$NEXT_PUBLIC_ADMIN_API_PUBLIC_URL
apps/admin-ui/lib/socket.js:7:  const override = String(process.env.NEXT_PUBLIC_ADMIN_SOCKET_URL || "").trim();
apps/admin-ui/lib/tasks.js:4:  process.env.NEXT_PUBLIC_ADMIN_API_BASE ?? "";
apps/admin-ui/pages/guilds/index.js:36:    clientId: process.env.NEXT_PUBLIC_BOT_CLIENT_ID || "1415387116564910161",
apps/admin-ui/pages/guilds/index.js:37:    scopes: process.env.NEXT_PUBLIC_BOT_INVITE_SCOPES || "bot applications.commands",
apps/admin-ui/pages/guilds/index.js:38:    permissions: process.env.NEXT_PUBLIC_BOT_PERMISSIONS || "274878286848",
apps/admin-ui/lib/api.js:6:const API_BASE = process.env.NEXT_PUBLIC_ADMIN_API_BASE || "";
apps/admin-ui/components/SlimeChatBar.jsx:7:const SOCKET_BASE =
apps/admin-ui/components/SlimeChatBar.jsx:9:    ? String(process.env.NEXT_PUBLIC_ADMIN_SOCKET_URL || "").trim()
apps/admin-ui/components/SlimeChatBar.jsx:51:    const socketUrl = SOCKET_BASE || window.location.origin;
apps/admin-ui/components/Layout.js:178:          <span>WELCOME</span> TO SLIMY.AI ADMIN • <span>/DASHBOARD</span> • <span>/GUILDS</span> • <span>/SNAIL</span> • <span>/CHAT</span> • <span>SLIME MODE</span> •
apps/admin-ui/pages/guilds/[guildId]/usage.js:22:const WINDOWS = [
apps/admin-ui/pages/guilds/[guildId]/usage.js:55:        {WINDOWS.map((option) => (
\n### rg 403|Forbidden|requireGuild|guildAccess|membership|role
apps/admin-api/jest.setup.js:87:  roles: {
apps/admin-api/jest.setup.js:143:          roles: ['member'],
apps/admin-api/jest.setup.js:149:          roles: ['moderator']
apps/admin-api/jest.setup.js:155:          roles: ['member']
apps/admin-api/jest.setup.js:162:          roles: update?.roles || create?.roles || ['owner', 'admin'],
apps/admin-api/jest.setup.js:200:  role: 'member',
apps/admin-api/jest.setup.js:207:  role: 'admin',
apps/admin-api/jest.setup.js:214:  role: 'member',
apps/admin-api/jest.setup.js:221:  role: 'club',
apps/admin-api/jest.setup.js:258:          role: 'member',
apps/admin-api/jest.setup.js:270:          role: 'admin',
apps/admin-api/jest.setup.js:282:          role: 'member',
apps/admin-api/ADMIN_API_DEV.md:173:**403 Forbidden**
apps/admin-api/ADMIN_API_DEV.md:263:| `AuthorizationError` | 403 | Insufficient permissions |
apps/admin-api/README.md:37:# Discord Bot credentials - for checking bot membership
apps/admin-api/README.md:140:  - Auth: requires authentication + guild membership
apps/admin-api/README.md:144:  - Auth: requires authentication + admin role
apps/admin-api/prisma/migrations/20241106000000_init/migration.sql:55:    `roles` JSON NULL,
apps/admin-api/prisma/schema.prisma:97:// Many-to-many relationship between users and guilds with roles
apps/admin-api/prisma/schema.prisma:102:  roles  Json?  // JSON array of role strings
apps/admin-api/prisma/schema.prisma:245:  category    String  // Category (e.g., 'membership', 'performance', 'activity')
apps/admin-api/scripts/sheet-smoke.js:15:function buildCookie(role) {
apps/admin-api/scripts/sheet-smoke.js:16:  const userId = `${role}-sheet-test`;
apps/admin-api/scripts/sheet-smoke.js:18:    guilds: [{ id: TEST_GUILD_ID, name: "Test Guild", role, installed: true }],
apps/admin-api/scripts/sheet-smoke.js:19:    role,
apps/admin-api/scripts/sheet-smoke.js:27:      username: `${role}Tester`,
apps/admin-api/scripts/sheet-smoke.js:28:      globalName: `${role}Tester`,
apps/admin-api/scripts/sheet-smoke.js:29:      role,
apps/admin-api/scripts/sheet-smoke.js:40:  // Test 1: Club role can GET settings
apps/admin-api/scripts/sheet-smoke.js:41:  console.log("\nTest 1: Club role can GET settings");
apps/admin-api/scripts/sheet-smoke.js:51:  if (clubGetRes.status === 403) {
apps/admin-api/scripts/sheet-smoke.js:52:    throw new Error("❌ Club role still getting 403 on GET /settings!");
apps/admin-api/scripts/sheet-smoke.js:57:  console.log("✅ Club role can read settings");
apps/admin-api/scripts/sheet-smoke.js:59:  // Test 2: Club role CANNOT PUT settings
apps/admin-api/scripts/sheet-smoke.js:60:  console.log("\nTest 2: Club role cannot write settings");
apps/admin-api/scripts/sheet-smoke.js:67:  if (clubPutRes.status !== 403) {
apps/admin-api/scripts/sheet-smoke.js:70:  console.log("✅ Club role properly blocked from writing settings");
apps/admin-api/scripts/sheet-smoke.js:72:  // Test 3: Admin role can GET settings
apps/admin-api/scripts/sheet-smoke.js:73:  console.log("\nTest 3: Admin role can GET settings");
apps/admin-api/scripts/sheet-smoke.js:83:  console.log("✅ Admin role can read settings");
apps/admin-api/scripts/sheet-smoke.js:85:  // Test 4: Admin role can PUT settings
apps/admin-api/scripts/sheet-smoke.js:86:  console.log("\nTest 4: Admin role can write settings");
apps/admin-api/scripts/sheet-smoke.js:96:    console.log("✅ Admin role can write settings");
apps/admin-api/MONITORING_README.md:87:Detailed diagnostics including session information (requires admin role).
apps/admin-api/src/socket.js:31:      role: user.role || "member",
apps/admin-api/src/socket.js:32:      color: ROLE_COLORS[user.role] || ROLE_COLORS.member,
apps/admin-api/src/socket.js:72:      socket.isAdmin = socket.user.role === "admin";
apps/admin-api/src/socket.js:76:        role: socket.user.role,
apps/admin-api/src/socket.js:176:                role: "bot",
apps/admin-api/src/socket.js:192:                role: "bot",
apps/admin-api/lib/session-store.js:59:      roles: ug.roles || [],
apps/admin-api/src/services/chat-bot.js:35:        { role: "system", content: MENTION_PROMPT(guildId) },
apps/admin-api/src/services/chat-bot.js:36:        { role: "user", content: text },
apps/admin-api/src/services/token.js:71:function createSessionToken({ user, guilds, role }) {
apps/admin-api/src/services/token.js:78:    role,
apps/admin-api/tests/guilds-connect.test.js:27:      role: "member",
apps/admin-api/tests/guilds-connect.test.js:82:          roles: ["owner", "admin"],
apps/admin-api/tests/guilds-connect.test.js:173:          roles: ["owner", "admin"],
apps/admin-api/ERROR_HANDLING.md:18:- **Authorization Errors (403)**
apps/admin-api/ERROR_HANDLING.md:20:  - `InsufficientRoleError` - Insufficient role
apps/admin-api/tests/role-guards.js:3:describe.skip("role guards (skipped in test shim)", () => {
apps/admin-api/tests/guilds-read.test.js:29:            role: "member",
apps/admin-api/src/middleware/auth.js:73:        role: session.user.role || "member",
apps/admin-api/src/middleware/auth.js:83:            roles: ug.roles || [],
apps/admin-api/src/middleware/auth.js:118:                role: "member",
apps/admin-api/src/middleware/auth.js:128:                role: "admin",
apps/admin-api/src/middleware/auth.js:138:                role: "member",
apps/admin-api/src/middleware/auth.js:155:          role: "member",
apps/admin-api/src/middleware/auth.js:229:function forbidden(res, message = "Insufficient role") {
apps/admin-api/src/middleware/auth.js:230:  return res.status(403).json({
apps/admin-api/src/middleware/auth.js:256:    if (!user.role || !hasRole(user.role, minRole)) {
apps/admin-api/src/middleware/auth.js:275:function requireGuildMember(paramKey = "guildId") {
apps/admin-api/src/middleware/auth.js:291:    if (user.role && hasRole(user.role, "admin")) {
apps/admin-api/src/middleware/auth.js:300:        console.warn("[admin-api] guild membership check failed", {
apps/admin-api/src/middleware/auth.js:323:  requireGuildMember,
apps/admin-api/src/services/guild.service.js:124:          roles: ['owner', 'admin'],
apps/admin-api/src/services/guild.service.js:129:          roles: ['owner', 'admin'],
apps/admin-api/src/services/guild.service.js:348:  async addMember(guildId, userId, roles = []) {
apps/admin-api/src/services/guild.service.js:349:    // Validate roles
apps/admin-api/src/services/guild.service.js:350:    if (!Array.isArray(roles)) {
apps/admin-api/src/services/guild.service.js:371:          roles,
apps/admin-api/src/services/guild.service.js:403:   * Update member roles
apps/admin-api/src/services/guild.service.js:405:  async updateMemberRoles(guildId, userId, roles) {
apps/admin-api/src/services/guild.service.js:406:    if (!Array.isArray(roles)) {
apps/admin-api/src/services/guild.service.js:418:        data: { roles },
apps/admin-api/src/services/guild.service.js:542:      userRoles: ug.roles,
apps/admin-api/src/services/guild.service.js:560:        const result = await this.addMember(guildId, member.userId, member.roles || []);
apps/admin-api/src/services/guild.service.js:574:   * Bulk update member roles
apps/admin-api/src/services/guild.service.js:586:        const result = await this.updateMemberRoles(guildId, update.userId, update.roles);
apps/admin-api/src/services/guild.service.js:629:    // Get user's role in guild
apps/admin-api/src/services/guild.service.js:643:    const userRoles = userGuild.roles || [];
apps/admin-api/src/services/guild.service.js:645:    // Check specific role requirement
apps/admin-api/src/services/guild.service.js:650:    // Define role hierarchy for actions
apps/admin-api/src/services/guild.service.js:651:    const roleHierarchy = {
apps/admin-api/src/services/guild.service.js:657:    const allowedRoles = roleHierarchy[action];
apps/admin-api/src/services/guild.service.js:662:    return allowedRoles.some(role => userRoles.includes(role));
apps/admin-api/src/services/guild.service.js:709:      roles: userGuild.roles || [],
apps/admin-api/src/config.js:100:  roles: {
apps/admin-api/src/middleware/rbac.js:8:    if (!req.user?.role || !hasRole(req.user.role, minRole)) {
apps/admin-api/src/middleware/rbac.js:9:      return res.status(403).json({ error: "forbidden" });
apps/admin-api/src/middleware/rbac.js:15:async function requireGuildAccess(req, res, next) {
apps/admin-api/src/middleware/rbac.js:33:    console.log(`[requireGuildAccess] Checking access for user ${req.user.id} to guild ${guildId}`);
apps/admin-api/src/middleware/rbac.js:40:      console.warn(`[requireGuildAccess] User ${req.user.id} not found in DB`);
apps/admin-api/src/middleware/rbac.js:41:      return res.status(403).json({ error: "guild-access-denied" });
apps/admin-api/src/middleware/rbac.js:58:      console.warn(`[requireGuildAccess] User ${user.id} is not a member of guild ${guildId}`);
apps/admin-api/src/middleware/rbac.js:59:      return res.status(403).json({ error: "guild-access-denied" });
apps/admin-api/src/middleware/rbac.js:64:    req.userRoles = userGuild.roles || [];
apps/admin-api/src/middleware/rbac.js:67:    console.error("[requireGuildAccess] Database error:", error);
apps/admin-api/src/middleware/rbac.js:74:  requireGuildAccess,
apps/admin-api/src/services/rbac.js:31:  if (config.roles.ownerIds.has(userId)) return "owner";
apps/admin-api/src/services/rbac.js:51:function roleRank(role) {
apps/admin-api/src/services/rbac.js:52:  const index = config.roles.order.indexOf(role);
apps/admin-api/src/services/rbac.js:57:  return roleRank(userRole) >= roleRank(requiredRole);
apps/admin-api/src/services/rbac.js:64:  roleRank,
apps/admin-api/tests/auth/me-context.test.js:17:                role: "member",
apps/admin-api/tests/auth/me-context.test.js:25:        requireGuildMember: () => (req, res, next) => next(),
apps/admin-api/src/middleware/csrf.js:21:    return res.status(403).json({ error: "invalid-csrf-token" });
apps/admin-api/tests/auth/auth-middleware.test.js:1:const { requireAuth, requireRole, requireGuildMember, resolveUser } = require("../../src/middleware/auth");
apps/admin-api/tests/auth/auth-middleware.test.js:50:        role: expect.any(String),
apps/admin-api/tests/auth/auth-middleware.test.js:76:        role: "member",
apps/admin-api/tests/auth/auth-middleware.test.js:120:    test("should call next when user has required role (member)", () => {
apps/admin-api/tests/auth/auth-middleware.test.js:129:    test("should call next when user has higher role than required", () => {
apps/admin-api/tests/auth/auth-middleware.test.js:137:    test("should return 403 when user has insufficient role", () => {
apps/admin-api/tests/auth/auth-middleware.test.js:143:      expect(mockRes.status).toHaveBeenCalledWith(403);
apps/admin-api/tests/auth/auth-middleware.test.js:147:        message: "Insufficient role",
apps/admin-api/tests/auth/auth-middleware.test.js:159:  describe("requireGuildMember", () => {
apps/admin-api/tests/auth/auth-middleware.test.js:160:    const middleware = requireGuildMember("guildId");
apps/admin-api/tests/auth/auth-middleware.test.js:162:    test("should call next for admin user regardless of guild membership", () => {
apps/admin-api/tests/auth/auth-middleware.test.js:180:    test("should return 403 when user is not member of the guild", () => {
apps/admin-api/tests/auth/auth-middleware.test.js:187:      expect(mockRes.status).toHaveBeenCalledWith(403);
apps/admin-api/tests/auth/auth-middleware.test.js:219:      const customMiddleware = requireGuildMember("customGuildId");
apps/admin-api/tests/middleware/rbac.test.js:1:const { requireGuildAccess } = require("../../src/middleware/rbac");
apps/admin-api/tests/middleware/rbac.test.js:6:describe("requireGuildAccess Middleware", () => {
apps/admin-api/tests/middleware/rbac.test.js:36:    await requireGuildAccess(req, res, next);
apps/admin-api/tests/middleware/rbac.test.js:44:    await requireGuildAccess(req, res, next);
apps/admin-api/tests/middleware/rbac.test.js:49:  test("should return 403 if user not found in DB", async () => {
apps/admin-api/tests/middleware/rbac.test.js:53:    await requireGuildAccess(req, res, next);
apps/admin-api/tests/middleware/rbac.test.js:54:    expect(res.status).toHaveBeenCalledWith(403);
apps/admin-api/tests/middleware/rbac.test.js:58:  test("should return 403 if user is not a member of the guild", async () => {
apps/admin-api/tests/middleware/rbac.test.js:63:    await requireGuildAccess(req, res, next);
apps/admin-api/tests/middleware/rbac.test.js:64:    expect(res.status).toHaveBeenCalledWith(403);
apps/admin-api/tests/middleware/rbac.test.js:71:    const mockUserGuild = { guild: mockGuild, roles: ["admin"] };
apps/admin-api/tests/middleware/rbac.test.js:76:    await requireGuildAccess(req, res, next);
apps/admin-api/src/routes/club.js:10:const { requireRole, requireGuildAccess } = require("../middleware/rbac");
apps/admin-api/src/routes/club.js:24:router.get("/latest", requireAuth, requireGuildAccess, async (req, res, next) => {
apps/admin-api/src/routes/club.js:65: * Auth: requires authentication + admin role
apps/admin-api/src/routes/club.js:67:router.post("/rescan", requireAuth, requireGuildAccess, requireRole("admin"), async (req, res, next) => {
apps/admin-api/src/lib/database.js:426:  async addUserToGuild(userId, guildId, roles = []) {
apps/admin-api/src/lib/database.js:436:      update: { roles },
apps/admin-api/src/lib/database.js:440:        roles,
apps/admin-api/src/lib/database.js:519:  async updateUserGuildRoles(userId, guildId, roles) {
apps/admin-api/src/lib/database.js:529:      data: { roles },
apps/admin-api/src/lib/errors.js:48: * Authorization Errors (403)
apps/admin-api/src/lib/errors.js:52:    super("FORBIDDEN", message, 403, details);
apps/admin-api/src/lib/errors.js:57:  constructor(message = "Insufficient role", details = null) {
apps/admin-api/src/lib/errors.js:58:    super("FORBIDDEN", message, 403, details);
apps/admin-api/src/routes/auth.js:235:    // --- SYNC ENGINE: Persist user + guilds + memberships ---
apps/admin-api/src/routes/auth.js:267:      let membershipUpsertsOk = 0;
apps/admin-api/src/routes/auth.js:268:      let membershipUpsertsFailed = 0;
apps/admin-api/src/routes/auth.js:303:        const roles = g?.owner ? ["owner"] : [];
apps/admin-api/src/routes/auth.js:312:            update: { roles },
apps/admin-api/src/routes/auth.js:316:              roles,
apps/admin-api/src/routes/auth.js:319:          membershipUpsertsOk += 1;
apps/admin-api/src/routes/auth.js:321:          membershipUpsertsFailed += 1;
apps/admin-api/src/routes/auth.js:334:        membershipUpsertsOk,
apps/admin-api/src/routes/auth.js:335:        membershipUpsertsFailed,
apps/admin-api/src/routes/auth.js:348:      role: "member",
apps/admin-api/src/routes/auth.js:418:      role: rawUser?.role || "member",
apps/admin-api/src/routes/auth.js:429:        roles: g?.roles,
apps/admin-api/src/routes/auth.js:470:          roles: ug.roles || [],
apps/admin-api/src/routes/auth.js:482:          roles: g?.roles,
apps/admin-api/src/routes/auth.js:494:        roles: g?.roles,
apps/admin-api/src/routes/auth.js:506:      role: baseResponse.role,
apps/admin-api/src/routes/auth.js:522:      role: rawUser?.role || "member",
apps/admin-api/src/lib/queues/database-processor.js:70: * @param {string} data.role - Message role (user/assistant)
apps/admin-api/src/lib/queues/database-processor.js:76:  const { conversationId, userId, role, content, personalityMode } = data;
apps/admin-api/src/lib/queues/database-processor.js:80:    role,
apps/admin-api/src/lib/queues/database-processor.js:93:      role,
apps/admin-api/src/lib/queues/database-processor.js:109:      role,
apps/admin-api/src/lib/queues/database-processor.js:294:      role: msg.role,
apps/admin-api/src/lib/validation/schemas.ts:32:const roleSchema = z.enum(["member", "club", "admin"], {
apps/admin-api/src/lib/validation/schemas.ts:68:    role: z.enum(["user", "assistant"]),
apps/admin-api/src/lib/validation/schemas.ts:198:  roleSchema,
apps/admin-api/src/routes/guilds.js:9:const { requireRole, requireGuildAccess } = require("../middleware/rbac");
apps/admin-api/src/routes/guilds.js:131:      // Calculate user role based on permissions
apps/admin-api/src/routes/guilds.js:138:      // If (permissions & 0x8) === 0x8 (Admin) or (permissions & 0x20) === 0x20 (Manage Guild), role is ADMIN. Else MEMBER.
apps/admin-api/src/routes/guilds.js:142:      // Let's fetch the UserGuild record to get roles/permissions if stored, 
apps/admin-api/src/routes/guilds.js:154:        // Check UserGuild for roles
apps/admin-api/src/routes/guilds.js:157:        // We need to fetch UserGuild directly to check roles.
apps/admin-api/src/routes/guilds.js:158:        // But wait, the prompt says: "When fetching a guild, calculate the user's role based on their Discord Permissions in that guild."
apps/admin-api/src/routes/guilds.js:159:        // We don't store Discord Permissions in UserGuild, we store 'roles' (array of strings like 'admin', 'owner').
apps/admin-api/src/routes/guilds.js:160:        // And in auth.js we map Discord perms to these roles.
apps/admin-api/src/routes/guilds.js:162:        // So we should check if the user has 'admin' or 'owner' role in UserGuild.
apps/admin-api/src/routes/guilds.js:178:  requireGuildAccess,
apps/admin-api/src/routes/guilds.js:193:  requireGuildAccess,
apps/admin-api/src/routes/guilds.js:218:  requireGuildAccess,
apps/admin-api/src/routes/guilds.js:233:  requireGuildAccess,
apps/admin-api/src/routes/guilds.js:258:  requireGuildAccess,
apps/admin-api/src/routes/guilds.js:273:  requireGuildAccess,
apps/admin-api/src/routes/guilds.js:299:  requireGuildAccess,
apps/admin-api/src/routes/guilds.js:316:  requireGuildAccess,
apps/admin-api/src/routes/guilds.js:342:  requireGuildAccess,
apps/admin-api/src/routes/guilds.js:374:  requireGuildAccess,
apps/admin-api/src/routes/guilds.js:413:  requireGuildAccess,
apps/admin-api/src/routes/guilds.js:431:  requireGuildAccess,
apps/admin-api/src/routes/guilds.js:444:  requireGuildAccess,
apps/admin-api/src/routes/guilds.js:475:  requireGuildAccess,
apps/admin-api/src/routes/guilds.js:499:  requireGuildAccess,
apps/admin-api/src/lib/config/index.js:242:    // User role configuration
apps/admin-api/src/lib/config/index.js:243:    roles: {
apps/admin-api/src/lib/queues/chat-processor.js:161:    if (!message.role || !['user', 'assistant'].includes(message.role)) {
apps/admin-api/src/lib/queues/chat-processor.js:162:      throw new Error('Invalid message role');
apps/admin-api/src/lib/validation/schemas.js:32:const roleSchema = z.enum(["member", "club", "admin"], {
apps/admin-api/src/lib/validation/schemas.js:68:    role: z.enum(["user", "assistant"]),
apps/admin-api/src/lib/validation/schemas.js:120:  roles: z.array(z.string().max(50, "Role name too long")).optional().default([]),
apps/admin-api/src/lib/validation/schemas.js:124:  roles: z.array(z.string().max(50, "Role name too long")),
apps/admin-api/src/lib/validation/schemas.js:130:    roles: z.array(z.string().max(50, "Role name too long")).optional().default([]),
apps/admin-api/src/lib/validation/schemas.js:137:    roles: z.array(z.string().max(50, "Role name too long")),
apps/admin-api/src/lib/validation/schemas.js:396:  roleSchema,
apps/admin-api/src/routes/tasks.js:7:const { requireGuildAccess, requireRole } = require("../middleware/rbac");
apps/admin-api/src/routes/tasks.js:23:  requireGuildAccess,
apps/admin-api/src/routes/tasks.js:61:    hasAccess = req.user?.role === "owner";
apps/admin-api/src/routes/tasks.js:68:    return res.status(403).json({ error: "guild-access-denied" });
apps/admin-api/src/routes/debug.js:41:      role: user.role || "member",
apps/admin-api/src/routes/snail.js:12: * All routes require authentication, member role, and guild membership.
apps/admin-api/src/routes/snail.js:28:  requireGuildMember,
apps/admin-api/src/routes/snail.js:94:// All snail routes require authentication, member role, and guild membership
apps/admin-api/src/routes/snail.js:97:router.use(requireGuildMember("guildId"));
apps/admin-api/src/routes/snail.js:104: * Requires: member role, guild membership
apps/admin-api/src/routes/snail.js:180:            role: req.user.role,
apps/admin-api/src/routes/snail.js:220: * Requires: member role, guild membership
apps/admin-api/src/routes/snail.js:301: * Requires: member role, guild membership
apps/admin-api/src/routes/snail.js:324: * Requires: member role, guild membership
apps/admin-api/src/routes/snail.js:353: * Requires: member role, guild membership
apps/admin-api/src/routes/personality.js:3:const { requireRole, requireGuildMember, requireAuth } = require("../middleware/auth");
apps/admin-api/src/routes/personality.js:32:router.get("/:guildId/personality", requireGuildMember("guildId"), cacheGuildData(600, 1200), async (req, res) => {
apps/admin-api/src/routes/personality.js:48:router.put("/:guildId/personality", requireCsrf, requireGuildMember("guildId"), express.json(), personality.update, async (req, res) => {
apps/admin-api/src/routes/personality.js:69:router.post("/:guildId/personality/reset", requireCsrf, requireGuildMember("guildId"), express.json(), personality.reset, async (req, res) => {
apps/admin-api/src/routes/personality.js:93:router.post("/:guildId/personality/test", requireCsrf, requireGuildMember("guildId"), express.json(), personality.test, async (req, res) => {
apps/admin-api/src/routes/personality.js:120:          { role: "system", content: persona.system_prompt },
apps/admin-api/src/routes/personality.js:121:          { role: "user", content: testPrompt }
apps/admin-api/src/routes/guild-settings.js:6:const { requireRole, requireGuildMember } = require("../middleware/auth");
apps/admin-api/src/routes/guild-settings.js:13:// Note: GET operations allow club role, PUT/POST require admin role
apps/admin-api/src/routes/guild-settings.js:76:  requireGuildMember("guildId"),
apps/admin-api/src/routes/guild-settings.js:92:  requireGuildMember("guildId"),
apps/admin-api/src/routes/guild-settings.js:142:  requireGuildMember("guildId"),
apps/admin-api/src/routes/discord.js:77:      console.warn("[discord/guilds] DISCORD_BOT_TOKEN not configured, unable to determine bot membership");
apps/admin-api/src/routes/chat.js:12: * All routes require authentication. Some routes require specific roles.
apps/admin-api/src/routes/chat.js:37: * Requires: member role or higher
apps/admin-api/src/routes/chat.js:109: * Requires: member role or higher, job ownership
apps/admin-api/src/routes/chat.js:124: *   - 403: job_access_denied - User doesn't own this job
apps/admin-api/src/routes/chat.js:148:      res.status(403).json({ error: "job_access_denied" });
apps/admin-api/src/routes/chat.js:202: *   - 403: job_access_denied - User doesn't own this job
apps/admin-api/src/routes/chat.js:226:      res.status(403).json({ error: "job_access_denied" });
apps/admin-api/src/routes/chat.js:261: * Requires: member role or higher, guild membership (unless admin)
apps/admin-api/src/routes/chat.js:274: *   - Admin room (admin-global): Admin role required
apps/admin-api/src/routes/chat.js:282:  const isAdmin = req.user.role === "admin";
apps/admin-api/src/routes/chat.js:286:      res.status(403).json({
apps/admin-api/src/routes/chat.js:296:    const effectiveRole = guildEntry?.role || req.user.role || "member";
apps/admin-api/src/routes/chat.js:302:      res.status(403).json({
apps/admin-api/src/routes/chat.js:304:        hint: "insufficient role to view chat history",
apps/admin-api/src/routes/chat.js:310:      res.status(403).json({
apps/admin-api/src/routes/chat.js:333:      role: msg.user_role,
apps/admin-api/src/routes/chat.js:334:      color: getColorForRole(msg.user_role),
apps/admin-api/src/routes/chat.js:480:    role: msg.role,
apps/admin-api/src/routes/chat.js:593: *     - role: string (required) - "user" or "assistant"
apps/admin-api/src/routes/chat.js:620:      role: message.role,
apps/admin-api/src/routes/chat.js:640: * Get color code for a user role.
apps/admin-api/src/routes/chat.js:643: * @param {string} role - User role (member, club, admin, bot)
apps/admin-api/src/routes/chat.js:646:function getColorForRole(role) {
apps/admin-api/src/routes/chat.js:653:  return colors[role] || colors.member;
\n### rg getUserGuilds|findUserByDiscordId|discordId|user.id
apps/admin-api/prisma/schema.prisma:17:  discordId   String   @unique @map("discord_id")
apps/admin-api/prisma/schema.prisma:45:  @@index([discordId, createdAt])
apps/admin-api/src/socket.js:29:      id: user.id,
apps/admin-api/src/socket.js:68:      const sessionData = await getSession(socket.user.id);
apps/admin-api/src/socket.js:75:        userId: socket.user.id,
apps/admin-api/tests/guilds-read.test.js:51:            discordId: "discord-user-1",
apps/admin-api/tests/guilds-connect.test.js:52:      discordId: "discord-user-1",
apps/admin-api/tests/guilds-connect.test.js:143:      discordId: "discord-user-1",
apps/admin-api/tests/guilds-connect.test.js:194:        where: { discordId: "discord-user-1" },
apps/admin-api/jest.setup.js:105:      discordId: '123',
apps/admin-api/jest.setup.js:113:        create: jest.fn(() => Promise.resolve({ id: 'guild-123', discordId: '123', name: 'Test Guild' })),
apps/admin-api/jest.setup.js:116:          discordId: '123',
apps/admin-api/jest.setup.js:126:        update: jest.fn(() => Promise.resolve({ id: 'guild-123', discordId: '123', name: 'Updated Guild' })),
apps/admin-api/jest.setup.js:183:  getUserGuilds: jest.fn(),
apps/admin-api/jest.setup.js:187:  findUserById: jest.fn(() => Promise.resolve({ id: 'user-123', discordId: '123', username: 'testuser' })),
apps/admin-api/test-database.js:40:    const userGuilds = await database.getUserGuilds(testUser.id);
apps/admin-api/src/services/token.js:74:    sub: user.id,
apps/admin-api/lib/session-store.js:43:    const discordId = String(userId || "").trim();
apps/admin-api/lib/session-store.js:44:    if (!discordId) return null;
apps/admin-api/lib/session-store.js:46:    const user = await database.findUserByDiscordId(discordId);
apps/admin-api/lib/session-store.js:49:    // Fetch user's guilds from the database (expects internal user.id)
apps/admin-api/lib/session-store.js:50:    const userGuilds = await database.getUserGuilds(user.id);
apps/admin-api/lib/session-store.js:58:      id: ug.guild.discordId || ug.guild.id,
apps/admin-api/src/services/guild.service.js:68:        where: { discordId: normalizedUserId },
apps/admin-api/src/services/guild.service.js:76:          discordId: normalizedUserId,
apps/admin-api/src/services/guild.service.js:174:                discordId: true,
apps/admin-api/src/services/guild.service.js:203:   * Get guild by Discord ID (alias for getGuildById since id is now discordId)
apps/admin-api/src/services/guild.service.js:205:  async getGuildByDiscordId(discordId) {
apps/admin-api/src/services/guild.service.js:206:    return this.getGuildById(discordId);
apps/admin-api/src/services/guild.service.js:239:                discordId: true,
apps/admin-api/src/services/guild.service.js:300:                  discordId: true,
apps/admin-api/src/services/guild.service.js:377:              discordId: true,
apps/admin-api/src/services/guild.service.js:386:              discordId: true,
apps/admin-api/src/services/guild.service.js:423:              discordId: true,
apps/admin-api/src/services/guild.service.js:432:              discordId: true,
apps/admin-api/src/services/guild.service.js:496:            discordId: true,
apps/admin-api/src/services/guild.service.js:522:  async getUserGuilds(userId) {
apps/admin-api/src/services/guild.service.js:671:      discordId: guild.id, // id is now the discordId
apps/admin-api/src/services/guild.service.js:693:      authUser?.discordId ||
apps/admin-api/src/services/guild.service.js:704:      userId: userGuild.user.id,
apps/admin-api/src/services/guild.service.js:705:      discordId: userGuild.user.discordId,
apps/admin-api/src/lib/sentry.js:87:        id: req.user.id,
apps/admin-api/src/lib/database.js:231:      where: { discordId: discordUser.id },
apps/admin-api/src/lib/database.js:240:        discordId: discordUser.id,
apps/admin-api/src/lib/database.js:250:  async findUserByDiscordId(discordId) {
apps/admin-api/src/lib/database.js:254:      where: { discordId },
apps/admin-api/src/lib/database.js:322:      where: { discordId: discordGuild.id },
apps/admin-api/src/lib/database.js:327:        discordId: discordGuild.id,
apps/admin-api/src/lib/database.js:333:  async findGuildByDiscordId(discordId) {
apps/admin-api/src/lib/database.js:337:      where: { discordId },
apps/admin-api/src/lib/database.js:385:    const { discordId, name, settings = {} } = guildData;
apps/admin-api/src/lib/database.js:389:        discordId,
apps/admin-api/src/lib/database.js:458:  async getUserGuilds(userId) {
apps/admin-api/src/lib/database.js:492:            discordId: true,
apps/admin-api/src/lib/database.js:666:    const existingUser = await this.findUserByDiscordId(userId);
apps/admin-api/src/lib/database.js:670:          where: { discordId: userId },
apps/admin-api/src/lib/database.js:679:        discordId: userId,
apps/admin-api/src/lib/monitoring/sentry.js:82:        id: req.user.id,
apps/admin-api/src/routes/chat.js:55:  const userId = req.user.id;
apps/admin-api/src/routes/chat.js:129:  const userId = req.user.id;
apps/admin-api/src/routes/chat.js:207:  const userId = req.user.id;
apps/admin-api/src/routes/chat.js:293:    const session = getSession(req.user.id);
apps/admin-api/src/routes/chat.js:366:  const userId = req.user.id;
apps/admin-api/src/routes/chat.js:411:  const userId = req.user.id;
apps/admin-api/src/routes/chat.js:460:  const userId = req.user.id;
apps/admin-api/src/routes/chat.js:517:  const userId = req.user.id;
apps/admin-api/src/routes/chat.js:560:  const userId = req.user.id;
apps/admin-api/src/routes/chat.js:607:  const userId = req.user.id;
apps/admin-api/src/routes/snail.js:158:      const userId = req.user.id;
apps/admin-api/src/routes/snail.js:178:            id: req.user.id,
apps/admin-api/src/routes/snail.js:236:    const userId = req.user.id;
apps/admin-api/src/routes/auth.js:245:        where: { discordId: String(me.id) },
apps/admin-api/src/routes/auth.js:255:          discordId: String(me.id),
apps/admin-api/src/routes/auth.js:331:        userId: dbUser.discordId,
apps/admin-api/src/routes/auth.js:344:      discordId: me.id,
apps/admin-api/src/routes/auth.js:379:  const userId = rawUser?.id || rawUser?.discordId || rawUser?.sub;
apps/admin-api/src/routes/auth.js:414:      discordId: userId,
apps/admin-api/src/routes/auth.js:441:        where: { discordId: String(userId) },
apps/admin-api/src/routes/auth.js:501:      id: dbUser?.discordId || baseResponse.id,
apps/admin-api/src/routes/auth.js:502:      discordId: dbUser?.discordId || baseResponse.discordId,
apps/admin-api/src/routes/auth.js:518:      discordId: userId || null,
apps/admin-api/src/lib/validation/schemas.js:99:  discordId: guildIdSchema,
apps/admin-api/src/routes/debug.js:32:  const sessionData = req.session || getSession(user.id);
apps/admin-api/src/routes/debug.js:38:      id: user.id,
apps/admin-api/src/routes/guilds.js:112:        { ...req.user, id: userId, sub: req.user?.sub || userId, discordId: req.user?.discordId || req.user?.discord_id || userId },
apps/admin-api/src/routes/guilds.js:151:      if (guild.ownerId === req.user.id) {
apps/admin-api/src/routes/guilds.js:155:        const userGuild = await guildService.checkPermission(req.user.id, guildId, 'view_members'); // Just to get the record? No, checkPermission returns boolean.
apps/admin-api/src/routes/guilds.js:163:        const isAdmin = await guildService.checkPermission(req.user.id, guildId, 'manage_guild');
apps/admin-api/src/middleware/cache.js:47:          cacheKey = `${cacheKey}:user_${req.user.id}`;
apps/admin-api/src/middleware/cache.js:115:          cacheKey = `${cacheKey}:user_${req.user.id}`;
apps/admin-api/src/routes/discord.js:28:    const userRecord = await prismaDatabase.findUserByDiscordId(req.user.id);
apps/admin-api/src/middleware/rbac.js:33:    console.log(`[requireGuildAccess] Checking access for user ${req.user.id} to guild ${guildId}`);
apps/admin-api/src/middleware/rbac.js:36:      where: { discordId: req.user.id },
apps/admin-api/src/middleware/rbac.js:40:      console.warn(`[requireGuildAccess] User ${req.user.id} not found in DB`);
apps/admin-api/src/middleware/rbac.js:48:          userId: user.id,
apps/admin-api/src/middleware/rbac.js:58:      console.warn(`[requireGuildAccess] User ${user.id} is not a member of guild ${guildId}`);
apps/admin-api/src/middleware/auth.js:67:        id: session.user.discordId,
apps/admin-api/src/middleware/auth.js:68:        discordId: session.user.discordId,
apps/admin-api/src/middleware/auth.js:79:        const userGuilds = await prismaDatabase.getUserGuilds(session.user.id);
apps/admin-api/src/middleware/auth.js:82:            id: ug.guild.discordId || ug.guild.id,
apps/admin-api/src/middleware/auth.js:86:            userId: req.user.id,
apps/admin-api/src/middleware/auth.js:92:          userId: session.user.discordId,
apps/admin-api/src/middleware/auth.js:102:      logReadAuth("user authenticated via session token", { userId: req.user.id });
apps/admin-api/src/middleware/auth.js:163:          id: fallbackUser.id || fallbackUser.sub || fallbackUser.discordId || null,
apps/admin-api/src/middleware/auth.js:164:          sub: fallbackUser.sub || fallbackUser.id || fallbackUser.discordId || null,
apps/admin-api/src/middleware/auth.js:200:      logReadAuth("user hydrated", { userId: req.user.id });
apps/admin-api/src/middleware/auth.js:301:          userId: user.id,

## Plan notes
- Socket server lives in admin-api (`apps/admin-api/src/socket.js` via `initSocket(server)` in `server.js`), exposed at `/socket.io`.
- Client sometimes targets admin.slimyai.xyz likely from hardcoded default in socket client; will force env-based/same-origin resolution and keep polling fallback through admin-ui rewrite to backend.
- 403s come from `requireGuildMember` in `apps/admin-api/src/middleware/auth.js` (guilds array empty); `resolveUser` does not hydrate guilds from DB session so valid members look unauthorized.
- Target files (planned):
  - apps/admin-api/src/middleware/auth.js (await session + merge guilds, log under debug flag)
  - apps/admin-api/lib/session-store.js (ensure session helper returns guild info without false nulls if needed)
  - apps/admin-ui/lib/socket.js and/or apps/admin-ui/components/SlimeChatBar.jsx (align socket base URL handling to avoid prod host)
  - (If necessary) apps/admin-api/src/socket.js for CORS/origin tweaks.

## Code changes (in progress)
- apps/admin-api/src/middleware/auth.js: await session retrieval when user lacks guilds and merge session guilds into req.user; adds debug logging on failure. Fixes false 403s for guild routes when membership stored in DB but not on JWT payload.
- apps/admin-ui/components/SlimeChatBar.jsx: reuse shared socket client (getSocket) instead of creating a new connection; keeps socket origin consistent/same-origin and avoids disconnecting shared connection. Cleaned up handlers to remove listeners without shutting down socket.

## Verification
- `pnpm -w lint` (pass with existing warnings in apps/web)
- `pnpm smoke:docker` (pass after changes; socket.io polling handshake OK)
\n### docker compose logs --tail 200 admin-ui (post-verify)
admin-ui-1  |   ▲ Next.js 14.2.5
admin-ui-1  |   - Local:        http://localhost:3000
admin-ui-1  |   - Network:      http://0.0.0.0:3000
admin-ui-1  | 
admin-ui-1  |  ✓ Starting...
admin-ui-1  |  ✓ Ready in 60ms
admin-ui-1  | (node:1) [DEP0060] DeprecationWarning: The `util._extend` API is deprecated. Please use Object.assign() instead.
admin-ui-1  | (Use `node --trace-deprecation ...` to show where the warning was created)
\n### docker compose logs --tail 200 admin-api (post-verify)
admin-api-1  | [admin-api] Entrypoint file: /app/apps/admin-api/server.js
admin-api-1  | [database] Resolving @prisma/client: /app/apps/admin-api/node_modules/.prisma/client/index.js
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:26.632Z","pid":1,"hostname":"0ece4285a24a","service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Configuration validated successfully"}
admin-api-1  | [database] Prisma middleware API unavailable; skipping query instrumentation
admin-api-1  | [database] Connected to MySQL database
admin-api-1  | [INFO 2025-12-14T00:13:26.789Z] [admin-api] Prisma database initialized successfully
admin-api-1  | !!! AUTH LOGIC LOADED v303 (DATA INTEGRITY) !!!
admin-api-1  | [INFO 2025-12-14T00:13:27.546Z] { port: 3080, host: '0.0.0.0' } [admin-api] Listening on http://0.0.0.0:3080
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:31.576Z","pid":1,"hostname":"0ece4285a24a","requestId":"1f6951ef-9381-4162-8ae3-6391fd01cf2e","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | 127.0.0.1 - - [14/Dec/2025:00:13:31 +0000] "GET /api/health HTTP/1.1" 200 83 "-" "-"
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:31.579Z","pid":1,"hostname":"0ece4285a24a","requestId":"1f6951ef-9381-4162-8ae3-6391fd01cf2e","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:31.587Z","pid":1,"hostname":"0ece4285a24a","requestId":"1f6951ef-9381-4162-8ae3-6391fd01cf2e","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":11,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:31.588Z","pid":1,"hostname":"0ece4285a24a","requestId":"1f6951ef-9381-4162-8ae3-6391fd01cf2e","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":9,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:32.242Z","pid":1,"hostname":"0ece4285a24a","requestId":"0d9dadd9-9c4a-42f9-9f9c-09cace0d826b","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"172.18.0.1","service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | 172.18.0.1 - - [14/Dec/2025:00:13:32 +0000] "GET /api/health HTTP/1.1" 200 83 "-" "curl/8.5.0"
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:32.242Z","pid":1,"hostname":"0ece4285a24a","requestId":"0d9dadd9-9c4a-42f9-9f9c-09cace0d826b","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"172.18.0.1","service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:32.244Z","pid":1,"hostname":"0ece4285a24a","requestId":"0d9dadd9-9c4a-42f9-9f9c-09cace0d826b","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":2,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:32.244Z","pid":1,"hostname":"0ece4285a24a","requestId":"0d9dadd9-9c4a-42f9-9f9c-09cace0d826b","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":2,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:36.453Z","pid":1,"hostname":"0ece4285a24a","requestId":"02ac8b80-15ba-4ff8-bf3d-9049a4b742a5","method":"GET","path":"/api/auth/me","method":"GET","path":"/api/auth/me","query":{},"ip":"172.18.0.5","service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | 172.18.0.5 - - [14/Dec/2025:00:13:36 +0000] "GET /api/auth/me HTTP/1.1" 401 24 "-" "node"
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:36.453Z","pid":1,"hostname":"0ece4285a24a","requestId":"02ac8b80-15ba-4ff8-bf3d-9049a4b742a5","method":"GET","path":"/api/auth/me","method":"GET","path":"/api/auth/me","query":{},"ip":"172.18.0.5","service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:36.455Z","pid":1,"hostname":"0ece4285a24a","requestId":"02ac8b80-15ba-4ff8-bf3d-9049a4b742a5","method":"GET","path":"/api/auth/me","method":"GET","path":"/me","statusCode":401,"duration":2,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:36.455Z","pid":1,"hostname":"0ece4285a24a","requestId":"02ac8b80-15ba-4ff8-bf3d-9049a4b742a5","method":"GET","path":"/api/auth/me","method":"GET","path":"/me","statusCode":401,"duration":2,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:36.624Z","pid":1,"hostname":"0ece4285a24a","requestId":"0b1bbac1-357b-4d0a-9ff6-7140c8317b98","method":"GET","path":"/api/auth/me","method":"GET","path":"/api/auth/me","query":{},"ip":"172.18.0.5","service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie present { cookieName: 'slimy_admin_token' }
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:36.625Z","pid":1,"hostname":"0ece4285a24a","requestId":"0b1bbac1-357b-4d0a-9ff6-7140c8317b98","method":"GET","path":"/api/auth/me","method":"GET","path":"/api/auth/me","query":{},"ip":"172.18.0.5","service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: user hydrated { userId: 'smoke-user' }
admin-api-1  | [auth/me] req.user keys: avatar,guilds,role,id,discordId,username,globalName,sub
admin-api-1  | [auth/me] rawUser keys: avatar,guilds,role,id,discordId,username,globalName,sub
admin-api-1  | [auth/me] Lookup User ID: smoke-user
admin-api-1  | [auth/me] DB User Found: false
admin-api-1  | [auth/me] Fallback to cookie guilds: 0
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:36.648Z","pid":1,"hostname":"0ece4285a24a","requestId":"0b1bbac1-357b-4d0a-9ff6-7140c8317b98","method":"GET","path":"/api/auth/me","method":"GET","path":"/me","statusCode":200,"duration":24,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Request completed"}
admin-api-1  | 172.18.0.5 - - [14/Dec/2025:00:13:36 +0000] "GET /api/auth/me HTTP/1.1" 200 167 "-" "node"
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:36.648Z","pid":1,"hostname":"0ece4285a24a","requestId":"0b1bbac1-357b-4d0a-9ff6-7140c8317b98","method":"GET","path":"/api/auth/me","method":"GET","path":"/me","statusCode":200,"duration":23,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:36.725Z","pid":1,"hostname":"0ece4285a24a","requestId":"a833160e-76b5-47b8-b8bb-d6d0672afeba","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"172.18.0.5","service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | 172.18.0.5 - - [14/Dec/2025:00:13:36 +0000] "GET /api/health HTTP/1.1" 200 83 "-" "node"
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:36.726Z","pid":1,"hostname":"0ece4285a24a","requestId":"a833160e-76b5-47b8-b8bb-d6d0672afeba","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"172.18.0.5","service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:36.727Z","pid":1,"hostname":"0ece4285a24a","requestId":"a833160e-76b5-47b8-b8bb-d6d0672afeba","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:36.727Z","pid":1,"hostname":"0ece4285a24a","requestId":"a833160e-76b5-47b8-b8bb-d6d0672afeba","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:36.738Z","pid":1,"hostname":"0ece4285a24a","requestId":"58418567-4618-4f03-b738-c6302560e3be","method":"GET","path":"/api/diag","method":"GET","path":"/api/diag","query":{},"ip":"172.18.0.5","service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | [admin-api] /api/diag called { hasUser: false, userId: null }
admin-api-1  | 172.18.0.5 - - [14/Dec/2025:00:13:36 +0000] "GET /api/diag HTTP/1.1" 200 33 "-" "node"
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:36.738Z","pid":1,"hostname":"0ece4285a24a","requestId":"58418567-4618-4f03-b738-c6302560e3be","method":"GET","path":"/api/diag","method":"GET","path":"/api/diag","query":{},"ip":"172.18.0.5","service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:36.739Z","pid":1,"hostname":"0ece4285a24a","requestId":"58418567-4618-4f03-b738-c6302560e3be","method":"GET","path":"/api/diag","method":"GET","path":"/","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:36.739Z","pid":1,"hostname":"0ece4285a24a","requestId":"58418567-4618-4f03-b738-c6302560e3be","method":"GET","path":"/api/diag","method":"GET","path":"/","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:36.748Z","pid":1,"hostname":"0ece4285a24a","requestId":"cbe0db00-40ce-4b78-b16d-1c633ed5db12","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"172.18.0.5","service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | 172.18.0.5 - - [14/Dec/2025:00:13:36 +0000] "GET /api/health HTTP/1.1" 200 83 "-" "node"
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:36.749Z","pid":1,"hostname":"0ece4285a24a","requestId":"cbe0db00-40ce-4b78-b16d-1c633ed5db12","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"172.18.0.5","service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:36.750Z","pid":1,"hostname":"0ece4285a24a","requestId":"cbe0db00-40ce-4b78-b16d-1c633ed5db12","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:36.750Z","pid":1,"hostname":"0ece4285a24a","requestId":"cbe0db00-40ce-4b78-b16d-1c633ed5db12","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:36.760Z","pid":1,"hostname":"0ece4285a24a","requestId":"95a2fc8d-e39e-437b-8e5e-dda95700105e","method":"GET","path":"/api/diag","method":"GET","path":"/api/diag","query":{},"ip":"172.18.0.5","service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | [admin-api] /api/diag called { hasUser: false, userId: null }
admin-api-1  | 172.18.0.5 - - [14/Dec/2025:00:13:36 +0000] "GET /api/diag HTTP/1.1" 200 33 "-" "node"
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:36.760Z","pid":1,"hostname":"0ece4285a24a","requestId":"95a2fc8d-e39e-437b-8e5e-dda95700105e","method":"GET","path":"/api/diag","method":"GET","path":"/api/diag","query":{},"ip":"172.18.0.5","service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:36.761Z","pid":1,"hostname":"0ece4285a24a","requestId":"95a2fc8d-e39e-437b-8e5e-dda95700105e","method":"GET","path":"/api/diag","method":"GET","path":"/","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:36.761Z","pid":1,"hostname":"0ece4285a24a","requestId":"95a2fc8d-e39e-437b-8e5e-dda95700105e","method":"GET","path":"/api/diag","method":"GET","path":"/","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:36.771Z","pid":1,"hostname":"0ece4285a24a","requestId":"329d09dc-5276-4d2e-bd33-b01c715c3cf8","method":"GET","path":"/api/usage","method":"GET","path":"/api/usage","query":{},"ip":"172.18.0.5","service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | 172.18.0.5 - - [14/Dec/2025:00:13:36 +0000] "GET /api/usage HTTP/1.1" 200 96 "-" "node"
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:36.772Z","pid":1,"hostname":"0ece4285a24a","requestId":"329d09dc-5276-4d2e-bd33-b01c715c3cf8","method":"GET","path":"/api/usage","method":"GET","path":"/api/usage","query":{},"ip":"172.18.0.5","service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:36.773Z","pid":1,"hostname":"0ece4285a24a","requestId":"329d09dc-5276-4d2e-bd33-b01c715c3cf8","method":"GET","path":"/api/usage","method":"GET","path":"/","statusCode":200,"duration":2,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:36.773Z","pid":1,"hostname":"0ece4285a24a","requestId":"329d09dc-5276-4d2e-bd33-b01c715c3cf8","method":"GET","path":"/api/usage","method":"GET","path":"/","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:36.782Z","pid":1,"hostname":"0ece4285a24a","requestId":"36f4c470-12a4-463c-a3a3-0bc2f58f1c98","method":"GET","path":"/api/auth/me","method":"GET","path":"/api/auth/me","query":{},"ip":"172.18.0.5","service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | 172.18.0.5 - - [14/Dec/2025:00:13:36 +0000] "GET /api/auth/me HTTP/1.1" 401 24 "-" "node"
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:36.783Z","pid":1,"hostname":"0ece4285a24a","requestId":"36f4c470-12a4-463c-a3a3-0bc2f58f1c98","method":"GET","path":"/api/auth/me","method":"GET","path":"/api/auth/me","query":{},"ip":"172.18.0.5","service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:36.784Z","pid":1,"hostname":"0ece4285a24a","requestId":"36f4c470-12a4-463c-a3a3-0bc2f58f1c98","method":"GET","path":"/api/auth/me","method":"GET","path":"/me","statusCode":401,"duration":2,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:36.784Z","pid":1,"hostname":"0ece4285a24a","requestId":"36f4c470-12a4-463c-a3a3-0bc2f58f1c98","method":"GET","path":"/api/auth/me","method":"GET","path":"/me","statusCode":401,"duration":1,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:36.793Z","pid":1,"hostname":"0ece4285a24a","requestId":"0cde47a5-d346-4eb0-9c28-fab157cb7aef","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"172.18.0.5","service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | 172.18.0.5 - - [14/Dec/2025:00:13:36 +0000] "GET /api/health HTTP/1.1" 200 83 "-" "node"
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:36.794Z","pid":1,"hostname":"0ece4285a24a","requestId":"0cde47a5-d346-4eb0-9c28-fab157cb7aef","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"172.18.0.5","service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:36.795Z","pid":1,"hostname":"0ece4285a24a","requestId":"0cde47a5-d346-4eb0-9c28-fab157cb7aef","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:36.795Z","pid":1,"hostname":"0ece4285a24a","requestId":"0cde47a5-d346-4eb0-9c28-fab157cb7aef","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:36.803Z","pid":1,"hostname":"0ece4285a24a","requestId":"21dcc373-f935-4058-8d3a-d53226bbcf9b","method":"GET","path":"/api/diag","method":"GET","path":"/api/diag","query":{},"ip":"172.18.0.5","service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | [admin-api] /api/diag called { hasUser: false, userId: null }
admin-api-1  | 172.18.0.5 - - [14/Dec/2025:00:13:36 +0000] "GET /api/diag HTTP/1.1" 200 33 "-" "node"
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:36.804Z","pid":1,"hostname":"0ece4285a24a","requestId":"21dcc373-f935-4058-8d3a-d53226bbcf9b","method":"GET","path":"/api/diag","method":"GET","path":"/api/diag","query":{},"ip":"172.18.0.5","service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:36.804Z","pid":1,"hostname":"0ece4285a24a","requestId":"21dcc373-f935-4058-8d3a-d53226bbcf9b","method":"GET","path":"/api/diag","method":"GET","path":"/","statusCode":200,"duration":0,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:13:36.804Z","pid":1,"hostname":"0ece4285a24a","requestId":"21dcc373-f935-4058-8d3a-d53226bbcf9b","method":"GET","path":"/api/diag","method":"GET","path":"/","statusCode":200,"duration":0,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:14:01.690Z","pid":1,"hostname":"0ece4285a24a","requestId":"2af49847-3663-4f30-bdc8-154bd76ed0f3","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Incoming request"}
admin-api-1  | [admin-api] readAuth: cookie missing { cookieName: 'slimy_admin_token' }
admin-api-1  | 127.0.0.1 - - [14/Dec/2025:00:14:01 +0000] "GET /api/health HTTP/1.1" 200 84 "-" "-"
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:14:01.691Z","pid":1,"hostname":"0ece4285a24a","requestId":"2af49847-3663-4f30-bdc8-154bd76ed0f3","method":"GET","path":"/api/health","method":"GET","path":"/api/health","query":{},"ip":"127.0.0.1","service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Incoming request"}
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:14:01.692Z","pid":1,"hostname":"0ece4285a24a","requestId":"2af49847-3663-4f30-bdc8-154bd76ed0f3","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":2,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Request completed"}
admin-api-1  | {"level":"INFO","time":"2025-12-14T00:14:01.692Z","pid":1,"hostname":"0ece4285a24a","requestId":"2af49847-3663-4f30-bdc8-154bd76ed0f3","method":"GET","path":"/api/health","method":"GET","path":"/api/health","statusCode":200,"duration":1,"service":"slimy-admin-api","version":"docker","env":"production","hostname":"0ece4285a24a","pid":1,"msg":"Request completed"}

### Manual checks
- Seeded test user/guild via admin-api container (user discordId 123456789012345678, guild 987654321012345678) and issued signed cookie.
- `curl -i -b "slimy_admin_token=<token>" http://localhost:3080/api/guilds/987654321012345678/snail/codes` -> 200 OK (source: local, empty codes) confirming guild member passes middleware.
- `curl -i -H "Cookie: slimy_admin_token=<token>" http://localhost:3001/socket.io/?EIO=4&transport=polling` -> 200 OK with `sid` (socket handshake works with member token on localhost).
