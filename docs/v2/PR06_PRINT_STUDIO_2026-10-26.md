# PR-06A — Estudio de tarjetas CR80 con QR firmado y PDF doble cara

Fecha: 2026-10-26. PR independiente de #2 y #3, dirigido a `main`.

## Fallo del código original
- El editor llamaba `GET /api/users?kind=vcard`, trataba a cada User como tarjeta única y asignaba al QR `user.qrCodeData || user.email`. La API de usuarios no entrega el QR de la vCard y, aunque lo hiciera, un UUID/correo no equivale a la URL firmada de un QR existente.
- El widget renderizaba QR a través de `api.qrserver.com`, introduciendo dependencia externa y riesgo de un código equivocado. Las tarjetas de empleados ya tienen `VCard.qrImageUrl` persistida, generada con la firma correcta.
- La exportación PDF original capturaba solo la cara visible.

## Implementación
1. La lista de personas se alimenta de `GET /api/vcards`, no solo de User; cada opción representa una vCard real con ID y sucursal.
2. El editor enlaza, en frente y reverso, el `qrImageUrl` PNG firmado de la vCard sin regenerarlo ni modificar `qrCodeData`, URL, firma o secretos.
3. Se elimina la generación remota de QR para el diseño; si no existe imagen almacenada válida, el lienzo presenta advertencia.
4. Exportación PNG sigue siendo de la cara seleccionada. Exportación PDF incluye **dos páginas CR80 85,6 × 54 mm**, primera frente, segunda reverso, ambas a escala física. Se evita capturar la cuadrícula, controles y marcas de selección.
5. Antes de exportar una tarjeta que contiene QR, se exige una vCard real y un código firmado almacenado, y ancho mínimo sugerido de 20 mm en el diseño.
6. Pruebas unitarias de dimensión CR80, medida del QR y validación de origen de imagen.

## Pendiente para el futuro PR de impresión avanzada
- Sangrado de 3 mm, marcas de corte, plantillas de proveedor, orientación automática dúplex por equipo, CMYK/gestión de color, lote/múltiples empleados, generación de folios y presets de impresoras: **no implementados en este PR**.
- La vista previa en el navegador utiliza raster PNG en PDF, no vector SVG. Debe validarse impresión física, nitidez y QR con teléfonos reales.
- Las URLs de `qrImageUrl` que no son PNG base64 se rechazan: esos registros requerirán revisión/migración aprobada (sin sustituir firmas).
- La exportación DOCX previa no pasa aún por el mismo preflight; no usar DOCX como prueba de impresión verificada.

## QA y protección de datos
1. `npm ci && npm run typecheck && npm test && npm run lint && npm run build`.
2. Con PostgreSQL aislado y vCards de prueba, cargar empleados con dos vCards en distintas sedes; seleccionar ID exacto; comprobar nombre, cargo y QR.
3. Descargar PDF, verificar dos páginas, medidas físicas 85,6 × 54 mm, imagen QR igual byte a byte a DB, 20 mm mínimo y escaneo hacia URL firmada existente.
4. Probar frente/reverso, PNG, zoom 75/100/125, plantilla con y sin QR, y no permitir QR vacío/UUID/email.
5. Probar que no se transmite contenido QR a `api.qrserver.com` y que no se modifica `VCard`, User, Scan, URL o firma.
6. Revisar CORS/recursos externos y capturas de Safari/Chrome/Edge; acceso por roles.
7. Repetir regresión V1/V2 y confirmar que no se altera el puerto 9301 ni el servicio 9306.

## Despliegue / Rollback
No se ha desplegado ni ejecutado sobre BD o servidor. No incluye migraciones. Hacer backup de código y assets, compilar fuera de producción; rollback con `git revert` y despliegue aprobado del artefacto anterior. No reimprimir tarjetas sin pasar test físico.
