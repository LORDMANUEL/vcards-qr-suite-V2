# PR 24 — Metadata privada de vCard V2

`generateMetadata` ahora comprueba `verifyVCardSignature` antes de consultar nombres y razón social. Se añade `robots: noindex,nofollow` a respuestas para evitar que buscadores indexen contactos personales y firmas URL.

QA: firma inválida/ausente cuando requisito activado → no exponer nombre en HTML/head; firma válida → título profesional; archivada/inactiva → nombre no expuesto. Verificar que V1 no usa generateMetadata personalizado. No se alteran QR ni API.
