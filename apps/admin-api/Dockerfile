FROM node:22-slim

WORKDIR /app

# NOTE: Build context is monorepo root.
# Host node_modules are excluded via .dockerignore to prevent overlay2 conflicts
# (see: https://github.com/moby/buildkit/issues/1666)
COPY apps/admin-api/package*.json ./

RUN npm install --omit=dev

# This COPY excludes node_modules due to .dockerignore patterns
COPY apps/admin-api ./

CMD ["node", "server.js"]
