#!/bin/bash
set -e

echo "Sincronizando hacia /opt/vcard-system..."
echo "yc" | sudo -S rsync -a --exclude 'node_modules' --exclude '.next' --exclude '.git' /mnt/c/Users/IT/Downloads/vcard_qr_system/nextjs_space/ /opt/vcard-system/

echo "Instalando servicios systemd..."
echo "yc" | sudo -S cp /opt/vcard-system/scripts/vcard-system.service /etc/systemd/system/vcard-system.service
echo "yc" | sudo -S cp /opt/vcard-system/scripts/vcard-admin.service /etc/systemd/system/vcard-admin.service

echo "Ajustando permisos..."
echo "yc" | sudo -S chown -R vcard:vcard /opt/vcard-system

echo "Recompilando aplicación..."
echo "yc" | sudo -S -u vcard bash -c "cd /opt/vcard-system && npm install --legacy-peer-deps && npx prisma generate && rm -rf .next && npm run build"

echo "Reiniciando servicios..."
echo "yc" | sudo -S systemctl daemon-reload
echo "yc" | sudo -S systemctl enable vcard-admin
echo "yc" | sudo -S systemctl enable vcard-system
echo "yc" | sudo -S systemctl restart vcard-admin
echo "yc" | sudo -S systemctl restart vcard-system
echo "¡Sincronización completada!"
