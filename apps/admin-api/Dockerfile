FROM node:22-slim

WORKDIR /app

# NOTE: Build context is now monorepo root
COPY apps/admin-api/package*.json ./

RUN npm install --omit=dev

COPY apps/admin-api ./

CMD ["node", "server.js"]
