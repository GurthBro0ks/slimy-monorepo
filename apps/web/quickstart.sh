#!/bin/bash
set -e

echo "=== Slimy Admin API Quickstart ==="
echo ""

# Check if .env.docker exists
if [ ! -f .env.docker ]; then
    echo "Error: .env.docker not found. Creating from admin-api .env..."
    # Copy from admin-api if available
    if [ -f ../app/admin-api/.env.admin.production ]; then
        cp ../app/admin-api/.env.admin.production .env.docker
        # Add web-specific vars
        echo "" >> .env.docker
        echo "# Web App Configuration" >> .env.docker
        echo "NEXT_PUBLIC_ADMIN_API_BASE=http://admin-api:3080" >> .env.docker
        echo "NEXT_PUBLIC_SNELP_CODES_URL=https://snelp.com/api/codes" >> .env.docker
        echo "Created .env.docker from admin-api .env"
    else
        echo "Error: Could not find admin-api .env file"
        exit 1
    fi
fi

# Export variables for docker-compose
export $(grep -v '^#' .env.docker | xargs)

echo "✓ Environment variables loaded"
echo ""

# Check if admin-api dependencies are installed
if [ ! -d ../app/admin-api/node_modules ]; then
    echo "Installing admin-api dependencies..."
    cd ../app/admin-api
    npm install
    cd ../../web
    echo "✓ Dependencies installed"
    echo ""
fi

# Build and start services
echo "Building Docker images..."
docker compose build

echo ""
echo "Starting services..."
docker compose up -d

echo ""
echo "Waiting for services to be healthy..."
sleep 5

# Check admin-api health
echo ""
echo "Checking admin-api health..."
for i in {1..30}; do
    if curl -sf http://localhost:3080/api/health > /dev/null 2>&1; then
        echo "✓ Admin API is healthy"
        curl -s http://localhost:3080/api/health | jq '.' || curl -s http://localhost:3080/api/health
        break
    fi
    if [ $i -eq 30 ]; then
        echo "✗ Admin API health check failed after 30 attempts"
        docker compose logs admin-api | tail -20
        exit 1
    fi
    sleep 2
done

echo ""
echo "Checking web app..."
for i in {1..30}; do
    if curl -sf http://localhost:3001 > /dev/null 2>&1; then
        echo "✓ Web app is responding"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "✗ Web app failed to start"
        docker compose logs web | tail -20
        exit 1
    fi
    sleep 2
done

echo ""
echo "=== Quickstart Complete ==="
echo ""
echo "Services are running:"
echo "  - Admin API: http://localhost:3080"
echo "  - Web App:   http://localhost:3001"
echo ""
echo "Useful commands:"
echo "  docker compose logs -f admin-api  # View admin-api logs"
echo "  docker compose logs -f web        # View web app logs"
echo "  docker compose down               # Stop services"
echo "  docker compose restart            # Restart services"
