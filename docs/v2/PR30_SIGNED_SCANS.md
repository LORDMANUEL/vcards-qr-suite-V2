# PR30 — Escaneos QR con prueba HMAC

POST `/api/vcards/scans` verifica que un evento tipo QR incluya la firma válida del token público almacenado en VCard.qrCodeData. V1/V2 transmiten la firma existente de la URL, sin exponer nuevas claves. DIRECT/MANUAL conservan compatibilidad, pero se contabilizan por separado. Esto no elimina la posibilidad de inflar accesos DIRECT; requiere limitador robusto detrás del proxy.

QA: QR válido 200, firma falsa 403, tarjeta archivada 404, V1/V2 más VCF y dispositivo móvil. No migración; revertir si se descubre un cliente QR legítimo que omite firma y actualizarlo.
