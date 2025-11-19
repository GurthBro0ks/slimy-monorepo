FROM node:22-slim AS base

ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=${PNPM_HOME}:${PATH}

RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

FROM base AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

# Copy monorepo workspace files
# NOTE: Docker build context must be monorepo root (../..)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY apps/web/prisma ./apps/web/prisma
# Copy other workspace package.json files for dependency resolution (needed for pnpm workspace)
COPY apps/admin-api/package.json ./apps/admin-api/
COPY apps/admin-api/vendor ./apps/admin-api/vendor
COPY apps/admin-ui/package.json ./apps/admin-ui/
COPY apps/bot/package.json ./apps/bot/

# pnpm v10+ requires explicit build script approval (see pnpm-workspace.yaml)
RUN pnpm install --frozen-lockfile --prod=false

FROM base AS builder
WORKDIR /app

# Enable pnpm in this stage
RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY apps/web ./apps/web
COPY packages ./packages
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

ARG NEXT_PUBLIC_ADMIN_API_BASE
ARG NEXT_PUBLIC_SNELP_CODES_URL
ARG NEXT_PUBLIC_PLAUSIBLE_DOMAIN

ENV NEXT_PUBLIC_ADMIN_API_BASE=$NEXT_PUBLIC_ADMIN_API_BASE
ENV NEXT_PUBLIC_SNELP_CODES_URL=$NEXT_PUBLIC_SNELP_CODES_URL
ENV NEXT_PUBLIC_PLAUSIBLE_DOMAIN=$NEXT_PUBLIC_PLAUSIBLE_DOMAIN

# Generate Prisma client and build the web app
RUN pnpm install --frozen-lockfile --prefer-offline 2>&1 | tail -20 || true
# Build the app
RUN pnpm --filter @slimy/web build

FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built artifacts from apps/web in the builder stage
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
