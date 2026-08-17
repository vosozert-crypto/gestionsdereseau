#!/bin/bash
# NetManager Pro - Backup Script
# Run this daily via cron: 0 2 * * * /opt/netmanager/deploy/backup.sh

set -e

APP_DIR="/opt/netmanager"
BACKUP_DIR="/opt/netmanager/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_PATH="$APP_DIR/server/data/netmanager.db"

echo "[$(date)] Starting backup..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup database
if [ -f "$DB_PATH" ]; then
  cp "$DB_PATH" "$BACKUP_DIR/netmanager_$DATE.db"
  echo "  Database backed up: netmanager_$DATE.db"
fi

# Keep only last 7 backups
cd "$BACKUP_DIR"
ls -t netmanager_*.db | tail -n +8 | xargs -r rm
echo "  Old backups cleaned"

echo "[$(date)] Backup complete"
