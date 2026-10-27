# PR 18 — Validación de eventos de escaneo

En POST /api/vcards/scans se rechaza JSON inválido, vcardId inválido y métodos desconocidos con 400. No se contabilizan como QR las solicitudes malformadas. Se limita VCARD_MAX_SCANS_PER_MINUTE a enteros 1..1000 o valor 15 por defecto.

## QA
Pruebas unitarias, CI, POST con tarjeta válida/archivada/ausente y ensayo rate limit; confirmar clientes que usan QR, DIRECT o MANUAL. 

## Rollback
Sin migración. Revertir rama si hay clientes legítimos enviando métodos fuera del contrato; primero inventariarlos, no silenciar eventos desconocidos.
