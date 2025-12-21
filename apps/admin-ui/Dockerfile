FROM node:22-slim AS base
RUN apt-get update -y && apt-get install -y openssl

ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=${PNPM_HOME}:${PATH}

RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

FROM base AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

# Copy monorepo workspace files
# NOTE: Docker build context must be monorepo root (../..)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/admin-ui/package.json ./apps/admin-ui/
# Copy other workspace package.json files for dependency resolution (needed for pnpm workspace)
COPY apps/admin-api/package.json ./apps/admin-api/
COPY apps/admin-api/vendor ./apps/admin-api/vendor
COPY apps/web/package.json ./apps/web/
COPY apps/bot/package.json ./apps/bot/

# pnpm v10+ requires explicit build script approval (see pnpm-workspace.yaml)
RUN pnpm install --frozen-lockfile --prod=false

FROM base AS builder
WORKDIR /app

# Enable pnpm in this stage
RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY apps/admin-ui ./apps/admin-ui
COPY packages ./packages
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

ARG NEXT_PUBLIC_ADMIN_API_BASE
ARG NEXT_PUBLIC_ADMIN_API_PUBLIC_URL
ARG NEXT_PUBLIC_DISCORD_CLIENT_ID
ARG NEXT_PUBLIC_DISCORD_REDIRECT_URI
ARG ADMIN_API_INTERNAL_URL
ARG ALLOW_LOCALHOST_PUBLIC_ENV=0

ENV NEXT_PUBLIC_ADMIN_API_BASE=$NEXT_PUBLIC_ADMIN_API_BASE
ENV NEXT_PUBLIC_ADMIN_API_PUBLIC_URL=$NEXT_PUBLIC_ADMIN_API_PUBLIC_URL
ENV NEXT_PUBLIC_DISCORD_CLIENT_ID=$NEXT_PUBLIC_DISCORD_CLIENT_ID
ENV NEXT_PUBLIC_DISCORD_REDIRECT_URI=$NEXT_PUBLIC_DISCORD_REDIRECT_URI
ENV ADMIN_API_INTERNAL_URL=$ADMIN_API_INTERNAL_URL
ENV ALLOW_LOCALHOST_PUBLIC_ENV=$ALLOW_LOCALHOST_PUBLIC_ENV

# Ensure local env files in the repo don't override build-time args inside Docker.
RUN rm -f .env .env.* apps/admin-ui/.env apps/admin-ui/.env.* || true

# Guardrail: prevent accidentally baking loopback URLs into the public bundle.
RUN node -e "const allow=String(process.env.ALLOW_LOCALHOST_PUBLIC_ENV||'')==='1'; if(allow) process.exit(0); const hits=[]; const needle=/localhost|127\\.0\\.0\\.1|\\[::1\\]|\\b::1\\b/i; for (const [k,v] of Object.entries(process.env)) { if(!k.startsWith('NEXT_PUBLIC_')) continue; const s=String(v||''); if(needle.test(s)) hits.push([k,s]); } if(hits.length){ console.error('[FATAL] Refusing to build: NEXT_PUBLIC_* contains a loopback host'); for (const [k,v] of hits) console.error('- ' + k + '=' + v); process.exit(1); }"

# Install dependencies and build the admin-ui app
RUN pnpm install --frozen-lockfile --prefer-offline 2>&1 | tail -20 || true

# Build the app
RUN pnpm --filter @slimy/admin-ui build

FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built artifacts from apps/admin-ui in the builder stage
# Next.js with monorepo generates nested structure in .next/standalone/apps/admin-ui/
# We need to run the server from that nested location since that's where the symlinks are set up
# Copy public assets (images, etc)
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/public ./apps/admin-ui/public
# Copy standalone server output
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/standalone/apps/admin-ui ./apps/admin-ui/
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/standalone/node_modules ./node_modules
# Copy static assets (css, js chunks) - Critical for styling!
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/static ./apps/admin-ui/.next/static

# FIX: Copy to Root .next/static so the server finds them at /app/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin-ui/public ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run server from the nested location where symlinks are correct
CMD ["node", "apps/admin-ui/server.js"]
