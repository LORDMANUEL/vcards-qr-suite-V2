# PR34 — Validación de fechas reales en campañas

Antes el calendario aceptaba cualquier forma `YYYY-MM-DD` aunque el día no existiera, por ejemplo 2026-02-30, y JS Date podía normalizarlo a marzo. El validador ahora exige fecha válida en el calendario gregoriano, manteniendo extremos inclusivos para America/Tegucigalpa.

QA: 29 de febrero en bisiesto válido, febrero 30 inválido, rango invertido 422 al publicar; campañas Ford/GAC sin activar fuera de ventana, sin migraciones. Rollback por revertir PR.
