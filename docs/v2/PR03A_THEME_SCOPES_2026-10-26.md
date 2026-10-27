# PR-03A — Publicación de temas por empresa/sucursal

Fecha: 2026-10-26. **PR apilado sobre PR-01 (integridad de sucursales).** Este cambio es un paso intermedio, no reemplaza el futuro modelo ThemeVersion/ThemePublication.

## Defectos corregidos
- `app/api/vcard-themes/route.ts` ejecutaba `updateMany` para desactivar todos los demás temas vCard al activar uno.
- `app/vcards/temas/page.tsx` usaba destino global y un `Promise.all` de PUT contra *todas* las sucursales, incluso empresas ajenas. En el sistema antiguo esos PUT podían borrar `companyId`.
- El catálogo impedía publicar un tema que ya estaba activo, aunque una empresa/sucursal adicional tuviera interés en asignarlo.

## Nueva regla
1. Un tema se diseña en Theme Builder; el catálogo únicamente lo organiza y publica.
2. El administrador elige explícitamente una empresa o sucursal; no hay botón de publicación global.
3. `POST /api/vcard-themes/publish` acepta `{ themeId, scope:'company'|'branch', targetId }`. Resuelve la empresa por FK y valida rol, tema VCARD, existencia, pertenencia, uso previo en otras empresas.
4. Se actualiza una sola referencia de empresa o sucursal en transacción serializable junto a `Theme.isActive=true`. **No se ejecuta `updateMany` para apagar otros temas ni escrituras masivas a otras sucursales**.
5. `Theme.companyId` marca la propiedad del tema publicado. Para reutilizar un diseño en otra compañía hay que clonarlo, evitando que la activación contamine el fallback.
6. El fallback global público V1/V2 toma únicamente temas no adscritos a empresas (`companyId IS NULL`). No cambia ID ni URL de vCard, QR HMAC, ni rutas públicas.
7. Se agregaron pruebas unitarias sobre selección de ámbito, slot estacional y pertenencia.

## QA requerido antes de merge/deploy
- Ejecución `npm ci && npm run typecheck && npm test && npm run lint && npm run build`.
- Crear Ford/GAC/Quick Lane en una BD de prueba; activar corporativo para Ford y tema GAC para GAC y confirmar que no varían entre ellas.
- 401 sin sesión, 403 sin rol, 400 parámetros incompletos, 404 destino inexistente, 422 sucursal huérfana, 409 tema propiedad de otra compañía. Confirmar que cambio de tema no altera `Branch.companyId`.
- Publicación simultánea/carreras; verificar aislamiento serializable y reintentos.
- Evaluar retornos 9301, V1, V2, QR, descargas, fechas válidas/expiradas, roles de marketing, accesibilidad 390/768/1440.
- Verificar no haya temas legados compartidos entre compañías. Para ambigüedades, clonar y remapear solo tras aprobación.
- Verificar si 9301 comparte PostgreSQL y revisar clientes que dependen de `isActive` global.

## NO incluido
- Calendario transaccional por alcance (`ThemePublication`) y snapshots versionados (`ThemeVersion`): requieren migración Prisma y baseline controlado; existentes `validFrom/validTo` siguen a nivel de tema y no cubren programación distinta por sucursal.
- Reestructuración visual total de Theme Builder, estudio de impresión o Portal Manager. Son PR posteriores.
- Reconciliación de empresas/sucursales huérfanas y cualquier despliegue.

## Rollback
Revertir el PR vía commit. Si ya hubo publicaciones realizadas en un entorno controlado, guardar antes el mapa de IDs de temas asignados a Company/Branch y restaurarlo de backup/plan aprobado; un revert de código no deshace cambios de registros. Mantener servicios 9301/9306 sin alteración hasta autorización explícita.

## Estado
Cambios de código y unit tests propuestos y subidos; no se ha ejecutado compilación, QA con BD real, migración ni despliegue desde esta conversación.

## Calendario y compatibilidad (extensión posterior)

- V1 y V2 ahora evalúan `validFrom`/`validTo` por día calendario de `America/Tegucigalpa`, inclusivo. Se agregaron `lib/vcard-theme-calendar.ts` y pruebas para el cambio de día a las 06:00 UTC.
- La API de temas rechaza rangos invertidos con 422; el catálogo valida y muestra el error. Los `DateTime` Prisma se aceptan como `Date` además de su representación JSON como texto.
- La publicación no permite reutilizar temas ya asociados a una compañía diferente, incluyendo referencias legadas `Branch.themeId` y reglas por puesto `VCardPositionThemeRule` de otra empresa.
- Sigue faltando un modelo de publicaciones programadas distinto por sucursal. Los campos del tema son compartidos y **no** equivalen a una agenda independiente para cada destino.

## Estado de pruebas
Las ramas tienen workflow CI propuesto y pruebas unitarias; comprobar en GitHub Actions el último SHA antes del merge. No afirmar validación aprobada por resultados de un commit anterior. Compilación, integración BD y regresión real siguen condicionadas al job correspondiente.
