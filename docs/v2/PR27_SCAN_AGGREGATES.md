# PR27 — Coherencia de estadísticas por rango

El conteo total histórico se conserva por separado; `totalFiltered`, `byDevice` y `byDate` usan el mismo intervalo [desde, hasta) en hora Honduras. La SQL parametrizada utiliza `Prisma.sql` y no concatena entrada del usuario.

QA: comparar escaneos de dos días y filtros cruzando medianoche de Tegucigalpa contra sumas agrupadas; ejecutar PostgreSQL CI, pruebas unitarias, lint y build. Sin migración. Rollback por revertir PR y comparar cifras reportadas.
