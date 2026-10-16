# Auditoría integral — Hallazgos VCards

## Ampliación de alcance — 2026-10-16

La plataforma 9306 no se reduce a `/v2/vcard/[id]`: el inventario actual contiene 45 pantallas, 49 endpoints API, middleware, autenticación NextAuth, Prisma/PostgreSQL, administración organizacional, usuarios, auditoría, respaldos, temas, marketing, reportes, VCards y código legado de portal cautivo. Por instrucción del propietario, la corrección de VCards queda al final; primero se valida y endurece la plataforma completa.

| Prioridad | Hallazgo confirmado | Causa/evidencia | Tratamiento |
|---|---|---|---|
| P0 | Operaciones del portal cautivo siguen expuestas en 9306 | Rutas públicas de registro/sesión/RADIUS pueden escribir PII y autorizar sesiones aunque 9301 ya es el nodo independiente | Modo `VCARDS_ONLY_MODE` para retirar UI/API cautivas únicamente en 9306; 9301 queda intacto |
| P0 | Dependencias vulnerables | `npm audit --omit=dev`: 33 hallazgos de producción (4 críticos, 15 altos, 12 moderados, 2 bajos); directos incluyen Next.js, NextAuth, Plotly, Lodash, Nodemailer y XLSX | Actualización escalonada y pruebas de compatibilidad; no aplicar saltos mayores automáticos |
| P0 | Respaldo inseguro cuando falla `pg_dump` | El fallback JSON serializa usuarios, teléfonos, escaneos y sesiones a disco | Eliminar fallback y fallar cerrado; lista/descarga solo para `SUPER_ADMIN` |
| P0 | HTML/iframe configurables sin política suficiente | `dangerouslySetInnerHTML` e iframes aparecen en runtime y editores | Sanitización, sandbox y allowlist antes de liberar editores |
| P1 | Roles de logs contradictorios | UI permite ADMIN/IT; API esperaba SUPER_ADMIN/ADMIN_AGENCIA | Unificar permiso, limitar resultados y redactar IP |
| P1 | Instalador SSL ejecuta un proceso desde web | Endpoint SUPER_ADMIN llama un script local; HTTPS fue definido como última fase | Deshabilitar por defecto y usar `execFile` sin shell |
| P1 | Ocultar menú no retira módulos cautivos | Rutas y APIs seguían accesibles directamente | Redirigir UI vieja al gestor de nodos y responder 410 en APIs retiradas |
| P1 | Pruebas no portables a Linux | El glob `tests/**/*.test.ts` no fue expandido por el host remoto | Cambiado a `tests/*.test.ts`; validado en VM |

Evidencia operativa: 9306 ejecuta `/home/yc/vcards-fase1-20261014-101842`; 9301 ejecuta `/home/yc/vcard-system`. El respaldo previo de 9306 está en `/home/yc/backups/vcards-9306-pre-20261016-qa`, ocupa 339 MB y contiene 849 archivos, igual conteo que el origen. Producción no fue reiniciada ni reemplazada durante esta fase.

## Alcance y método

Auditoría de solo lectura realizada el 2026-10-14 sobre la fuente activa de 9306, unidades de servicio, respuestas HTTP locales y la instantánea local. No se leyeron `.env`, secretos ni datos personales; no se modificaron archivos, BD, servicios o procesos.

Clasificación:

- **Confirmado:** sustentado por código o respuesta observada.
- **Sospecha:** evidencia parcial; requiere comprobación segura.
- **Bloqueo:** impide cerrar el análisis o implementación.

## Resumen ejecutivo

| Prioridad | Confirmados | Tema |
|---|---:|---|
| P0/P1 | 6 | Firma eludida, analítica pública, estados inactivos, atribución QR, ausencia de migraciones/Git de despliegue |
| P2 | 12 | Branding, duplicación visual, accesibilidad, errores, logging, backups, tooling y arquitectura |
| P3 | 4 | Fallbacks, feedback, mantenibilidad y metadata |

No se declara ningún problema resuelto. No se ejecutó la matriz de QA solicitada.

## Hallazgos confirmados

### SEC-01 — Política de firma eludida en SSR y descarga — P0

- Evidencia: `app/v2/vcard/[id]/page.tsx:5-58` consulta Prisma directamente; `:61-70` recibe `searchParams.sig` pero no lo usa. V1 tiene el mismo hash de archivo.
- Evidencia: `app/api/vcard/[id]/download/route.ts:7-19` tampoco llama `securityCheck`.
- Causa raíz: la política está implementada solo dentro del endpoint JSON.
- Riesgo: `REQUIRE_VCARD_SIGNATURE` no protege las rutas principales.
- Corrección: política server-side compartida y pruebas de matriz firma/ruta.

