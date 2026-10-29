# PR41 — Marca corporativa correcta en VCF

La exportación .vcf ya no coloca siempre Ford ni usa nombre de sucursal como ORG. El campo ORG usa Branch.companyName; en sedes heredadas sin compañía usa Branch.name, y sin sede usa Contacto digital. No cambia QR, User ni registros persistentes.

QA con vCards GAC/Ford/Quick Lane y apps de contactos Android/iOS; verificar empresa mostrada al importar. Documentar sucursales huérfanas para reconciliación por ID. Rollback revertir PR.
