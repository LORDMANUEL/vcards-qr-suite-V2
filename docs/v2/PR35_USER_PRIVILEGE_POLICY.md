# PR35 — Protección de modificaciones a usuarios y roles

PUT `/api/users/:id` no permite que ADMIN/IT eleve cuentas a SUPER_ADMIN/ADMIN/IT ni modifique cuentas protegidas o de sistema. SUPER_ADMIN puede gestionar otras cuentas; se evita autodesactivación y cambio de rol propio. Omisión de rol mantiene valor previo; auditoría fallida no genera falso HTTP 500 tras persistir cambios.

QA: actor ADMIN intenta SUPER_ADMIN 403; rol desconocido 403; autodesactivación 403; cuenta normal y rol sin cambios 200; validar auditoría, sesiones y seguridad real en staging. No migración. Política de recuperación de un único superadmin queda pendiente.
