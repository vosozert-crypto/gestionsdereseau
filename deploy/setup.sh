#!/bin/bash
# NetManager Pro - Server Setup Script
# Run this script on your Ubuntu/Debian server as root

set -e

APP_NAME="netmanager"
APP_DIR="/opt/$APP_NAME"
NODE_VERSION="20"
DOMAIN="netmanager.local"
ADMIN_EMAIL="admin@netmanager.local"

echo "============================================"
echo "  NetManager Pro - Server Setup"
echo "============================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "ERROR: Please run as root (sudo ./setup.sh)"
  exit 1
fi

# Update system
echo "[1/8] Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq

# Install Node.js 20
echo "[2/8] Installing Node.js $NODE_VERSION..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
  apt-get install -y nodejs
fi
echo "  Node.js $(node -v) installed"
echo "  npm $(npm -v) installed"

# Install PM2 globally
echo "[3/8] Installing PM2 process manager..."
npm install -g pm2

# Install Nginx
echo "[4/8] Installing Nginx..."
apt-get install -y nginx
systemctl enable nginx

# Install Certbot for SSL
echo "[5/8] Installing Certbot for SSL certificates..."
apt-get install -y certbot python3-certbot-nginx

# Create app directory
echo "[6/8] Setting up application directory..."
mkdir -p "$APP_DIR"
mkdir -p "$APP_DIR/logs"
mkdir -p "$APP_DIR/server/data"

# Copy application files
echo "  Copying application files..."
cp -r ../* "$APP_DIR/" 2>/dev/null || true
cp -r ../.[!.]* "$APP_DIR/" 2>/dev/null || true

# Install dependencies
echo "[7/8] Installing application dependencies..."
cd "$APP_DIR"
npm install --production=false
cd server
npm install --production
cd ..

# Build frontend
echo "  Building frontend..."
npm run build

# Setup environment
echo "[8/8] Configuring environment..."
if [ ! -f "$APP_DIR/server/.env" ]; then
  cat > "$APP_DIR/server/.env" << EOF
PORT=4000
HOST=127.0.0.1
NODE_ENV=production

JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

DB_PATH=$APP_DIR/server/data/netmanager.db

SNMP_COMMUNITY=public
SNMP_VERSION=2c
SNMP_POLL_INTERVAL=30000

WMI_AGENT_URL=http://localhost:5000
WMI_AGENT_TIMEOUT=10000

SCAN_SUBNET=10.10.0.0
SCAN_MASK=24
EOF
  echo "  .env file created with secure JWT secret"
fi

# Seed database
echo "  Seeding database..."
cd "$APP_DIR/server"
npx tsx src/db/seed.ts 2>/dev/null || echo "  (Database already seeded or seed skipped)"
cd "$APP_DIR"

# Setup Nginx
echo "  Configuring Nginx..."
cp "$APP_DIR/deploy/nginx.conf" "/etc/nginx/sites-available/$APP_NAME"
ln -sf "/etc/nginx/sites-available/$APP_NAME" "/etc/nginx/sites-enabled/$APP_NAME"
rm -f /etc/nginx/sites-enabled/default

# Setup PM2 startup
pm2 save
pm2 startup systemd -u root --hp /root

# Start application
echo "  Starting application..."
pm2 start ecosystem.config.js
pm2 save

# Reload Nginx
systemctl reload nginx

echo ""
echo "============================================"
echo "  Setup Complete!"
echo "============================================"
echo ""
echo "Application URL: http://$(hostname -I | awk '{print $1}')"
echo "Default login:   admin / admin123"
echo ""
echo "Next steps:"
echo "  1. Point your domain DNS to this server's IP"
echo "  2. Run: sudo certbot --nginx -d your-domain.com"
echo "  3. Change admin password: login → Settings → Users"
echo ""
echo "Useful commands:"
echo "  pm2 status              - Check app status"
echo "  pm2 logs netmanager-api - View logs"
echo "  pm2 restart all         - Restart app"
echo "  nginx -t                - Test Nginx config"
echo ""
