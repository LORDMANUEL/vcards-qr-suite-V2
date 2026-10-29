# PR47 — Auditoría QR sin divulgar secretos de firma

Los registros de error ya no incluyen IP ni valor completo del HMAC presentado. AuditLog conserva únicamente el tipo HMAC_MISMATCH/SIGNATURE_REQUIRED, motivo normalizado y la IP en su campo estructurado existente (sujeto a permisos/retención). Se evita propagar tokens QR por sistemas centralizados de logs.

QA: intentar HMAC falso, confirmar 403 y AuditLog sin `attemptedSignature`; logs de aplicación sin token ni IP embebidos. Ajustar retención de AuditLog según política corporativa. Sin migraciones ni producción.
