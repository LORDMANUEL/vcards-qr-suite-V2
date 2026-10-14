#!/bin/bash

set -euo pipefail

FREERADIUS_DIR="/etc/freeradius/3.0"
APP_URL="${VCARD_APP_URL:-http://127.0.0.1:3001}"
API_SECRET="${VCARD_RADIUS_API_SECRET:-}"
SHARED_SECRET="${VCARD_RADIUS_SHARED_SECRET:-}"
AP_CLIENT_IP="${VCARD_AP_CLIENT_IP:-}"
AP_SHORTNAME="${VCARD_AP_SHORTNAME:-cudy-ap}"
ENV_FILE="/etc/vcard-radius.env"

if [[ -z "$API_SECRET" || -z "$SHARED_SECRET" || -z "$AP_CLIENT_IP" ]]; then
  echo "Faltan variables requeridas. Define VCARD_RADIUS_API_SECRET, VCARD_RADIUS_SHARED_SECRET y VCARD_AP_CLIENT_IP."
  exit 1
fi

echo "Instalando FreeRADIUS..."
apt-get update
apt-get install -y freeradius freeradius-utils curl jq

echo "Creando definicion del cliente NAS..."
mkdir -p "$FREERADIUS_DIR/clients.d"
cat > "$FREERADIUS_DIR/clients.d/vcard-cudy.conf" <<EOF
client ${AP_SHORTNAME} {
  ipaddr = ${AP_CLIENT_IP}
  secret = ${SHARED_SECRET}
  shortname = ${AP_SHORTNAME}
  nastype = other
}
EOF

echo "Instalando helper de consulta a la app..."
cat > "$ENV_FILE" <<EOF
VCARD_APP_URL="$APP_URL"
VCARD_RADIUS_API_SECRET="$API_SECRET"
VCARD_AP_SHORTNAME="$AP_SHORTNAME"
VCARD_AP_CLIENT_IP="$AP_CLIENT_IP"
EOF
chmod 600 "$ENV_FILE"

cat > /usr/local/bin/vcard-radius-authorize.sh <<'EOF'
#!/bin/bash
set -euo pipefail

if [[ -f /etc/vcard-radius.env ]]; then
  # shellcheck disable=SC1091
  source /etc/vcard-radius.env
fi

APP_URL="${VCARD_APP_URL:-http://127.0.0.1:3001}"
API_SECRET="${VCARD_RADIUS_API_SECRET:-}"
MAC="${1:-}"
NAS_ID="${2:-}"
IP_ADDR="${3:-}"

if [[ -z "$API_SECRET" || -z "$MAC" ]]; then
  exit 1
fi

RESPONSE=$(curl -sS -X POST "$APP_URL/api/radius/authorize" \
  -H "Content-Type: application/json" \
  -H "x-radius-api-key: $API_SECRET" \
  -d "{\"macAddress\":\"$MAC\",\"nasId\":\"$NAS_ID\",\"ipAddress\":\"$IP_ADDR\"}")

AUTHORIZED=$(echo "$RESPONSE" | jq -r '.authorized // false')
if [[ "$AUTHORIZED" != "true" ]]; then
  echo "REJECT"
  exit 1
fi

TIMEOUT=$(echo "$RESPONSE" | jq -r '.sessionTimeout // 3600')
echo "ACCEPT Session-Timeout := ${TIMEOUT}, Reply-Message := \"Portal access approved\""
EOF
chmod +x /usr/local/bin/vcard-radius-authorize.sh

echo "Generando policy de referencia..."
cat > /etc/freeradius/vcard-radius-policy.txt <<'EOF'
Usar este helper desde un flujo de autorizacion MAC del firmware o desde una policy custom.

Comando de prueba manual:
VCARD_APP_URL=http://127.0.0.1:3001 VCARD_RADIUS_API_SECRET=tu_secreto_api \
  /usr/local/bin/vcard-radius-authorize.sh AA:BB:CC:DD:EE:FF ap-sps 192.168.30.25

Si devuelve ACCEPT, la sesion existe en la app y esta autorizada.
EOF

echo "Reiniciando FreeRADIUS..."
systemctl enable freeradius
systemctl restart freeradius

echo "Instalacion base completada."
echo "Prueba sugerida:"
echo "  VCARD_APP_URL=$APP_URL VCARD_RADIUS_API_SECRET=$API_SECRET /usr/local/bin/vcard-radius-authorize.sh AA:BB:CC:DD:EE:FF $AP_SHORTNAME 192.168.1.20"