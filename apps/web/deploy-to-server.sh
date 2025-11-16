#!/bin/bash

# Deployment script for slimyai-web
# Run this on your server to deploy/update the web application

set -e  # Exit on error

echo "🚀 Starting slimyai-web deployment..."

# Configuration
WEB_DIR="/opt/slimy/web"
REPO_URL="https://github.com/GurthBro0ks/slimyai-web.git"
BRANCH="main"
CADDY_CONFIG="/etc/caddy/Caddyfile"
LOG_DIR="/var/log/slimy"

# Create log directory
mkdir -p "$LOG_DIR"

# Step 1: Clone or update repository
echo "📦 Updating repository..."
if [ -d "$WEB_DIR" ]; then
    cd "$WEB_DIR"
    git fetch origin
    git reset --hard origin/$BRANCH
    echo "✅ Repository updated"
else
    mkdir -p "$WEB_DIR"
    git clone -b "$BRANCH" "$REPO_URL" "$WEB_DIR"
    cd "$WEB_DIR"
    echo "✅ Repository cloned"
fi

# Step 2: Check if admin API is running
echo "🔍 Checking admin API status..."
if curl -f http://localhost:3080/api/health > /dev/null 2>&1; then
    echo "✅ Admin API is running on port 3080"
    ADMIN_API_RUNNING=true
else
    echo "⚠️  Admin API is NOT running on port 3080"
    echo "   The login functionality will not work until the admin API is deployed"
    ADMIN_API_RUNNING=false
fi

# Step 3: Update docker-compose.yml
echo "📝 Configuring docker-compose.yml..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: slimyai-web
    ports:
      - "3001:3000"
    environment:
      - NEXT_PUBLIC_ADMIN_API_BASE=https://admin.slimyai.xyz
      - NEXT_PUBLIC_SNELP_CODES_URL=https://snelp.com/api/codes
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
EOF
echo "✅ docker-compose.yml configured"

# Step 4: Update Caddyfile
echo "📝 Updating Caddyfile..."
if [ -f "$CADDY_CONFIG" ]; then
    # Backup existing config
    sudo cp "$CADDY_CONFIG" "$CADDY_CONFIG.backup-$(date +%s)"
    echo "✅ Caddyfile backed up"
fi

# Create new Caddyfile
sudo tee "$CADDY_CONFIG" > /dev/null << 'EOF'
admin.slimyai.xyz {
    # Handle API routes - proxy to admin API backend
    handle_path /api/* {
        reverse_proxy localhost:3080 {
            header_up Host {host}
            header_up X-Real-IP {remote_host}
            header_up X-Forwarded-For {remote_host}
            header_up X-Forwarded-Proto {scheme}
        }
    }

    # Handle all other routes - proxy to Next.js web app
    reverse_proxy localhost:3001 {
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }

    # Security headers
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
        -Server
    }

    # Logging
    log {
        output file /var/log/caddy/admin.slimyai.xyz.log {
            roll_size 10MB
            roll_keep 10
        }
    }

    # Enable compression
    encode gzip zstd
}
EOF

echo "✅ Caddyfile updated"

# Step 5: Reload Caddy
echo "🔄 Reloading Caddy..."
sudo systemctl reload caddy
if [ $? -eq 0 ]; then
    echo "✅ Caddy reloaded successfully"
else
    echo "❌ Failed to reload Caddy"
    exit 1
fi

# Step 6: Build and start Docker container
echo "🐳 Building and starting Docker container..."
docker compose down 2>/dev/null || true
docker compose up -d --build

if [ $? -eq 0 ]; then
    echo "✅ Docker container started successfully"
else
    echo "❌ Failed to start Docker container"
    exit 1
fi

# Step 7: Wait for container to be healthy
echo "⏳ Waiting for container to be healthy..."
sleep 10

# Step 8: Test deployment
echo "🧪 Testing deployment..."

# Test web app
if curl -f http://localhost:3001/ > /dev/null 2>&1; then
    echo "✅ Web app responding on http://localhost:3001"
else
    echo "❌ Web app NOT responding on http://localhost:3001"
    docker compose logs --tail=50
    exit 1
fi

# Test through Caddy
if curl -f https://admin.slimyai.xyz/ > /dev/null 2>&1; then
    echo "✅ Web app responding on https://admin.slimyai.xyz"
else
    echo "❌ Web app NOT responding on https://admin.slimyai.xyz"
    exit 1
fi

# Test API proxy (only if admin API is running)
if [ "$ADMIN_API_RUNNING" = true ]; then
    if curl -f https://admin.slimyai.xyz/api/health > /dev/null 2>&1; then
        echo "✅ API proxy working on https://admin.slimyai.xyz/api/health"
    else
        echo "⚠️  API proxy NOT working (admin API may not be configured correctly)"
    fi
fi

# Step 9: Create systemd service for auto-start
echo "📝 Creating systemd service..."
sudo tee /etc/systemd/system/slimyai-web.service > /dev/null << EOF
[Unit]
Description=Slimy.ai Web Application
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$WEB_DIR
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable slimyai-web.service
echo "✅ Systemd service created and enabled"

# Step 10: Summary
echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "🌐 Website: https://admin.slimyai.xyz"
echo "📊 Status:"
echo "   - Web app: ✅ Running on port 3001"
echo "   - Caddy: ✅ Proxying HTTPS traffic"
if [ "$ADMIN_API_RUNNING" = true ]; then
    echo "   - Admin API: ✅ Running on port 3080"
else
    echo "   - Admin API: ⚠️  NOT running (login will not work)"
fi
echo ""
echo "📝 Logs:"
echo "   - Web app: docker compose logs -f (in $WEB_DIR)"
echo "   - Caddy: sudo tail -f /var/log/caddy/admin.slimyai.xyz.log"
echo "   - Systemd: sudo journalctl -u slimyai-web -f"
echo ""
if [ "$ADMIN_API_RUNNING" = false ]; then
    echo "⚠️  IMPORTANT: Deploy the admin API backend to enable login functionality"
    echo "   The admin API should run on port 3080 and handle /api/* routes"
fi
echo "=========================================="
