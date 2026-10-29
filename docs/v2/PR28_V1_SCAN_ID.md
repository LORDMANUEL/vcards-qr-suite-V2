# PR28 — Identificador correcto de escaneo V1

La página V1 estaba enviando el token público QR a `/api/vcards/scans`, pero esa API busca `VCard.id` interno; el resultado era 404 y escaneos V1 no contabilizados. V1 ahora espera a `vcard.id` (SSR o fallback), registra una sola vez y distingue QR firmado frente a visita DIRECT.

QA de navegador: comprobar 1 evento por visita V1, no duplicar al hidratar SSR, 0 eventos para 404/firma inválida; confirmar que V2 sigue igual. No se cambian tokens, QR ni PostgreSQL real. Rollback por revertir PR.
