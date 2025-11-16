FROM node:22-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.20.0 --activate

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build args for environment variables
ARG NEXT_PUBLIC_ADMIN_API_BASE
ARG NEXT_PUBLIC_SNELP_CODES_URL
ARG NEXT_PUBLIC_PLAUSIBLE_DOMAIN

ENV NEXT_PUBLIC_ADMIN_API_BASE=$NEXT_PUBLIC_ADMIN_API_BASE
ENV NEXT_PUBLIC_SNELP_CODES_URL=$NEXT_PUBLIC_SNELP_CODES_URL
ENV NEXT_PUBLIC_PLAUSIBLE_DOMAIN=$NEXT_PUBLIC_PLAUSIBLE_DOMAIN

RUN pnpm build

# Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
