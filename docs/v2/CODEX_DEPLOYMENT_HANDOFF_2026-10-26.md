# Entrega a Codex — VCards V2, 26 de octubre de 2026

## Repositorio
`https://github.com/LORDMANUEL/vcards-qr-suite-V2`

### PR abiertos (revisar y fusionar en el orden indicado)
- [#2 — Integridad empresa/sucursal](https://github.com/LORDMANUEL/vcards-qr-suite-V2/pull/2): base **main**, rama `fix/vcards-company-branch-integrity-20261026`.
- [#3 — Publicación de temas por empresa/sucursal](https://github.com/LORDMANUEL/vcards-qr-suite-V2/pull/3): **apilado sobre #2**, rama `feat/vcard-themes-scoped-publishing-20261026`. Cuando #2 se fusione, rebasar #3 sobre main sin arrastrar commits duplicados.
- [#4 — Estudio impresión CR80 y QR firmado](https://github.com/LORDMANUEL/vcards-qr-suite-V2/pull/4): base main, independiente.
- [#5 — Portal Manager y navegación separada](https://github.com/LORDMANUEL/vcards-qr-suite-V2/pull/5): base main, independiente.
- CI + instrucciones de despliegue en este PR de documentación.

## Estado real
Los cambios existen como commits en ramas GitHub y borradores de PR. **No se han ejecutado pruebas en servidor, despliegues, alteraciones de PostgreSQL, actualizaciones de servicio ni merges**. No debe reportarse como implementado en producción hasta completar todas las verificaciones. Las pruebas unitarias propuestas son parciales; se necesitan integración/API, E2E, accesibilidad y pruebas reales de impresora y QR.

## Comprobaciones obligatorias de Codex
1. Inspeccionar diff, rama base, la documentación `docs/v2/`, errores conocidos y la versión real de `main`.
2. Revisar P0 anteriores en `docs/v2/AUDIT_FINDINGS.md` (autorización/firmas, estados inactivos, métricas públicas) y asegurar que no son reintroducidos.
3. Confirmar compatibilidad de TypeScript/Prisma y revisar si Next 14 + ESLint 9 + eslint-config-next 15 rompen `npm run lint` (deuda preexistente). Resolverlo en PR separado sin silenciar errores.
4. En entorno aislado: `npm ci`, `npx prisma validate`, `npx prisma generate`, `npm run typecheck`, `npm test`, `npm run lint`, `npm run build`. Capturar logs **por SHA de commit** y reparar errores antes de marcar QA aprobado.
5. Ejecutar `docs/v2/RECONCILIATION_READONLY_2026-10-26.sql` sobre copia/control read-only. Crear matriz origen→destino por ID y pedir aprobación para cualquier traslado de datos. No hacer deduplicación destructiva ni regenerar QR existentes.
6. Probar multiempresa, selección empresa/sucursal, tema Ford sin tocar GAC/Quick Lane, tema por sucursal, fechas y control de permisos; vCard V1 y V2, URL firmada HMAC y escaneos.
7. Probar estudio de impresión: QR real escaneable y PDF de dos páginas de 85,6 × 54 mm, foto, nombres largos y reverso. No imprimir ni distribuir tarjetas antes de verificar físicamente.
8. Probar Portal Manager y `/portal` público sin modificar API y controlar el acceso por rol; no tocar equipos/nodos en la red aún.

## Preflight en servidor (solo lectura)
La documentación previa identifica 9301 para portal/legacy y 9306 para V2, con posible PostgreSQL compartido. Verificar información vigente en el servidor antes de asumir rutas o servicios:
```bash
hostnamectl
sudo systemctl status vcard-admin-9301 vcard-admin-9306 --no-pager
sudo systemctl cat vcard-admin-9301 vcard-admin-9306
sudo ss -ltnp | grep -E ':(9301|9306)\\b'
curl -sS -I --max-time 10 http://127.0.0.1:9306/login
curl -sS -I --max-time 10 http://127.0.0.1:9301/
```
Nunca publicar la salida de variables de entorno, cadenas `DATABASE_URL`, `NEXTAUTH_SECRET`, contraseñas, claves RADIUS, cookies, session tokens ni datos personales.

## Preparación de publicación (NO ejecutar automáticamente)
- Confirmar propietarios de los servicios, árboles release, base real por fingerprint no sensible, backup pg_dump y restauración probada; identificar si ambos servicios apuntan al mismo DB.
- Merge revisado de PR según dependencias. Fijar SHA exacto y generar build **en staging aislado**; evitar copiar parches directamente sobre release activo.
- Provisionar directorio nuevo versionado para artefacto `9306` y enlazar configuración/secrets existentes sin exponerlos; comprobar usuario/propietario/permisos. No modificar `9301` por defecto.
- Verificar endpoints públicos con IDs de tarjetas de prueba y un QR histórico (sin revelar la firma). Capturas a 360,390,768,1024,1440.
- Únicamente con autorización, ventana de mantenimiento y rollback probado, conmutar servicio 9306 al nuevo release. Verificar logs, métricas y health tras conmutación.
- En caso de falla, restablecer release completo anterior; no cambiar de esquema sin migraciones versionadas y planes revertibles.

## Pendientes fuera de PR presentes
- Reconciliación aprobada de sucursales huérfanas y compañías visualmente duplicadas.
- Theme Builder modo simple/avanzado, ThemePublication y ThemeVersion con cronología por ámbito, migraciones Prisma validadas y preview exacto.
- Impresión masiva/dúplex físico, sangrado, CMYK y pruebas por impresora.
- Gestión real de AP/nodos, políticas de secret management, portal report nav separado y adapters adicionales.
- Revisión completa de autorizaciones en endpoints/telemetría y baselines de seguridad de docs/v2.

## Informe obligatorio tras cada PR
`PR / SHA / diffs revisados / pruebas PASS-FAIL-SKIP con enlaces a logs / evidencia visual / problemas conocidos / decisiones / rollback / próximo PR`.

No afirmar '100% funcional' ni desplegado si no se ha observado el sistema activo en el servidor.
