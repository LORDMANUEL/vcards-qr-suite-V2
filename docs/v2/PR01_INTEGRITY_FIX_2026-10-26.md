# PR-01 — Integridad Company → Branch → VCard (26 oct 2026)

## Diagnóstico confirmado en el código
- Antes: `PUT /api/branches/:id` ejecutaba `companyId: companyId || null`. Los PUT parciales de cambio de tema de `app/vcards/temas/page.tsx` no enviaban `companyId`; esto podía dejar sucursales huérfanas.
- El selector vCard elegía automáticamente la primera sucursal de una empresa y el editor resolvía sucursales por nombre, ambiguo cuando se repite entre compañías.
- El guardado de perfil y vCard se hacía en dos escrituras independientes.
- `Company.branches` se obtiene por `Branch.companyId`; las sedes con `companyId=null` no aparecen dentro de la compañía. No se ha confirmado la magnitud del daño en producción.

## Cambios
1. PUT parcial preserva la asociación de empresa por omisión. Solo se permite cambiar a un ID de empresa existente enviado explícitamente; null/empty reciben 422. El nombre canónico de compañía procede de BD.
2. Formularios Crear y Editar requieren elección consciente Empresa → Sucursal. Las opciones se filtran por ID, se resetean al cambiar de empresa, sin seleccionar automáticamente ni buscar por nombres duplicados.
3. API de altas y edición de vCards comprueba que la sucursal indicada pertenece a la empresa elegida. Los usuarios acotados a una sucursal no pueden mover tarjetas entre sucursales.
4. Edición de User y VCard en la misma transacción Prisma; preserva `VCard.id`, `qrCodeData`, `qrImageUrl`, URL publicada, firma y métricas.
5. Pruebas unitarias de guardas de asociación en `tests/branch-integrity.test.ts`.

## Límite y compatibilidad
- No incluye SQL de reparación automática. Las sucursales previamente huérfanas deben vincularse mediante reconciliación de datos aprobada, en un PR separado.
- No cambia Prisma schema, migraciones, servicio 9301, V1/V2 públicos, ni QR.
- `POST /api/vcards` y `PUT /api/vcards/:id` pasan a validar `companyId`; actualizar cualquier cliente adicional que envíe solo `branchId` antes de despliegue.

## Consultas de diagnóstico (solo lectura)
```sql
SELECT b."id", b."name", b."city", b."companyId", b."companyName",
       (SELECT COUNT(*) FROM "VCard" v WHERE v."branchId" = b."id") AS vcards
FROM "Branch" b WHERE b."companyId" IS NULL ORDER BY b."name";
SELECT c."id", c."name", COUNT(b."id") AS branches
FROM "Company" c LEFT JOIN "Branch" b ON b."companyId"=c."id"
GROUP BY c."id",c."name" ORDER BY c."name";
```
No ejecutar actualizaciones automáticas basadas únicamente en `companyName`, ciudad o nombre de sucursal.

## QA por completar en entorno aislado
`npm ci`, `npm run typecheck`, `npm test`, `npm run lint`, `npm run build`.
Prueba API: crear dos compañías, tres sucursales; actualizar solo `vcardThemeId` y comprobar `companyId` invariable; 422 por `companyId:null` y ID inexistente.
Probar alta/edición de vCard con compañía correcta/incorrecta; forzar fallo User/VCard y validar rollback de transacción; validar roles, V1, V2, URL firmada y QR anteriores. Probar 390/768/1440 px.
La rama se creó sin acceso a la BD o servidor; las pruebas ejecutadas desde el conector GitHub no están disponibles, así que NO declarar build ni QA aprobados.

## Rollback
Revertir el commit de la rama/PR mediante nuevo commit `git revert` y volver a desplegar solo con backup/verificación autorizada. No hacer rollback de datos porque este PR no altera el esquema ni contiene script de datos. Mantener copia del release 9306 anterior, y no reiniciar 9301.
