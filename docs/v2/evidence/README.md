# Evidencia de QA V2

Fecha: 2026-10-14, zona America/Tegucigalpa.

## Validación ejecutada

- `npm test`: 4/4 pruebas unitarias aprobadas.
- `npm run typecheck`: aprobado con TypeScript sin emisión e incremental desactivado.
- `npm run lint`: aprobado sin errores; conserva advertencias heredadas documentadas.
- `npm run build`: aprobado; 46 páginas estáticas y rutas dinámicas V1/V2 generadas.
- QA visual local con fixtures ficticios, sin conexión ni escritura a PostgreSQL.
- Capturas: Ford Yude, GAC Yude y Quick Lane a 360, 390, 768, 1024 y 1440 px.
- Movimiento reducido: captura adicional Ford 390 y verificación computada `animation-name: none` para el vehículo y `transform: none` para controles.

## Límites

Las capturas usan `/v2/visual-fixture/[brand]`, una ruta que responde 404 salvo que `ENABLE_VCARD_VISUAL_FIXTURES=true`. No prueban datos reales ni contrato CRM. No se desplegó ni reinició 9306/9301.

Las pruebas visuales no sustituyen la UAT con responsables de marca ni la verificación final detrás de HTTPS.
