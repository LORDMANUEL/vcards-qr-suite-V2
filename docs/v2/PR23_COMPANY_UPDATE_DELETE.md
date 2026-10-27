# PR 23 — Corregir regresión crítica en edición y borrado de Company

La rama acumulativa conservaba un controlador antiguo que renombraba/creaba Branch en PUT, y ejecutaba UPDATE companyId=NULL antes de DELETE. Se reemplaza por patch de campos corporativos (nombre, slug, colores, logo), sin tocar sucursales salvo sincronizar texto de compañía al renombrar la razón social. DELETE transaccional bloquea el padre y rechaza 409 si tiene sedes.

## QA
En BD aislada editar razón social de Ford con 3 sedes; verificar mismos IDs/nombres/ciudades/temas/QR. Intentar borrar con 3 sedes: 409 sin orfanato. Borrar Company vacía (permitido), 404 inexistente y prueba de carreras. Sin migraciones.

## Riesgos
No expone modificación de punteros de temas desde PUT; la publicación se realiza en endpoint dedicado. Revertir y revisar dependencias de controladores legacy antes de deploy.
