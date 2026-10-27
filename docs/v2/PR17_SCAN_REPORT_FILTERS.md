# PR 17 — filtros de reportes de escaneos

## Cambio
Consulta /api/vcards/scans con paginación entera acotada y fechas YYYY-MM-DD exactas interpretadas en America/Tegucigalpa. Agrupa por día local de Honduras. Rechaza fechas invertidas e inválidas con HTTP 400; no devuelve resultados basados en Date inválidos.

## QA
npm test; npm run typecheck; npm run lint; npm run build; prueba API GET con sesión permitida; límites 00:00 y 23:59 Honduras; índices y paginación 100. No migración.

## Riesgos y rollback
Revisar consumidores que envían límite mayor a 100. Fechas de reports antes agrupadas UTC pueden cambiar el día visual, no los escaneos. Revertir el PR y comparar totales por tarjeta. Sin despliegue a 9301/9306.
