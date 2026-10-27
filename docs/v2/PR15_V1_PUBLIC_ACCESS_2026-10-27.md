# PR-15 — VCard V1 pública: firma QR y exclusión de tarjetas archivadas

Fecha: 2026-10-27. PR apilado sobre PR-14 → #13 → #12 → #11 → #10.

## Defecto confirmado
La página Next.js `app/vcard/[id]/page.tsx` obtenía datos por `qrCodeData` **sin filtrar** `VCard.isActive` ni `User.isActive`, y no llamaba `verifyVCardSignature`. La API pública ya verificaba la firma, pero Next.js renderizaba información desde PostgreSQL en el SSR sin pasar por esa API. Por ello un QR archivado podía seguir mostrando información en V1 y un enlace con firma inválida podía llegar al renderizador SSR.

## Corrección
- Antes de consultar/renderizar V1, ejecutar `verifyVCardSignature(id, searchParams?.sig)`; `notFound()` si inválida.
- Para consultar, aplicar `where: { qrCodeData: id, isActive: true, user: { isActive: true } }`, igual que V2 y la API pública.
- `notFound()` sin datos; no entregar props de empleados archivados/inactivos al cliente.
- `REQUIRE_VCARD_SIGNATURE` conserva su comportamiento: con `true`, las tarjetas sin firma no se muestran; con `false`, una URL antigua sin firma puede seguir funcionando, pero las firmas incorrectas se rechazan. Este PR no altera la política de compatibilidad.
- No regenerar QR, tokens, HMAC, URLs antiguas ni cambiar columnas de BD.

## QA en PostgreSQL efímero
`tests/db-contract.integration.test.ts` ahora verifica que el criterio público `qrCodeData + isActive + user.isActive` no encuentra una tarjeta archivada y vuelve a encontrar la misma vCard tras restaurarla, conservando todos sus escaneos.

## Validación E2E pendiente (Codex)
1. Ejecutar Prisma validate/generate, TS, unit tests, PostgreSQL integration, lint y build en GitHub Actions por SHA.
2. Con `REQUIRE_VCARD_SIGNATURE=true` y QR real de staging: `/vcard/uuid?sig=HMAC` debe mostrar contenido; firma incorrecta y firma ausente deben dar 404. Repetir V2, API y descarga VCF.
3. Con `REQUIRE_VCARD_SIGNATURE=false`: verificar ruta legacy sin firma solo para tarjetas activas y usuarios activos; firmas explícitamente inválidas siempre 404.
4. Archivar: 404 en V1, V2 y API público, conservar analytics. Restaurar con cuenta activa: misma URL/QR y metrics intactos.
5. Usuario inactivo: ambas vistas públicas dan 404 incluso si VCard permanece activa.
6. Probar escaneo QR físico, dominio/certificado, renderizados 360/390/768/1024/1440, y reportes analíticos.
7. Verificar que **9301** no sirva una implementación antigua de `/vcard/[id]` por proxy. Si sirve, incluir esa aplicación en análisis de compatibilidad antes de desplegar 9306.

## Límites
- La política condicional `REQUIRE_VCARD_SIGNATURE` se mantiene intencionalmente por QR legados; exigir firma obligatoria universal requiere inventario y plan de rotación HMAC, NO incluido aquí.
- Una URL válida y una tarjeta activa muestran la información pública prevista. No se reemplaza el control de scraping/ratelimit ni confianza en proxies.
- No se ha ejecutado ningún cambio en servidores ni BD reales.

## Reversión
Revertir PR y redeploy desde release conocido, previa revisión de accesos SSR. No hay migración, seeds ni escrituras PostgreSQL en producción.
