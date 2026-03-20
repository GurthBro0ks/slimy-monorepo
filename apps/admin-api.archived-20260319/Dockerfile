# ============================================
# Multi-Stage Dockerfile for admin-api
# ============================================
# This Dockerfile handles monorepo dependencies correctly by:
# 1. Copying workspace files (pnpm-workspace.yaml, pnpm-lock.yaml)
# 2. Including packages/* for workspace dependencies
# 3. Using pnpm to install dependencies with workspace support
# 4. Running prisma generate for database client
# 5. Multi-stage build to minimize final image size
# ============================================

# ============================================
# Stage 1: Base - Setup pnpm and Node.js
# ============================================
FROM node:20-alpine AS base

# Install pnpm globally
RUN npm install -g pnpm@latest

# Set working directory
WORKDIR /app

# ============================================
# Stage 2: Dependencies - Install all deps
# ============================================
FROM base AS deps

# Copy workspace configuration files
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./

# Copy all workspace packages (needed for local dependencies)
COPY packages/ ./packages/

# Copy admin-api package.json and vendor dependencies
COPY apps/admin-api/package.json ./apps/admin-api/
COPY apps/admin-api/vendor/ ./apps/admin-api/vendor/

# Install dependencies using pnpm with workspace support
# Use --frozen-lockfile to ensure reproducible builds
RUN pnpm install --frozen-lockfile --filter @slimy/admin-api...

# ============================================
# Stage 3: Builder - Generate Prisma client
# ============================================
FROM deps AS builder

# Copy the Prisma schema
COPY apps/admin-api/prisma/ ./apps/admin-api/prisma/

# Generate Prisma client
RUN cd apps/admin-api && pnpm prisma:generate

# ============================================
# Stage 4: Runner - Production runtime
# ============================================
FROM node:20-alpine AS runner

# Install pnpm in runner stage
RUN npm install -g pnpm@latest

# Set working directory
WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=production

# Copy workspace files needed for runtime
COPY --from=deps /app/pnpm-workspace.yaml ./
COPY --from=deps /app/package.json ./

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps/admin-api/node_modules ./apps/admin-api/node_modules
COPY --from=deps /app/apps/admin-api/vendor ./apps/admin-api/vendor

# Copy generated Prisma client
COPY --from=builder /app/apps/admin-api/node_modules/.prisma ./apps/admin-api/node_modules/.prisma

# Copy admin-api source code
COPY apps/admin-api/ ./apps/admin-api/
# Explicitly copy source to ensure runtime uses latest JS (avoids stale dist usage)
COPY apps/admin-api/src ./apps/admin-api/src
COPY apps/admin-api/server.js ./apps/admin-api/server.js

# Set working directory to admin-api
WORKDIR /app/apps/admin-api

# Expose the default port (can be overridden with PORT env var)
EXPOSE 3080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "server.js"]
