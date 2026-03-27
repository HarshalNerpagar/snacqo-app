#!/bin/bash
set -euo pipefail

APP_DIR="/opt/snacqo-app"
cd "$APP_DIR"

echo "=== Snacqo Deployment ==="

# Pull latest code
echo "Pulling latest frontend..."
git -C frontend pull

echo "Pulling latest backend..."
git -C backend pull

# Build and start containers
echo "Building containers..."
docker compose build --no-cache

echo "Starting containers..."
docker compose up -d

# Wait for backend health
echo "Waiting for backend..."
for i in $(seq 1 30); do
    if docker exec snacqo_backend wget --spider -q http://localhost:3001/ 2>/dev/null; then
        echo "Backend is healthy."
        break
    fi
    if [ "$i" -eq 30 ]; then
        echo "WARNING: Backend health check not passing yet. Check logs with: docker logs snacqo_backend"
    fi
    sleep 2
done

# Reload Caddy to pick up any config changes
echo "Reloading Caddy..."
docker exec carboncraft_caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile

echo "=== Deployment complete ==="
docker compose ps
