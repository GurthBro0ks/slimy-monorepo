# Epic: Club & Persistence Recovery

## Objectives
1.  **Fix Routing (404):** Add \`/api/club/sheet\` and \`/api/club/analyze\` to \`infra/docker/Caddyfile.slimy-nuc2\`.
2.  **Fix Runtime (500):** Add \`RUN apt-get update && apt-get install -y openssl ca-certificates\` to \`apps/web/Dockerfile\` (Runner Stage).
3.  **Fix Auth (401):** Ensure \`apps/web/app/api/discord/guilds/route.ts\` forwards cookies.
4.  **Verify Logic:** Ensure \`apps/web/app/api/club/sheet/route.ts\` exists.

## Execution Order
1.  **Code:** Edit Dockerfile, Caddyfile, and Routes.
2.  **Build:** Run \`docker compose -f infra/docker/docker-compose.slimy-nuc2.yml -p slimy-nuc2 build --no-cache web\`.
3.  **Deploy:** Run \`docker compose -f infra/docker/docker-compose.slimy-nuc2.yml -p slimy-nuc2 up -d --force-recreate web\` and reload Caddy.

