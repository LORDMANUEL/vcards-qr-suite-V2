# PR38 — Integridad de clics públicos

POST /api/vcards/click comprueba acción exacta, ID interno, estado activo de la vCard/usuario y política de firma existente (`REQUIRE_VCARD_SIGNATURE`). V1/V2 transmiten sig sin generar QR nuevo. Se rechaza inflación de métricas de tarjetas archivadas y acciones desconocidas. **Con política legacy sin firma, los eventos anónimos aún pueden falsificarse**: auditar antes de forzar la firma.

QA: tel/email/wa auténticos, QR con sig incorrecta 403, archivada 404, acción no conocida 400. Sin migración. No despliegue.
