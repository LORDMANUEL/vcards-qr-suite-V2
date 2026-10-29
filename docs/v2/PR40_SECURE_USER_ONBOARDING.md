# PR40 — Alta segura de usuarios

POST User valida correo, rol, permiso de creación y sucursal ANTES de modificar datos. MARKETING crea solo ADVISOR en su propia sede. Solo SUPER_ADMIN puede crear ADMIN/IT/SUPER_ADMIN. Generación de contraseña aleatoria criptográfica de 32 bytes cuando no se proporciona una contraseña válida; **la contraseña aleatoria no se entrega ni habilita acceso automático**, gestionar invitación/reset por flujo autorizado. Evita falsos 500 por auditoría poscommit.

QA: pruebas de roles y creación en staging, inicio de sesión/reset, sin exponer secretos. No migración. Rollback conservando el historial.
