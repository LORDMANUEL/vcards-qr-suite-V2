#!/bin/bash
# ─────────────────────────────────────────────────
# Script para cambiar los secretos UAM y RADIUS
# Uso: sudo bash update-secrets.sh
# ─────────────────────────────────────────────────

set -e

echo "=== Generando nuevos secretos seguros ==="
NEW_RADIUS=$(openssl rand -base64 16)
NEW_UAM=$(openssl rand -base64 16)

echo ""
echo "Nuevos secretos generados:"
echo "  RADIUS_SECRET = $NEW_RADIUS"
echo "  UAM_SECRET    = $NEW_UAM"
echo ""
echo "IMPORTANTE: Copia estos valores y ponlos en el AP CUDY manualmente."
echo ""
read -p "¿Continuar con la actualización? (s/N): " CONFIRM
if [[ "$CONFIRM" != "s" && "$CONFIRM" != "S" ]]; then
    echo "Cancelado."
    exit 0
fi

# Backup antes de cambiar
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p /opt/backups/captive-config
cp /etc/freeradius/3.0/clients.conf \
   /opt/backups/captive-config/clients.conf.bak_${TIMESTAMP}
cp /home/yc/vcard-admin-9301/.env \
   /opt/backups/captive-config/env.bak_${TIMESTAMP}

# Actualizar clients.conf de FreeRADIUS
sed -i "s/secret    = .*/secret    = $NEW_RADIUS/g" \
    /etc/freeradius/3.0/clients.conf

# Actualizar .env del proyecto
sed -i "s/RADIUS_SECRET=.*/RADIUS_SECRET=\"$NEW_RADIUS\"/" \
    /home/yc/vcard-admin-9301/.env
sed -i "s/UAM_SECRET=.*/UAM_SECRET=\"$NEW_UAM\"/" \
    /home/yc/vcard-admin-9301/.env

# Reiniciar servicios
echo "Reiniciando FreeRADIUS..."
systemctl restart freeradius

echo "Rebuilding Next.js..."
cd /home/yc/vcard-admin-9301 && npm run build

echo "Reiniciando portal..."
systemctl restart vcard-admin-9301

echo ""
echo "=== LISTO ==="
echo "Secretos actualizados. Ahora ve al AP CUDY y pon:"
echo "  RADIO Secreto:  $NEW_RADIUS"
echo "  Secreto UAM:    $NEW_UAM"
echo ""
echo "Backup guardado en /opt/backups/captive-config/"
