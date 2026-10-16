# App Flow — Sistema VCards completo

## Propósito y leyenda

Este documento integra experiencia pública, administración, diseño/marketing, analítica, portal cautivo, operación y agenda futura. Se basa en el brief, el chat «Diseñar App Flow V2», las rutas del repositorio y la auditoría 9301/9306.

- **Actual:** flujo observado en el código.
- **Rama:** cambio implementado en `feat/vcards-v2-visual-overhaul`.
- **Futuro bloqueado:** no existe en producción y requiere aprobación.

## Mapa general

```mermaid
flowchart TD
  ENTRY[Entrada] --> PUBLIC{Pública}
  ENTRY --> LOGIN{Administrativa}
  ENTRY --> CAPTIVE{Red cautiva}
  PUBLIC --> QR[QR existente]
  PUBLIC --> LINK[Enlace compartido/directo]
  QR --> ROUTE{Ruta codificada}
  LINK --> ROUTE
  ROUTE --> V1[/vcard/:id/]
  ROUTE --> V2[/v2/vcard/:id/]
  LOGIN --> AUTH[Login / recuperación / 2FA]
  AUTH --> DASH[Dashboard]
  DASH --> ORG[Organización]
  DASH --> CARDS[VCards]
  DASH --> DESIGN[Temas y marketing]
  DASH --> ANALYTICS[Analítica y reportes]
  DASH --> OPS[Logs y backup]
  CAPTIVE --> PORTAL[Portal 9301]
  PORTAL --> ACCESS[Registro/autorización/sesión]
```

## Actores

| Actor | Acceso | Objetivo |
|---|---|---|
| Visitante | Público | Ver/contactar/guardar/compartir VCard |
| Cliente desde QR | Público con señal QR | Igual, con atribución QR |
| Usuario administrativo | Sesión | Operar según permisos |
| Diseñador/marketing | Sesión y permiso | Crear temas/campañas y preview |
| Analista | Sesión y permiso | Consultar uso y exportar |
| Operador de red | Sesión/infra | Portal cautivo, AP y sesiones |
| Servicio externo CRM | Futuro | Disponibilidad y citas |

## Flujo 1 — QR/enlace hacia V1 o V2

**Estado:** V1 actual preservada; controles V2 implementados en rama.

```mermaid
flowchart TD
  SCAN[Escanear QR] --> URL[URL existente]
  SHARE[Abrir enlace] --> URL
  URL --> PATH{Ruta}
  PATH -->|/vcard/:id| V1[V1 preservada]
  PATH -->|/v2/vcard/:id| SIG[Política de firma]
  PATH -->|otra| N404[404]
  SIG -->|inválida cuando es requerida| DENY[Respuesta neutral]
  SIG -->|válida/no requerida| ACTIVE{Tarjeta y usuario activos}
  ACTIVE -->|no| N404V[No disponible]
  ACTIVE -->|sí| RESOLVE[Resolver marca + tema]
  RESOLVE --> HEADER{Tema contiene Header/SeasonalHero}
  HEADER -->|sí| THEMEH[Usar cabecera del tema]
  HEADER -->|no| BRANDH[Usar hero de marca]
  THEMEH --> READY[VCard lista]
  BRANDH --> READY
  READY --> ACTIONS[Acciones]
```

V1 mantiene su URL y comportamiento. No existe migración automática de QR a V2.

## Flujo 2 — Resolución de tema

```mermaid
flowchart TD
  A[Tarjeta válida] --> R{Regla activa por cargo}
  R -->|sí| RT[Tema del cargo]
  R -->|no| BS{Temporada sucursal vigente}
  BS -->|sí| BST[Tema estacional sucursal]
  BS -->|no| BT{Tema sucursal}
  BT -->|sí| BTT[Tema normal sucursal]
  BT -->|no| CS{Temporada compañía vigente}
  CS -->|sí| CST[Tema estacional compañía]
  CS -->|no| CD{Tema predeterminado compañía}
  CD -->|sí| CDT[Tema compañía]
  CD -->|no| G{Tema global activo}
  G -->|sí| GT[Tema global]
  G -->|no| F[Tema legado/fallback neutral]
```