### PRIV-01 — Lectura de scans sin autenticación — P1

- Evidencia: `app/api/vcards/scans/route.ts:90-150` implementa GET sin sesión ni permiso y devuelve filas en `:116-146`.
- Datos afectados: IP, agente, país y ciudad definidos en `prisma/schema.prisma:164-174`.
- Riesgo: exposición de telemetría personal a quien conozca un ID interno.
- Corrección: exigir sesión y `canViewVcards`, limitar campos y auditar acceso.

### SEC-02 — Tarjetas inactivas siguen públicas — P1

- Evidencia: consultas por `qrCodeData` sin `isActive` ni `user.isActive` en `app/v2/vcard/[id]/page.tsx:5-47`, `app/api/vcard/[id]/route.ts:17-59` y descarga `:12-19`.
- Riesgo: baja administrativa ineficaz.
- Corrección: filtro común para tarjeta y usuario activos; respuesta 404 neutral.

### DATA-01 — Toda apertura se atribuye a QR — P1

- Evidencia: `app/v2/vcard/[id]/client-page.tsx:67-90` registra al montar y `:100-106` fija `scanMethod: 'QR'`. V1 replica el patrón.
- Riesgo: métricas comerciales incorrectas.
- Corrección: señal de origen validada y pruebas QR/DIRECT/MANUAL.

### DATA-02 — Descarga GET tiene efecto lateral — P1

- Evidencia: `app/api/vcard/[id]/download/route.ts:28-36` incrementa contador durante GET.
- Riesgo: crawlers, prefetch y reintentos inflan métricas.
- Corrección: evento separado o mecanismo idempotente; proteger la descarga.

### ARCH-01 — Sin migraciones ni historia Git en despliegue — P1

- Evidencia: `prisma/` contiene solo `schema.prisma`; los tres árboles `/home/yc/...` no contienen `.git`; el usuario de despliegue tampoco dispone de Git.
- Riesgo: esquema y rollback no reproducibles; imposible abrir PR desde servidor.
- Corrección: repositorio local como fuente de verdad, migraciones versionadas y artefacto de despliegue identificable por commit.

### UX-01 — Cabecera duplicada por composición V2 — P2

- Evidencia: `client-page.tsx:395-402` siempre dibuja `AutomotiveBrandHero`; `vcard-theme-runtime.tsx:182-197` puede dibujar `SeasonalHero` o `Header`.
- Corrección: selección exclusiva de cabecera.

### BRAND-01 — Fallback Ford contamina multimarcas — P2

- Evidencia: `automotive-brand-hero.tsx:16-22` clasifica todo lo no GAC/Quick Lane como Ford; `app/layout.tsx:8-11` fija metadata Ford; fallbacks adicionales en cliente V2.
- Corrección: identificador estructurado y fallback neutral; metadata dinámica.

### A11Y-01 — Reducción de movimiento incompleta — P2

- Evidencia: el hero contempla `prefers-reduced-motion`, pero `vcard-theme-runtime.tsx:117-142` define/aplica animaciones sin media query equivalente.
- Corrección: política global V2 y prueba con emulación de movimiento reducido.

### UX-02 — Error de carga presentado como inexistencia — P2

- Evidencia: `client-page.tsx:67-85` descarta estado HTTP y `:210-218` muestra siempre “vCard no encontrada”.
- Corrección: separar 403, 404 y error temporal.

### ARCH-02 — Duplicación y monolitos — P2

- Evidencia: páginas server V1/V2 tienen hash idéntico; clientes comparten la mayor parte de la lógica; existen dos clientes Prisma (`lib/prisma.ts`, `lib/db.ts`). El editor de temas tiene 2 380 líneas.
- Riesgo: divergencia y regresiones.
- Corrección: servicios puros y componentes V2 pequeños sin alterar V1.

### QA-01 — Sin pruebas automatizadas — P2

- Evidencia: no existen `*.test.*`, `*.spec.*` ni `__tests__`.
- Evidencia adicional: `next.config.js:9-11` omite lint durante build.
- Corrección: caracterización V1, unitarias, integración, E2E y visuales.

### OPS-01 — Evidencia de build insuficiente — P2

