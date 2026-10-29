# PR44 — Privacidad de visitantes en reportes

GET /api/vcards/scans conserva totales, ciudad, dispositivo y fechas, pero oculta IP y User-Agent a roles no administrativos. ADMIN/IT/SUPER_ADMIN mantienen acceso para auditoría técnica. No elimina datos existentes: política de retención/minimización sigue pendiente.

QA: comparar MARKETING SPS vs IT sobre misma vCard, asegurar 403 fuera de sede, verificar no exponer IP en respuesta. Sin migración y no producción.