## Flujo 3 — Acciones públicas

```mermaid
flowchart LR
  READY[VCard lista] --> HAS{Dato válido}
  HAS -->|no| HIDE[Ocultar acción]
  HAS -->|sí| CALL[Llamar]
  HAS -->|sí| WA[WhatsApp]
  HAS -->|sí| MAIL[Correo]
  HAS -->|sí| SAVE[Guardar VCF]
  HAS -->|sí| SHARE[Compartir]
  MAIL --> ROLE[Normalizar cargo]
  ROLE --> DRAFT[Borrador mailto editable]
  SAVE --> POLICY[Validar actividad/firma]
  POLICY --> VCF[Descargar VCF]
  SHARE --> WS{Web Share}
  WS -->|sí| NATIVE[Selector nativo]
  WS -->|no| COPY[Copiar enlace]
  CALL --> EVENT[Evento mínimo]
  WA --> EVENT
  DRAFT --> EVENT
  VCF --> EVENT
  NATIVE --> EVENT
  COPY --> EVENT
```

Si una URL no tiene esquema permitido, se bloquea y no se navega.

## Flujo 4 — Telemetría

**Estado de rama:** `sig` se usa como heurística QR y su ausencia como DIRECT. Al compartir una URL firmada la atribución puede seguir como QR; una señal de origen separada es trabajo futuro.

```mermaid
flowchart TD
  OPEN[Apertura] --> SIGNAL{Señal verificable}
  SIGNAL -->|firma/parámetro QR aprobado| Q[QR]
  SIGNAL -->|sin señal QR| D[DIRECT]
  SIGNAL -->|flujo administrativo explícito| M[MANUAL]
  Q --> POST[POST scan]
  D --> POST
  M --> POST
  POST --> MIN[Respuesta mínima: scanId]
  ADMIN[Analista autenticado] --> GET[GET analítica]
  GET --> PERM{Permiso VCards}
  PERM -->|no| FORBID[403]
  PERM -->|sí| DATA[Datos autorizados]
```

## Flujo 5 — Solicitud de cita actual

**Estado:** `mailto:` está implementado técnicamente, pero pendiente de aprobación por negocio. Sin aprobación, el CTA debe ocultarse o mostrarse no disponible.

```mermaid
flowchart TD
  CTA[Solicitar cita] --> EMAIL{Email válido}
  EMAIL -->|no| UNAVAILABLE[Acción oculta/no disponible]
  EMAIL -->|sí| ROLE[Plantilla por cargo]
  ROLE --> MAILTO[Abrir borrador]
  MAILTO --> USER[Usuario revisa y envía]
  USER --> EXTERNAL[Proceso externo/manual]
```

No se guarda formulario, no se consulta disponibilidad y no se confirma una cita.

## Flujo 6 — Agenda CRM futura bloqueada

```mermaid
flowchart TD
  START[Solicitud de cita] --> CONTRACT{Contrato API versionado}
  CONTRACT -->|no| STOP[Continuar canal manual]
  CONTRACT -->|sí| GATES{HTTPS + sandbox + auth + aprobación}
  GATES -->|no| STOP
  GATES -->|sí| SERVICE[Elegir servicio/sucursal]
  SERVICE --> AVAIL[Consultar disponibilidad]
  AVAIL -->|sin cupos| EMPTY[Alternativas]
  AVAIL -->|error| RETRY[Reintento seguro]
  AVAIL -->|cupos| SLOT[Elegir fecha/hora]
  SLOT --> DATA[Datos mínimos + consentimiento]
  DATA --> REVIEW[Revisar solicitud]
  REVIEW --> CREATE[Crear con Idempotency-Key]
  CREATE -->|confirmada| CONFIRM[Folio real]
  CREATE -->|pendiente| PENDING[Estado pendiente]
  CREATE -->|conflicto| REFRESH[Actualizar disponibilidad]
  CREATE -->|error recuperable| RETRY
  CONFIRM --> NOTIFY[Notificación aprobada]
```

