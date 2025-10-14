#!/bin/bash
set -e
set -o pipefail

SERVER="root@91.98.198.128"
REMOTE_DIR="/opt/redrawn"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

SKIP_BUILD=false
if [ "$1" = "--no-build" ]; then
  SKIP_BUILD=true
fi

echo "🚀 Redrawn Deployment Script"
echo "=================================="
echo ""

cd "$PROJECT_DIR"

if [ "$SKIP_BUILD" = false ]; then
  echo "📦 Building static web files..."
  (cd web && NEXT_PUBLIC_API_URL=https://redrawn.app/api bun run build)
  if [ $? -ne 0 ]; then
    echo "❌ Web build failed!"
    exit 1
  fi
else
  echo "⏭️  Skipping web build (--no-build flag)"
fi

echo ""
echo "📤 Syncing to server..."
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude 'docker-data' \
  --exclude 'api/bin' \
  --exclude 'api/tmp' \
  --exclude '.git' \
  --exclude '.env' \
  --exclude '*.log' \
  --exclude 'backups' \
  "$PROJECT_DIR/" "$SERVER:$REMOTE_DIR/"

echo ""
echo "🐳 Building and restarting containers on server..."
ssh "$SERVER" << 'EOF'
set -e
cd /opt/redrawn
mkdir -p backups
mv docker-compose.prod.yml docker-compose.yml
docker compose up -d --build
docker compose ps
echo ""
echo "💾 Backup status:"
docker compose logs --tail=5 db-backup
EOF

if [ $? -ne 0 ]; then
  echo "❌ Server deployment failed!"
  exit 1
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 View logs with:"
echo "   ssh $SERVER 'cd $REMOTE_DIR && docker compose logs -f'"
echo ""
echo "🌐 Access your site at: https://redrawn.app"

