# PR 19 — Exportación VCF segura

Se normaliza el nombre del archivo para evitar cabeceras inyectadas, se agrega no-store/nosniff, se genera VCF antes de incrementar estadísticas y solo se incrementa si la tarjeta sigue activa.

## QA
Pruebas de nombre con tildes/CRLF/Unicode, descarga real de QR firmado, abrir VCF en móvil, nombre de archivo, conteo antes/después y tarjeta archivada. Confirmar serializador VCF existente no inventa datos.

## Riesgos y rollback
Un error de BD después de construir respuesta no cuenta descargas, responde 500. No hay cambios de esquema ni nuevos permisos. Revertir PR si algún cliente depende de nombre de descarga anterior.
