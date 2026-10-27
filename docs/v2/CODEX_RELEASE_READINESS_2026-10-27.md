# VCards V2 — estado de integración y plan de entrega a Codex
**Corte técnico:** 2026-10-27 | **Destino:** laboratorio/staging en Debian, NO producción.

## Resumen verificado
- Repo: https://github.com/LORDMANUEL/vcards-qr-suite-V2
- Rama candidata acumulativa MÁS RECIENTE: `fix/vcard-v1-public-access-20261027` (PR #15). Contiene los desarrollos de la rama de integración #10 junto con los PR apilados #11, #12, #13 y #14.
- La rama `integration/vcards-v2-codex-20261026` (#10) es una **candidata histórica anterior**: no tiene las correcciones nuevas de cuentas, URLs firmadas, CI PostgreSQL, archivado y acceso V1 de #11–#15.
- No se fusionó ningún PR en `main`, no se actualizó vCard en la IP, no se ejecutó código en el servidor real, no se migró ningún registro.
- Los resultados de compilación solo valen para el SHA del run específico. Verificar el último run en https://github.com/LORDMANUEL/vcards-qr-suite-V2/actions.
- El flujo del PR #13 añadió pruebas PostgreSQL con contenedor efímero, y el #14 amplió las pruebas para preservar las filas Scan en archivo/restauración.

## Cobertura funcional lograda en ramas (pendiente validar en staging)
| Alcance | PR principal | Requisito indispensable |
|---|---|---|
| Integridad Company/Branch | #2, #8 | Validar mapeo huérfanos y datos históricos sin deduplicar a ciegas |
| Temas multiempresa | #3, #7, #9 | Confirmar que 9301/9306 no leen formatos incompatibles de Theme.config |
| Editor de tarjetas físicas | #4 | Escanear QR REAL y verificar CR80 doble cara en impresora |
| Portal Manager | #5 | Navegación sin alterar AP, captive portal ni 9301 |
| Documentación / CI | #6 | Revisar checks por SHA |
| Integración conjunta | #10 | Revisión humana de conflictos entre ramas |
| Cuenta de usuario al crear vCard | #11 | Ensayar colisiones concurrentes y roles de sistema |
| Dominios / firmas QR | #12 | Canonical host, certificado, REQUIRE_VCARD_SIGNATURE |
| Pruebas con PostgreSQL | #13 | CI-only (jamás usar db push con la BD real) |
| Archivado reversible y analítica | #14 | QR histórico, Scan intactas, restauración de tarjeta |
| Protección de V1 SSR | #15 | No divulgar tarjeta/usuario archivados, comprobar firma válida |

## Secuencia operativa para Codex (sin escrituras a producción)
1. Traer código e identificar SHA exacto:
```bash
git fetch --all --prune
git checkout fix/vcard-v1-public-access-20261027
git rev-parse HEAD
npm ci
npx prisma validate
npx prisma generate
npm run typecheck
npm test
npm run lint
npm run build
```
2. Revisar los documentos `docs/v2/PR01_INTEGRITY_FIX_2026-10-26.md`, `PR03A_THEME_SCOPES_2026-10-26.md`, `PR07_THEME_BUILDER_ROUNDTRIP_2026-10-26.md`, `PR09_RUNTIME_THEME_SAFETY_2026-10-26.md`, `PR11_VCARD_ACCOUNT_ATOMICITY_2026-10-26.md`, `PR12_PUBLIC_QR_SIGNATURE_2026-10-26.md`, `PR13_POSTGRES_CI_INTEGRATION_2026-10-26.md`, `PR14_VCARD_ARCHIVE_RETENTION_2026-10-27.md` y `PR15_V1_PUBLIC_ACCESS_2026-10-27.md`.
3. Preparar copia aislada de PostgreSQL y datos sintéticos; no aplicar `prisma db push` sobre servidores de producción ni una BD compartida por 9301/9306.
4. Con acceso autorizado al host Debian, ejecutar solo `bash scripts/vcards-release-preflight.sh` para identificar servicios, Node, puertos, red y endpoint HTTP. No imprimir `.env`, secretos ni tokens.
5. Validar con Playwright/E2E (no implementado en estas ramas): acceso con roles autorizados, empresas/sucursales sin duplicar, Theme Builder round-trip, publicación Ford/GAC/Quick Lane independiente, calendario, PDF doble cara, Portal Manager, vCard V1/V2, QR firmado, dominio y métricas.
6. Validar create user+vCard transaccional, rechazo a email de sistema u otra sucursal, archivar/restaurar preservando el mismo `qrCodeData` y Scan, 401/403/404/409 relevantes.
7. Revisar explícitamente el reverse proxy/NAT: a qué servicio apunta `/vcard/[id]`, `/v2/vcard/[id]`, `/portal`, `/api/vcard/[id]`, `/vcards`; verificar si el runtime 9301 comparte BD.
8. Registrar captura de estado anterior, backup de código y DB, restauración ensayada, rollback completo y matriz de permisos. **Detenerse antes de desplegar** hasta autorización del responsable y ventana de cambio.

## Riesgos abiertos que CI no resuelve
- `VCard` no tiene restricción compuesta única `(userId,branchId)` en el esquema y concurrencia HTTP necesita pruebas completas. No agregar `@@unique` sin auditar registros anteriores.
- `Scan` tiene `onDelete: Cascade` a VCard; PR #14 retira un DELETE físico de la API, pero otros endpoints de User/DB podrían seguir eliminando usuarios con cascada. Auditar políticas de retención antes de introducir purgas.
- `REQUIRE_VCARD_SIGNATURE=false` permite acceso sin firma a URLs legadas: debe definirse si se mantiene y auditar QR históricos antes de imponer `true`.
- El mismo secreto NextAuth se usa actualmente para HMAC de QR. Una rotación puede invalidar QR antiguos; requiere una estrategia de clave de firma estable/versionada.
- La API de listados conserva información de vCards archivadas para roles con `canViewVcards`; revisar RBAC y necesidad de auditoría adicional.
- ThemePublication/ThemeVersion por destino y programación totalmente independiente por empresa/sucursal aún son una evolución posterior, no una entrega concluida.
- Archivar usa `isActive`; aún no almacena `archivedAt/archivedBy` en un esquema versionado.
- Tests de navegador, impresión y dispositivos físicos, pruebas de carga 100+ usuarios simultáneos, monitoreo y release en host real **no se han realizado**.

## Definición de listo para despliegue
Se necesita evidencia fechada por SHA, pruebas CI green, validación E2E y RBAC, capturas responsive, pruebas QR reales, validación del FQDN/certificado, matriz de continuidad 9301/9306, backup/restauración ensayados y aprobación de cambio. **No declarar estable de producción solamente por checks de GitHub.**
