# RADIUS + Portal Cautivo

Esta implementación usa este flujo:

1. El cliente se conecta al SSID invitado.
2. El AP Cudy detecta que el cliente no está autorizado y lo redirige al portal externo.
3. El portal de Next.js muestra el formulario en `/portal`.
4. El usuario llena sus datos.
5. El backend crea o actualiza `PortalSession` y marca la sesión como `AUTHORIZED`.
6. FreeRADIUS consulta al backend si la MAC del cliente ya está autorizada.
7. Si la sesión está autorizada y no ha expirado, FreeRADIUS responde `Access-Accept` con `Session-Timeout`.
8. El AP permite internet hasta que expire la sesión o sea revocada.

## Componentes

- App web: formulario, administración, QR, sesiones y reglas de negocio.
- FreeRADIUS: decide si el AP debe aceptar o rechazar a un cliente por MAC/NAS.
- Cudy: redirección al portal y aplicación de la política sobre el cliente.

## Endpoint listo en la app

La app ya incluye un endpoint para consulta del servidor RADIUS:

- `POST /api/radius/authorize`

Body esperado:

```json
{
  "macAddress": "AA:BB:CC:DD:EE:FF",
  "nasId": "sps-sala-espera",
  "ipAddress": "192.168.30.45"
}
```

Header requerido:

```text
x-radius-api-key: TU_SECRETO_RADIUS_API
```

Variables requeridas en `.env`:

```env
RADIUS_API_SECRET="secreto_api_para_freeradius"
```

## Instalación rápida del servidor FreeRADIUS

Usa el script:

```bash
cd /opt/vcard-system
sudo bash scripts/install-radius-server.sh
```

Variables que debes exportar antes de correrlo:

```bash
export VCARD_APP_URL="https://portal.honduras.ford.com"
export VCARD_RADIUS_API_SECRET="secreto_api_para_freeradius"
export VCARD_RADIUS_SHARED_SECRET="secreto_compartido_con_el_ap"
export VCARD_AP_CLIENT_IP="192.168.23.203"
export VCARD_AP_SHORTNAME="cudy-sps"
```

## Qué instala el script

- `freeradius` y `freeradius-utils`
- un cliente NAS para el AP Cudy
- un helper `curl` para consultar la app
- un archivo de política base en `/etc/freeradius/3.0/mods-config/files/authorize`

## Cómo funciona RADIUS aquí

RADIUS no reemplaza el portal. RADIUS se usa para la decisión de acceso.

- El portal recopila datos y decide cuándo la sesión está autorizada.
- FreeRADIUS consulta esa decisión.
- Cudy aplica el acceso real al cliente usando la respuesta del RADIUS server.

## Configuración mínima recomendada en Cudy

- Tipo de autenticación: `Servidor de portal externo`
- URL del portal cautivo: URL pública del portal con los parámetros del AP
- Perfil: `Manual` o perfil equivalente
- `RADIUS NAS ID`: igual al `identifier` o `radiusNasId` del AP en la app
- `RADIUS Secret`: igual al configurado en FreeRADIUS
- Tiempo de sesión: igual o mayor al `timeLimit` configurado en la app

## Validación operativa

1. Crear AP en la app con el modal simple.
2. Configurar el Cudy con el mismo `NAS ID` y `RADIUS Secret`.
3. Escanear QR WiFi.
4. Confirmar redirección al portal.
5. Enviar formulario.
6. Revisar en `/usuarios` que la sesión pase a `AUTHORIZED`.
7. Verificar en logs de FreeRADIUS que la MAC reciba `Access-Accept`.

## Logs útiles

```bash
sudo journalctl -u freeradius -f
sudo freeradius -X
```

## Limitación actual

La app ya está lista para responder si una MAC/NAS está autorizada. La parte específica de cómo Cudy consume esa decisión puede variar según firmware. Si tu firmware exige CoA, Disconnect o atributos adicionales, esos se agregan después de la primera prueba real con tu equipo.