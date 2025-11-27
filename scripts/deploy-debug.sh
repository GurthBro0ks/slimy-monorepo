#!/bin/bash

echo "🚀 Deploying Debug Build to NUC2..."

ssh slimy@slimy-nuc2 "cd /opt/slimy/slimy-monorepo && git pull origin main && docker compose -f infra/docker/docker-compose.slimy-nuc2.yml up -d --build slimy-admin-api"

echo "👀 Watching Logs (Press Ctrl+C to stop)..."

ssh slimy@slimy-nuc2 "docker logs -f slimy-admin-api --tail 100"
