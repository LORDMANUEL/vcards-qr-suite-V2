#!/usr/bin/env bash
# Diagnóstico SOLO LECTURA de un host VCards (Debian/Linux). No deploy, ni backups, ni secretos.
set -u
echo "VCards V2 — Diagnóstico de despliegue (SOLO LECTURA)"
echo "Fecha UTC: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo "Host: $(hostname)"
echo

check_bin() {
  if command -v "$1" >/dev/null 2>&1; then
    printf 'OK  herramienta: %s\n' "$1"
  else
    printf 'AVISO herramienta ausente: %s\n' "$1"
  fi
}

for cmd in node npm git curl systemctl ss pg_dump; do check_bin "$cmd"; done
printf '\n'
if command -v node >/dev/null 2>&1; then node --version; fi
if command -v npm >/dev/null 2>&1; then npm --version; fi

printf '\nServicios (sin imprimir variables ni configuración):\n'
if command -v systemctl >/dev/null 2>&1; then
  for unit in vcard-admin-9306.service vcard-admin-9301.service vcard-admin.service vcard-system.service; do
    state=$(systemctl is-active "$unit" 2>/dev/null || true)
    printf '%-31s %s\n' "$unit" "${state:-no identificado}"
  done
fi

printf '\nPuertos esperados:\n'
if command -v ss >/dev/null 2>&1; then
  ss -lnt | awk 'NR==1 || $4 ~ /:(9301|9306)$/ { print }'
fi

printf '\nRespuestas HTTP locales (códigos sin cookies ni contenido):\n'
if command -v curl >/dev/null 2>&1; then
  for port in 9301 9306; do
    for path in / /login; do
      code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 7 "http://127.0.0.1:${port}${path}" 2>/dev/null || true)
      printf 'http://127.0.0.1:%s%s -> %s\n' "$port" "$path" "${code:-sin respuesta}"
    done
  done
fi

printf '\nEspacio de disco: \n'
df -h . 2>/dev/null || true
printf '\nFin. Ningún servicio, base de datos ni configuración fue modificada.\n'
