# PR29 — Firma QR independiente de NextAuth

Nueva variable opcional `VCARD_SIGNING_SECRET`; mantiene firma previa si no se configura. `VCARD_LEGACY_SIGNING_SECRET` permite conservar códigos firmados con clave antigua incluso si cambia NextAuth. Nunca retirar claves viejas hasta inventario de QR, ni imprimir secretos en logs.

QA: generar QR con clave nueva, verificar antiguos, verificar rotación de NEXTAUTH_SECRET, QR con firma manipulada 403/404. Ensayos móviles V1/V2. Sin migración; revertir exige preservar claves para mantener compatibilidad.
