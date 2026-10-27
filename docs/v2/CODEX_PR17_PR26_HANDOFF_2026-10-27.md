# Lote PR #17–#26 — consolidación para Codex
**Corte:** 2026-10-27. **Rama acumulativa:** `security/vcards-company-branch-directory-rbac-20261027` (PR #26).
No fusionar con `main` ni desplegar sin QA de staging.

## Diez PRs apilados: cambios de código y pruebas
| PR | Riesgo / solución |
|---|---|
| #17 | GET escaneos: fechas día Honduras y límites de paginación |
| #18 | POST escaneos: IDs, métodos y rate config válidos |
| #19 | VCF: nombre seguro, no-store y estadísticas tras serialización |
| #20 | PUT vCard: RBAC, bloqueo archivadas, usuarios con tarjetas múltiples |
| #21 | POST Branch: FK Company obligatorio, duplicados y tema de otra marca |
| #22 | POST Company: cada compañía recibe borrador propio, no reutiliza tema por nombre |
| #23 | PUT/DELETE Company: remueve regresión que creaba, renombraba y huérfanaba Branch |
| #24 | Metadata V2: firma QR previa a lectura de nombres; noindex |
| #25 | GET reportes: rol y sucursal del solicitante |
| #26 | GET directorios: rol y sucursal del solicitante |

**Orden de integración:** #17 → #18 → #19 → #20 → #21 → #22 → #23 → #24 → #25 → #26. El #17 depende de #16; las dependencias no se satisfacen fusionando PRs fuera de orden.

## Pruebas propuestas
- GitHub Actions del SHA final: Prisma validate/generate, TypeScript, tests unitarios, PostgreSQL efímero, lint y build. No confiar solo en CI de PR base.
- Staging BD copia anonimizada: Admin global, IT, Marketing SPS, Marketing TGU, usuario sin sucursal y ADVISOR; probar API y UI con datos de Ford Yude, GAC Yude, Quick Lane.
- Validar /api/vcards/scans con horarios límites 00:00/23:59 America/Tegucigalpa, paginación inválida, rate limit, vCard inexistente, archivada, y permisos de otras sedes.
- Crear empresa y sucursal legítimas; impedir sucursales fantasma, nombres repetidos y vinculación de tema de marca diferente. PUT Company no toca Branch ID/ciudad/QR/temas. DELETE con Branch responde 409 sin orfandad.
- Editar vCard con una cuenta que tenga 2 tarjetas: debe rechazar modificación de perfil compartido. Usuario archivado/inactivo no se reactivará por PUT parcial.
- Descargar contacto desde QR firmado en Chrome/Android/iOS; filename sin caracteres peligrosos y total descargas consistente. Capturas 360/390/768/1024/1440.
- Invalidar HMAC en V2: ninguna metadata personal. QR histórico válido y tarjeta activa sigue visible bajo política actual.

## Riesgos pendientes fuera del lote
- Programación independiente por sede (`ThemePublication/ThemeVersion`) y pruebas completas Theme Builder/PDF físico.
- Capa de scan-rate basada en IP confía en X-Forwarded-For; requiere modelo de proxy de confianza y pruebas específicas antes de exposición pública.
- No hay aislamiento de todos los endpoints de portal y de administración; revisar consistencia global de RBAC.
- Un mismo User con varias vCards continúa sin editor administrativo de perfil compartido; el PR #20 bloquea cambios indirectos.
- Duplicados en Company/Branch históricos requieren auditoría y una migración aprobada; los controles de API no eliminan datos ya duplicados.
- Algunas aplicaciones cliente con manager global sin `branchId` pueden recibir 403 en directorios/reportes: validar contrato de roles con responsable.
- Los temas utilizados por distintas empresas necesitan mecanismo explícito de clonado/versionado; no compartir IDs en silencio.

## Instrucciones para Codex
```bash
git fetch origin
git checkout security/vcards-company-branch-directory-rbac-20261027
git rev-parse HEAD
npm ci
npx prisma validate
npx prisma generate
npm run typecheck
npm test
npm run lint
npm run build
```
Revisar los 10 documentos `docs/v2/PR17_...` a `PR26_...` y CI por SHA. La prueba PostgreSQL de GitHub Actions usa **BD efímera**; no ejecutar `prisma db push` en la IP productiva. Diagnóstico Debian solo lectura: `bash scripts/vcards-release-preflight.sh` tras autorización.

## Decisión de release
Mantener vCards públicas V1/V2, firmas HMAC y servicios 9301/9306 intactos durante desarrollo. Codex debe adjuntar métricas y capturas E2E, backup PostgreSQL y simulación de restauración, inventario de rutas/proxy y plan de rollback. Solo después de aprobación humana de la ventana de cambio se planifica producción. CI verde no reemplaza esas evidencias.
