# SLIMY.AI ENGINEERING CONSTITUTION

## 1. INFRASTRUCTURE & ARCHITECTURE
- **Root:** \`/opt/slimy/slimy-monorepo\`
- **Frontend:** Next.js 14+ (App Router) in \`apps/web\`.
- **Backend:** Express/Node in \`apps/admin-api\`.
- **Reverse Proxy:** Caddy (\`infra/docker/Caddyfile.slimy-nuc2\`). **CRITICAL:** Next.js routes MUST be whitelisted under \`@web_routes\`.
- **Containerization:** Docker Compose. **CRITICAL:** Changes to Dockerfile or Caddyfile require \`docker compose build --no-cache\`.

## 2. THE "NO-GO" ZONES (STRICT RULES)
1.  **Auth Integrity:** Never use mock users. Always use \`useAuth()\`.
2.  **Aesthetic Consistency:**
    - **Background:** Matrix Rain must use HEX characters (\`0-F\`) and run slowly. NO Fluid gradients.
    - **Nav:** Solid Deep Purple (\`#0d001a\`). NO Transparency.
3.  **Data Persistence:**
    - Use \`apps/web/app/api/...\` routes to talk to Prisma. Do not mock data.

## 3. DEPLOYMENT PROTOCOL
When completing a task, you must verify:
1.  **Caddy Check:** Did you whitelist the new route?
2.  **Docker Check:** Did you rebuild if system deps changed?
