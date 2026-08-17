#!/bin/bash
# NetManager Pro - Deploy Script
# Run this script to update the application

set -e

APP_NAME="netmanager"
APP_DIR="/opt/$APP_NAME"

echo "============================================"
echo "  NetManager Pro - Deployment"
echo "============================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "ERROR: Please run as root (sudo ./deploy.sh)"
  exit 1
fi

echo "[1/4] Pulling latest changes..."
cd "$APP_DIR"
if [ -d .git ]; then
  git pull origin main
else
  echo "  Not a git repository. Copying files..."
  cp -r ../* "$APP_DIR/" 2>/dev/null || true
fi

echo "[2/4] Installing dependencies..."
npm install --production=false
cd server
npm install --production
cd ..

echo "[3/4] Building frontend..."
npm run build

echo "[4/4] Restarting application..."
pm2 restart netmanager-api
pm2 save

echo ""
echo "============================================"
echo "  Deployment Complete!"
echo "============================================"
echo ""
echo "Application is running at: http://$(hostname -I | awk '{print $1}')"
echo ""
echo "Check status: pm2 status"
echo "View logs:    pm2 logs netmanager-api"
echo ""