## Flujo 7 — Autenticación administrativa

```mermaid
stateDiagram-v2
  [*] --> Login
  Login --> Dashboard: credenciales válidas
  Login --> Error: inválidas/bloqueadas
  Login --> TwoFactor: 2FA requerida
  TwoFactor --> Dashboard: código válido
  TwoFactor --> Error: inválido/expirado
  Login --> ForgotPassword
  ForgotPassword --> ResetRequested
  ResetRequested --> ResetPassword: token válido
  ResetPassword --> Login: contraseña actualizada
  Dashboard --> Unauthorized: módulo sin permiso
  Dashboard --> Login: cerrar sesión/expirar
```

Los detalles de contraseñas, SMTP y tokens no se exponen en UI, logs ni documentación.

## Flujo 8 — Organización y VCards

**Estado:** descriptivo del código existente; no fue rediseñado en esta rama.

```mermaid
flowchart TD
  DASH[Dashboard] --> USERS[Usuarios]
  DASH --> COMP[Compañías]
  DASH --> BRANCH[Sucursales]
  DASH --> VC[VCards]
  USERS --> CRUDU[Crear/editar/activar/importar]
  COMP --> CRUDC[Crear/editar]
  BRANCH --> CRUDB[Crear/editar]
  VC --> LIST[Listar/filtrar]
  LIST --> NEW[Nueva/manual/importar]
  LIST --> EDIT[Editar]
  NEW --> VALIDATE[Validar relaciones y datos]
  EDIT --> VALIDATE
  VALIDATE -->|error| FORM[Mostrar errores]
  VALIDATE -->|válido y autorizado| SAVE[Guardar]
  SAVE --> QR[Identificador/QR existente o generado según lógica actual]
  QR --> PREVIEW[Preview]
  PREVIEW --> PUBLISH{Activa}
  PUBLISH -->|sí| PUBLIC[V1/V2 pública]
  PUBLISH -->|no| HIDDEN[No disponible públicamente]
```

Esta rama no altera el CRUD ni la generación de QR; se documenta para regresión integral.

## Flujo 9 — Temas, banners y promociones

**Estado:** descriptivo del sistema actual; solo cambió la composición pública V2.

```mermaid
flowchart TD
  DESIGN[Diseño/Marketing] --> TYPE{Contenido}
  TYPE --> THEME[Tema VCard/portal]
  TYPE --> BANNER[Banner]
  TYPE --> PROMO[Promoción]
  TYPE --> LINK[Enlace portal]
  THEME --> EDITOR[Editor]
  EDITOR --> SCOPE[Asignar compañía/sucursal/cargo/temporada]
  SCOPE --> PREVIEW[Preview]
  PREVIEW --> VALID{Datos y fechas válidos}
  VALID -->|no| ERR[Corregir]
  VALID -->|sí| SAVE[Guardar autorizado]
  SAVE --> RESOLUTION[Participar en resolución]
  BANNER --> SCHEDULE[Vigencia/zona horaria]
  PROMO --> SCHEDULE
  SCHEDULE --> RESOLUTION
```

El preview no prueba el resultado público por sí solo; QA debe validar la ruta real o fixture protegida.

## Flujo 10 — Analítica, reportes y operación

**Estado:** descriptivo; la rama protege únicamente la lectura de escaneos relacionada con VCards.

```mermaid
flowchart TD
  USER[Usuario autenticado] --> PERM{Permiso}
  PERM -->|no| E403[Acceso denegado]
  PERM -->|sí| AREA{Área}
  AREA --> DASH[Dashboard]
  AREA --> SCANS[Escaneos/clics]
  AREA --> REPORTS[Reportes/exportación]
  AREA --> LOGS[Logs de auditoría]
  AREA --> BACKUP[Backup]
  SCANS --> FILTER[Filtros/rango/origen]
  REPORTS --> FILTER
  BACKUP --> WARN[Mostrar alcance/fecha/riesgo]
  WARN --> CONFIRM[Confirmación explícita]
  CONFIRM --> JOB[Trabajo controlado]
```

