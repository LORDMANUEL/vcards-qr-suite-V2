# Backend y esquema de datos — VCards V2

## 1. Estado verificado

Documento basado en la inspección de solo lectura realizada el 14 de octubre de 2026 (America/Tegucigalpa).

- Producción cautiva/V1: `vcard-admin-9301.service`, `/home/yc/vcard-system`, puerto 9301.
- Instancia VCards aislada: `vcard-admin-9306.service`, `/home/yc/vcards-fase1-20261014-101842`, puerto 9306.
- Ambas aplicaciones ejecutan Next.js 14.2.28 y Prisma 6.7.0.
- PostgreSQL 17 escucha únicamente en loopback, puerto 5432.
- El servidor mostró dos sesiones con el mismo rol `vcard` y la misma base `vcard_db`. La atribución individual sesión-puerto no pudo verificarse sin consultar credenciales ni datos, pero toda la evidencia disponible indica una base compartida.
- El árbol de 9306 conserva el mismo `prisma/schema.prisma` que 9301 (SHA-256 idéntico durante la auditoría).
- No existe directorio `prisma/migrations`; el repositorio recuperado no contiene historial de migraciones.

## 2. Límite obligatorio para V2

V2 es un rediseño de presentación de `/v2/vcard/[id]`. En esta fase:

- no se modifica `schema.prisma`;
- no se ejecuta `prisma migrate`, `db push`, seed, SQL ni scripts de importación;
- no se crean, actualizan ni eliminan registros;
- no se modifica la semántica de `/vcard/[id]`, los QR existentes ni el portal del puerto 9301;
- no se implementa agenda/CRM hasta disponer de contrato de API, HTTPS, sandbox, autenticación y aprobación explícita;
- cualquier prueba que pueda registrar clics, escaneos o sesiones debe usar mocks o un entorno aislado, nunca producción.

## 3. Modelo lógico observado

| Área | Entidades Prisma | Relaciones o finalidad principal |
| --- | --- | --- |
| Identidad | `User`, `Account`, `Session`, `VerificationToken`, `UserRole` | Autenticación, roles, recuperación y 2FA. `User` puede pertenecer a una sucursal y poseer VCards. |
| Organización | `Company`, `Branch` | Empresa y sucursal; concentran identidad visual y selección de temas. |
| VCards | `VCard`, `Scan` | Tarjeta asociada a usuario/sucursal, QR único, estado y métricas. Los escaneos dependen de la VCard. |
| Temas | `Theme`, `ThemeCategory`, `ThemeType`, `VCardPositionThemeRule` | Temas globales, por empresa, sucursal, temporada o grupo de cargo. |
| Portal cautivo | `AccessPoint`, `AccessPointProvider`, `PortalConfig`, `PortalSession` | Configuración de AP, autorización, sesiones y captura de datos del portal 9301. |
| Contenido | `Promotion`, `Banner`, `CaptivePortalLink` | Contenido promocional y enlaces administrables. |
| Auditoría | `AuditLog` | Registro de acciones administrativas sobre entidades. |

### Relaciones críticas para `/v2/vcard/[id]`

```text
VCard ── userId ──> User
  │                  └── branchId ──> Branch ── companyId ──> Company
  ├── branchId ─────────────────────> Branch
  └── id ──────────> Scan[]

Branch ── vcardThemeId / seasonalVcardThemeId ──> Theme
Company ─ defaultVcardThemeId / seasonalVcardThemeId ──> Theme
Branch + positionGroup ──> VCardPositionThemeRule ──> Theme
```

La ruta V2 observada realiza lecturas de `VCard` y `Theme`. Debe mantener el contrato de datos existente y resolver datos ausentes con estados visuales seguros, sin inventar contenido ni persistir correcciones.

## 4. Datos sensibles y clasificación

El esquema declara información que requiere tratamiento de alto riesgo:

- credenciales y autenticación: hash de contraseña, tokens de sesión/proveedor, secreto 2FA y tokens de recuperación;
- infraestructura: contraseña Wi-Fi y secreto RADIUS;
- datos personales: nombre, correo, teléfono, dirección IP, MAC, VIN, RTN, placa y metadatos de sesión;
- analítica: agente de usuario, geolocalización aproximada, clics y escaneos.

Ningún log, captura, fixture, respaldo, artefacto de CI o PR debe contener estos valores. Las evidencias deben usar identificadores sintéticos o información públicamente visible.

## 5. Superficie backend relevante

La compilación de 9306 contiene no solo V2, sino también rutas administrativas, portal cautivo y APIs con operaciones `POST`, `PUT` y `DELETE`. Por ello, separar el puerto no equivale a aislar el backend ni la base de datos.

Para V2 se permiten únicamente:

- lectura server-side de la tarjeta y su tema;
- generación local de acciones como `tel:`, `mailto:`, URL de mapa y descarga de vCard;
- llamadas de telemetría existentes solo en pruebas con mocks; en producción conservan su contrato actual y quedan fuera de esta modificación.

No se debe reutilizar una API de escritura para suplir carencias del diseño. Toda futura mutación requiere autenticación, autorización por rol, validación, idempotencia cuando aplique, auditoría y pruebas sobre una base aislada.

## 6. Riesgos priorizados

| Prioridad | Riesgo confirmado o sustentado | Impacto | Control requerido |
| --- | --- | --- | --- |
| P0 | Dos instancias usan la misma identidad/base PostgreSQL; el aislamiento por puerto no aísla datos. | Una migración o escritura V2 puede romper V1, QR, portal y administración. | Cero migraciones y cero escrituras. Para cambios futuros, clonar una base sanitizada en un entorno aislado y probar compatibilidad hacia atrás. |
| P0 | No hay migraciones Prisma versionadas ni respaldo contemporáneo de la base verificado. | No existe rollback de esquema demostrable. | Prohibir cambios de esquema; definir política de backup y restauración probada antes de autorizar uno. |
| P1 | 9306 compila toda la superficie API/admin/portal, incluidas rutas mutables. | Exposición accidental y mutaciones fuera del alcance V2. | Restringir red/rutas en una fase aprobada; revisar autorización de cada endpoint antes de publicar. |
| P1 | El esquema contiene secretos de red y datos personales. | Fuga de credenciales o PII en logs, pruebas, respaldos o PR. | Redacción, mínimo privilegio, cifrado y fixtures sintéticos. |
| P2 | No existe health endpoint en las rutas verificadas. | Monitoreo y rollback dependen de pruebas manuales incompletas. | Diseñar un health check sin datos sensibles ni escrituras, fuera de esta fase visual. |

## 7. Criterios para cualquier evolución futura del esquema

Una propuesta de cambio de datos no puede avanzar hasta que existan todos estos elementos:

1. contrato funcional aprobado y matriz de consumidores 9301/9306;
2. repositorio y migraciones versionadas con estrategia expand/contract;
3. backup actual, cifrado y restauración ensayada;
4. entorno PostgreSQL aislado con datos sintéticos o sanitizados;
5. prueba de compatibilidad de V1, V2, QR, administración y portal;
6. consulta de solo lectura para validar el resultado y métricas de error;
7. plan de rollback probado; las migraciones irreversibles requieren una fase separada;
8. autorización explícita para cualquier escritura o despliegue.

## 8. Validación de esta fase

La aceptación de V2 no depende de cambios en base de datos. Se valida mediante build, typecheck, pruebas con dependencias simuladas, revisión de enlaces/acciones y regresión visual. Un HTTP 200 no demuestra integridad de datos ni autoriza afirmar que el backend está completo.
