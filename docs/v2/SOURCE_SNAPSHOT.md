# Fuente del snapshot VCards

- Fecha de captura: 2026-10-14 (America/Tegucigalpa)
- Host auditado: `yc`
- Servicio: `vcard-admin-9306.service`
- Directorio activo: `/home/yc/vcards-fase1-20261014-101842`
- Build activo observado: `8ig-OXnVVUwpi0uNIWphp`
- SHA-256 del archivo local de transferencia: `0fd6dfa3e67130c1f9cba99841ea45a4af88aa522e37a69b616e49300299b332`

## Alcance del respaldo Git

El repositorio contiene el código fuente y configuración no secreta del árbol activo. Se excluyeron deliberadamente `.env`, claves, logs, bases de datos, respaldos, `node_modules`, `.next`, archivos subidos por usuarios, QR y avatares generados.

Antes del primer commit se sanearon scripts heredados que contenían credenciales de desarrollo o podían escribir directamente en PostgreSQL. Los scripts destructivos quedaron deshabilitados y los secretos restantes deben recibirse por variables de entorno.

El árbol desplegado no contenía `.git` y el servidor no tenía Git instalado. Por ello este repositorio constituye la recuperación versionada inicial; no se atribuye historial anterior que no pueda verificarse.

No se modificó ni reinició producción durante la captura.
