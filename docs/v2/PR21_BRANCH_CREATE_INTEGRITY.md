# PR 21 — Registro de sucursales asociadas a empresas

POST /api/branches exige rol ADMIN/IT/SUPER_ADMIN, `companyId`, nombre y ciudad; rechaza sucursales aparentemente duplicadas dentro de la misma empresa y temas asociados a otra empresa. Deriva razón social por FK real y no admite compañías huérfanas nuevas.

## QA
Crear Ford SPS y GAC SPS sin mezclar compañías; rechazar empresa ausente y tema ajeno; no modificar ramas legacy huérfanas ya existentes. Concurrencia en PostgreSQL puede producir duplicado en ausencia de `@@unique` para (companyId,name,city); analizar migración futura tras auditar histórico.

## Reversión
No hay migración ni mutación de producción. Rollback por PR/release y revisar clientes que todavía intentan crear sucursales sin empresa.
