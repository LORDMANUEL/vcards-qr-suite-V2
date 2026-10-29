# PR45 — Coherencia temática en altas de sucursales

POST Branch valida categorías de temas en la alta igual que PUT Branch: `portalThemeId` requiere `PORTAL`, y los temas corporativos/temporales/legacy requieren `VCARD`, con empresa correcta. Nunca asociar temas de otra marca.

QA: altas Ford/GAC con tema PORTAL equivocado 422, temas ajenos 422, combinación válida 201. Revisión de datos históricos antes de activar por defecto. Sin migraciones ni deploy.