- El `.build.log` conservado es del 2026-03-18 y no contiene V2. Los artefactos `.next` V2 y `BUILD_ID` son del 2026-10-14, lo que confirma compilación del artefacto servido, no los comandos ni resultados completos de QA.
- Corrección: conservar logs por commit y checksum.

### SEC-03 — Lectura de IP confía en cabecera del cliente — P2

- Evidencia: scans y clicks toman el primer `x-forwarded-for` sin validar proxy.
- Riesgo: evasión de rate limit y datos falsos si el proceso es accesible directamente.
- Corrección: configurar proxies confiables y fuente canónica de IP.

### PRIV-02 — Query completa en logs de middleware — P2

- Evidencia: `middleware.ts:76` registra `search`; `:81-86` procesa MAC y URLs de continuación.
- Riesgo: PII e información sensible en logs.
- Corrección: lista permitida y redacción.

### SEC-04 — URL configurable sin allowlist — P2

- Evidencia: `client-page.tsx:312-320` abre cualquier URL que no empiece por tel/mailto/sms.
- Riesgo: enlace peligroso desde configuración comprometida.
- Corrección: parsear URL y permitir esquemas/orígenes acordados.

### OPS-02 — Backups y comandos sensibles — P2

- Evidencia: `app/api/backup/route.ts:63-72` pasa `DATABASE_URL` a `pg_dump` por línea de comando; fallbacks JSON incluyen usuarios, sesiones y scans en `:81-107` y `:126-152`.
- Riesgo: secreto visible en lista de procesos y backups de PII sin controles documentados.
- Corrección: variables seguras/archivo temporal protegido, cifrado, permisos y retención.

### SEC-05 — Ejecución de SSL mediante shell — P2

- Evidencia: `app/api/admin/install-ssl/route.ts:17-30` interpola dominio en `exec`; la regex permite argumentos iniciados por guion.
- Corrección: `execFile` con argumentos y validación de hostname/allowlist.

### OPS-03 — Unidad 9301 legada fallida — P3

- Evidencia: `vcard-admin-9301.service` está enabled/active; `vcard-9301.service` está disabled/failed y apunta al mismo árbol.
- Riesgo: confusión operativa.
- Corrección: retirar o archivar unidad legada mediante cambio operativo separado y autorizado.

### ARCH-03 — Clasificación de puesto duplicada — P3

- Evidencia: correo y selección de tema usan regex distintas en `client-page.tsx:170-200` y `:248-258`.
- Corrección: taxonomía única, normalización de acentos y pruebas.

## Sospechas pendientes

| ID | Sospecha | Validación requerida |
|---|---|---|
| DB-01 | 9301 y 9306 podrían compartir PostgreSQL | Comparar fingerprint seguro de host/base sin revelar credenciales |
| SEC-06 | Faltan cabeceras en el proxy público | Inspección HTTPS externa, no solo localhost |
| UX-03 | Números locales de WhatsApp pueden carecer de prefijo internacional | Casos reales anonimizados por marca |
| DEP-01 | Next 14 + ESLint 9 + config Next 15 puede romper lint | Ejecutar instalación reproducible y lint en entorno aislado |
| PERF-01 | Imágenes sin optimización pueden degradar LCP | Lighthouse por viewport con activos reales |

## Bloqueos

- Sin contrato, autenticación, HTTPS o sandbox CRM.
- Sin tarjetas de prueba aprobadas para las tres marcas.
- Sin baseline visual oficial adjunto.
- Sin confirmación segura de topología PostgreSQL.
- Sin autorización para despliegue o reinicio.

## Inventario resumido

- 46 rutas/páginas observadas en el build histórico, además de V2 en el artefacto actual.
- Dominios: autenticación, usuarios, compañías, sucursales, temas, vCards, analítica, banners/promociones, backups y portal cautivo.
- Modelos Prisma: Account, Session, VerificationToken, User, Company, Branch, VCardPositionThemeRule, VCard, Scan, Theme, AccessPoint, Promotion, Banner, CaptivePortalLink, AuditLog, PortalConfig y PortalSession.
- Hotspots: theme builder, editor de portal, editor de vCards, links, ubicaciones y runtime de temas.

## Conclusión

La V2 no está lista para declararse resuelta ni desplegarse. La ruta visual puede evolucionar de forma aislada, pero la salida a producción requiere cerrar primero los P0/P1, establecer pruebas y demostrar regresión V1/QR. El portal 9301 permanece fuera del alcance de modificación.

