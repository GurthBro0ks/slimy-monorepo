FROM node:18-alpine

WORKDIR /app

# NOTE: Build context is monorepo root.
# Host node_modules are excluded via .dockerignore to prevent overlay2 conflicts
# (see: https://github.com/moby/buildkit/issues/1666)
COPY apps/admin-api/package*.json ./

RUN npm install

# This COPY excludes node_modules due to .dockerignore patterns
COPY apps/admin-api ./

EXPOSE 3080

CMD ["npm", "start"]
