# PR46 — Tipos válidos de temas

POST/PUT vcard-themes rechaza 422 para tipos de tema fuera de CORPORATE/FESTIVE/SEASONAL, antes de escribir Prisma. Evita errores 500 y evita mezclar el enum ThemeType con ThemeCategory.

QA: creación de borradores estacionales y corporativos, tipo desconocido 422, clon con tipo heredado correcto, publicar y revertir. Sin migraciones.
