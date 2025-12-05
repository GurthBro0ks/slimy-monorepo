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
COPY apps/bot/package.json ./apps/bot/
# Copy other workspace package.json files for dependency resolution (needed for pnpm workspace)
COPY apps/admin-api/package.json ./apps/admin-api/
COPY apps/admin-api/vendor ./apps/admin-api/vendor
COPY apps/admin-ui/package.json ./apps/admin-ui/
COPY apps/web/package.json ./apps/web/

# pnpm v10+ requires explicit build script approval (see pnpm-workspace.yaml)
RUN pnpm install --frozen-lockfile --prod=false

FROM base AS builder
WORKDIR /app

# Enable pnpm in this stage
RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY apps/bot ./apps/bot
COPY packages ./packages
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install dependencies and build the bot
RUN pnpm install --frozen-lockfile --prefer-offline 2>&1 | tail -20 || true

# Build the TypeScript bot
RUN pnpm --filter @slimy/bot build

FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 botuser
RUN adduser --system --uid 1001 botuser

# Copy built artifacts from apps/bot in the builder stage
COPY --from=builder --chown=botuser:botuser /app/apps/bot/dist ./dist
COPY --from=builder --chown=botuser:botuser /app/apps/bot/package.json ./package.json

# Copy production node_modules
COPY --from=deps --chown=botuser:botuser /app/node_modules ./node_modules

USER botuser

# Run the bot
CMD ["node", "dist/index.js"]
