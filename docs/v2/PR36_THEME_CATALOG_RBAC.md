# PR36 — Aislamiento de catálogo, edición y eliminación de temas

GET listado/ID exige rol de gestión y limita a temas de la compañía del usuario, más globales activos solo para lectura. Nuevos borradores de diseñadores de sucursal reciben `Theme.companyId` propia. PUT/DELETE de diseños ajenos o globales devuelve 403 para no-admin. ADMIN/IT/SUPER_ADMIN mantienen control global. Clone ya fue protegido en PR33.

QA: MARKETING Ford GET GAC ID 404; listado sin GAC; PUT/DELETE global o ajeno 403; crear draft asigna Ford; admin puede ver y operar; probar Theme Builder con roles reales. Las asignaciones publicadas no deben editarse in-place (PR7). Sin migración ni producción. Revisar borradores legacy sin companyId que requieran asignación manual controlada.
