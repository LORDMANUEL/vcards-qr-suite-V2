-- Diagnóstico de integridad VCards V2. PostgreSQL SOLO LECTURA.
-- Prohibido convertir a UPDATE/DELETE sin mapa de correspondencia aprobado.

-- Sucursales sin empresa: evidencia para reconciliación humana.
SELECT b."id", b."name", b."city", b."companyName", b."uniqueSlug",
       (SELECT COUNT(*) FROM "VCard" v WHERE v."branchId" = b."id") AS vcards,
       (SELECT COUNT(*) FROM "User" u WHERE u."branchId" = b."id") AS usuarios,
       (SELECT COUNT(*) FROM "AccessPoint" a WHERE a."branchId" = b."id") AS nodos
FROM "Branch" b
WHERE b."companyId" IS NULL
ORDER BY b."companyName", b."city", b."name";

-- Conteo por empresa registrada, incluidas las que muestran cero sucursales.
SELECT c."id", c."name", c."slug", COUNT(b."id") AS sucursales
FROM "Company" c LEFT JOIN "Branch" b ON b."companyId" = c."id"
GROUP BY c."id", c."name", c."slug"
ORDER BY c."name";

-- Nombres visualmente similares (NO concluir duplicados solamente por nombre).
SELECT lower(trim(c."name")) AS nombre_normalizado, COUNT(*) AS cantidad,
       array_agg(c."id" ORDER BY c."id") AS ids
FROM "Company" c
GROUP BY lower(trim(c."name"))
HAVING COUNT(*) > 1;

-- Claves sucursal / empresa discordantes entre tarjeta y usuario.
SELECT v."id" AS vcard_id, v."branchId" AS sucursal_vcard,
       u."id" AS user_id, u."branchId" AS sucursal_usuario, v."qrCodeData" AS qr_id
FROM "VCard" v
JOIN "User" u ON u."id" = v."userId"
WHERE v."branchId" IS DISTINCT FROM u."branchId"
ORDER BY v."id";

-- Tema aparentemente compartido en compañías distintas (para clonar, nunca reescribir sin aprobación).
SELECT t."id" AS theme_id, t."name" AS theme_name,
       array_remove(array_agg(DISTINCT b."companyId"), NULL) AS empresas_sucursales,
       COUNT(DISTINCT b."companyId") AS companias_distintas
FROM "Theme" t
JOIN "Branch" b ON b."vcardThemeId" = t."id" OR b."seasonalVcardThemeId" = t."id"
GROUP BY t."id", t."name"
HAVING COUNT(DISTINCT b."companyId") > 1;
