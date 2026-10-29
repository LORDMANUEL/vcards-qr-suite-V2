# PR39 — Directorio de usuarios por permisos

Antes `GET /api/users?kind=all` carecía de RBAC y devolvía usuarios de todas las compañías a cualquier sesión. Ahora `all/system` exige rol administrativo y `vcard` exige permiso de carga y filtro de sucursal para no-admin; 400 para `kind` inválido. Se seleccionan campos seguros explícitos, excluyendo password, 2FA y reset tokens.

QA: MARKET de SPS obtiene solo asesores SPS, `all/system` 403; IT ve directorio global; revisar pantallas de empleados y lectores que usan `kind=all`. Sin cambios DB. Rollback con evaluación de permisos, nunca exponiendo credenciales.
