# PR 25 — RBAC por sucursal en escaneos

`GET /api/vcards/scans` valida que la vCard solicitada exista y que el usuario tenga asignada esa sucursal. Solo ADMIN/IT/SUPER_ADMIN pueden consultar otras sedes; el endpoint no cambia Scan ni QR.

QA: login MARKETING de SPS consulta SPS 200, TGU 403; tarjeta inexistente 404; sin sesión 401. La política de managers globales necesita decisión organizacional: por seguridad actual deben usar usuario con permisos administrativos para ver otras sedes. Probar paginación y cifras.
