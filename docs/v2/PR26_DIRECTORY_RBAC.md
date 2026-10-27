# PR 26 — Directorio multiempresa por ámbito

GET /api/companies y GET /api/branches ya no listan las empresas y sedes de todas las marcas a cualquier usuario autenticado. ADMIN/IT/SUPER_ADMIN tienen acceso global; los demás usuarios ven la compañía que contiene su Branch asignada y su sede, o 403 si no están asignados.

## QA
Entrar como MARKETING SPS y validar que catálogo no expone GAC/TGU. Admin sí ve todas. Comparar editor de vCards y selector company/branch, que deberán usar el ámbito devuelto. Probar errores 401/403. Las rutas de creación mantienen sus permisos independientes.

## Límite
No se cambian permisos del Portal Manager ni endpoints de búsqueda ajenos; auditar sus listados en PR futuros. Managers sin branch requieren política global explícita aprobada, no escalación automática. No producción.