Backup y restauración son operaciones de alto riesgo. Esta fase solo respaldó fuente sanitizada; no operó PostgreSQL.

## Flujo 11 — Portal cautivo 9301

**Estado:** descriptivo y no validado funcionalmente en esta fase; no hubo cambios.

```mermaid
flowchart TD
  DEVICE[Dispositivo en red] --> PORTAL[Portal cautivo]
  PORTAL --> INFO[Información/configuración pública]
  PORTAL --> REGISTER[Registro]
  REGISTER --> AUTHZ[Autorizar]
  AUTHZ --> SESSION[Crear sesión]
  SESSION --> INTERNET[Acceso a internet]
  SESSION --> EXPIRE{Expira/revoca}
  EXPIRE -->|sí| REVOKE[Revocar]
  REVOKE --> PORTAL
  OP[Operador] --> AP[Access points]
  OP --> SESSIONS[Sesiones]
  OP --> CONFIG[Configuración]
```

Este flujo es descriptivo. 9301 no se modificó, reinició ni validó destructivamente.

## Matriz de errores

| Caso | Superficie | Resultado esperado | Reintento |
|---|---|---|---|
| ID desconocido/inactivo | Pública | 404 neutral | No automático |
| Firma inválida | Pública | 403/estado neutral | Abrir enlace válido |
| BD/API caída | Pública/admin | 503 o error temporal | Sí, controlado |
| Dato de acción ausente | Pública | Ocultar control | No |
| URL insegura | Pública | Bloquear | Corregir configuración |
| Sin permiso | Admin | 403, no filtrar datos | Solicitar acceso |
| Sesión expirada | Admin | Login con retorno seguro | Sí |
| Validación de formulario | Admin | Errores por campo | Sí |
| Conflicto de agenda | CRM futuro | Refrescar cupos | Sí, idempotente |
| CRM caído | CRM futuro | No confirmar | Sí con backoff |
| Portal/AP no disponible | 9301 | Error operativo aislado | Según runbook |

## Navegación y rutas principales

| Área | Rutas representativas |
|---|---|
| Pública | `/vcard/[id]`, `/v2/vcard/[id]` |
| Acceso | `/login`, `/login/forgot-password`, `/login/reset-password` |
| Inicio/operación | `/dashboard`, `/reportes`, `/logs`, `/backup` |
| Organización | `/usuarios`, `/usuarios-admin`, `/ubicaciones`, `/vcards/companias`, `/vcards/sucursales` |
| VCards | `/vcards`, `/vcards/editor`, `/vcards/manual`, `/vcards/scans` |
| Diseño | `/temas`, `/vcards/temas`, `/vcards/theme-builder`, `/banners`, `/promociones`, `/links` |
| Portal | `/portal`, `/acceso`, `/internet`, `/configuracion/portales`, `/portales/sucursales` |

## Puertas de liberación

1. PR revisado y aprobado.
2. Build, tests, typecheck y lint satisfactorios.
3. Matriz visual 3×5 y accesibilidad revisadas.
4. V1 y QR sin regresión.
5. 9301 sin cambios y health check de solo lectura.
6. Sin migración ni escritura BD.
7. Backup y rollback verificados.
8. Autorización explícita de despliegue.
9. Cero riesgos P0 abiertos o aceptación formal con mitigación, responsable y fecha.
10. HTTPS/proxy, Marketing/Legal y UAT aprobados.
11. Definir backup requerido —fuente, build y, si aplica, BD—, checksum y prueba de restauración; el respaldo fuente no cubre PostgreSQL.

## Preguntas pendientes

- ¿Qué roles exactos acceden a cada módulo administrativo?
- ¿Cuál es el origen estable de marca: slug, compañía, sucursal o nuevo campo futuro?
- ¿Qué canal de agenda manual aprueba negocio?
- ¿Cuál es el contrato oficial del CRM y sus estados?
- ¿Qué métricas y retención autoriza la política de privacidad?
- ¿Se separarán portal cautivo y VCards en despliegues/BD distintos?
