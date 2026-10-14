#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/home/yc/vcard-system"
SERVICE_NAME="vcard-admin-9301.service"
SERVICE_SRC="$APP_DIR/scripts/$SERVICE_NAME"
SERVICE_DST="/etc/systemd/system/$SERVICE_NAME"

if [ "${EUID}" -ne 0 ]; then
  echo "Este script debe ejecutarse como root (su -)."
  exit 1
fi

if [ ! -f "$SERVICE_SRC" ]; then
  echo "No existe $SERVICE_SRC"
  exit 1
fi

cp "$SERVICE_SRC" "$SERVICE_DST"
chmod 644 "$SERVICE_DST"

systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"

sleep 2
systemctl --no-pager --full status "$SERVICE_NAME" || true
systemctl is-active "$SERVICE_NAME"

echo "SYSTEMD_9301_READY"
