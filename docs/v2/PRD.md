# PRD — Plataforma VCards y experiencia pública V2

## Control del documento

| Campo | Valor |
|---|---|
| Fecha | 2026-10-15 |
| Estado | Candidato para revisión en PR |
| Fuentes | Brief VCards V2, chat «Diseñar App Flow V2», auditoría del código y servicios 9301/9306 |
| Rama | `feat/vcards-v2-visual-overhaul` |
| Ámbito implementado | `/v2/vcard/[id]`, controles públicos asociados, pruebas y documentación |
| Ámbito documentado | Administración, VCards, temas/marketing, portal cautivo, analítica y operación |

## Resumen ejecutivo

La plataforma reúne gestión de usuarios, compañías, sucursales, tarjetas digitales, temas, banners, promociones, analítica y portal cautivo. La experiencia pública V1 debe mantenerse estable. La V2 ofrece una presentación premium para Ford Yude, GAC Yude y Quick Lane sin cambiar los QR existentes ni prometer una integración de agenda que todavía no tiene contrato técnico.

Esta fase entrega una V2 aislada y revisable, corrige fallos de seguridad directamente relacionados con su exposición pública y documenta el sistema completo. No despliega, no migra PostgreSQL y no modifica el servicio 9301.

## Problema y oportunidad

### Problemas confirmados en la línea base

1. La V2 insertaba un hero adicional aun cuando el tema contenía `Header` o `SeasonalHero`.
2. Marcas no reconocidas heredaban identidad Ford.
3. Metadatos y fallbacks no eran específicos por marca.
4. Tarjetas o usuarios inactivos podían alcanzarse por algunas superficies públicas.
5. SSR y descarga no aplicaban la misma política de firma que la API.
6. La lectura de escaneos estaba expuesta sin el control de autorización esperado.
7. Las visitas directas se registraban como QR.
8. El CTA de agenda no representaba un flujo CRM real.
9. No existían pruebas automatizadas ni matriz visual reproducible.
10. Portal cautivo y VCards comparten plataforma y potencialmente PostgreSQL, elevando el riesgo transversal.

### Oportunidad

Convertir la apertura de una tarjeta en una acción útil —contactar, guardar, compartir o solicitar cita— sin comprometer compatibilidad, privacidad ni operación.

## Visión

Una plataforma para administrar identidades comerciales y publicar tarjetas digitales de marca, donde cada persona pueda ser contactada en un toque, cada interacción sea medible con privacidad y cualquier integración externa se habilite solo tras cumplir requisitos contractuales y técnicos.

## Objetivos

- Presentar una VCard V2 profesional y mobile-first para Ford Yude, GAC Yude y Quick Lane.
- Mantener `/vcard/[id]`, QR existentes, datos reales y servicio 9301 sin regresiones.
- Conservar temas por compañía, sucursal, cargo y temporada.
- Hacer que llamada, WhatsApp, correo, guardar y compartir ejecuten la acción descrita.
- Abrir correo editable y contextualizado por cargo; nunca enviarlo automáticamente.
- Tratar agenda como solicitud, no confirmación, hasta contar con CRM, HTTPS y aprobación.
- Reducir exposición pública y proteger la analítica administrativa.
- Proporcionar documentación y evidencia para una decisión de despliegue separada.

## No objetivos de esta fase

- Desplegar o reiniciar 9306.
- Modificar, parar o reiniciar 9301.
- Cambiar red, NAT, firewall, proxy o certificados.
- Migrar, resembrar o escribir datos de negocio en PostgreSQL.
- Rediseñar todo el panel administrativo.
- Cambiar V1 o regenerar QR.
- Implementar CRM, reservar horarios o capturar datos personales de citas.
- Resolver automáticamente toda la deuda o vulnerabilidades transitivas.

## Personas

| Persona | Objetivo | Fricción | Necesidad prioritaria |
|---|---|---|---|
| Cliente desde QR | Contactar al asesor | Identidad o CTA ambiguos | Reconocer marca/persona y actuar en un toque |
| Cliente desde enlace | Consultar tarjeta compartida | Atribución falsa a QR | Misma experiencia, origen correcto |
| Asesor de ventas | Recibir oportunidades | Correos genéricos | Borrador con intención comercial |
| Servicio/repuestos | Recibir solicitudes pertinentes | Mensaje no adaptado | Plantilla según función |
| Administrador | Mantener organización y tarjetas | Superficie amplia y deuda | Operación con permisos y auditoría |
| Marketing/diseño | Controlar temas y campañas | Riesgo de hero duplicado | Composición única y previews |
| Operaciones/QA | Decidir si liberar | Falta de evidencia | Pruebas, capturas y rollback |
| Administrador de red | Operar portal cautivo | Acoplamiento con VCards | Cero impacto en 9301 |

## Dominios del producto

| Dominio | Capacidades existentes | Resultado esperado |
|---|---|---|
| Identidad y acceso | Login, recuperación, 2FA, roles | Acceso administrativo seguro |
| Organización | Compañías, sucursales, usuarios | Contexto empresarial consistente |
| VCards | Crear, editar, importar/exportar, publicar, escanear | Tarjetas compatibles y medibles |
| Diseño/marketing | Temas, editor, banners, promociones, enlaces | Experiencia de marca gobernada |
| Portal cautivo | AP, autorización, sesiones, RADIUS | Operación independiente de V2 |
| Analítica/operación | Dashboard, clics, reportes, logs, backup | Visibilidad protegida y recuperación |

## Casos de uso prioritarios

### CU-01 Abrir VCard pública

El cliente escanea un QR o abre un enlace. La ruta codificada resuelve V1 o V2 sin redirección implícita. V2 aplica firma/actividad y compone marca/tema; V1 se conserva sin endurecimiento en esta fase para no romper QR.

### CU-02 Contactar a una persona

El cliente llama, abre WhatsApp o crea un borrador de correo. Solo aparecen acciones con datos válidos. El correo incluye asunto y cuerpo según el grupo de cargo.

### CU-03 Guardar o compartir

El cliente descarga un VCF validado o usa Web Share. Si Web Share no existe, copia el enlace. Agenda nunca descarga VCF.

### CU-04 Solicitar cita

Sin CRM aprobado, el CTA abre un borrador por correo y deja explícito que no es confirmación. En una fase futura, el CRM devolverá disponibilidad y folio reales.

### CU-05 Administrar contenido

Un usuario autorizado mantiene organización, personas, VCards, temas, banners y promociones. El rediseño de esos paneles no forma parte de esta fase, pero sus flujos entran en regresión.

### CU-06 Analizar uso

Un usuario autorizado consulta escaneos y clics. El público puede registrar eventos mínimos, pero no leer analítica ni recibir IP, ubicación o agente.

## Requisitos funcionales

### RF-01 Resolución pública — Must

- Mantener V1 y V2 separadas.
- Resolver identificadores existentes sin regenerar QR.
- Aplicar estado activo de tarjeta y usuario.
- Aplicar firma coherente en SSR, API y descarga.
- Responder neutralmente cuando no existe o está inactiva.

### RF-02 Identidad y composición — Must

- Resolver `FORD`, `GAC`, `QUICK_LANE` o `GENERIC`.
- Usar identidad neutral ante ambigüedad.
- Renderizar una sola cabecera.
- Conservar precedencia de temas por cargo, temporada, sucursal, compañía, global y legado.

### RF-03 Acciones — Must

- Ocultar acciones sin datos válidos.
- Validar esquemas URL.
- Diferenciar llamada, WhatsApp, correo, VCF, compartir y cita.
- Mantener objetivos táctiles de 44×44 px y etiquetas accesibles.

### RF-04 Correo por cargo — Must

- Normalizar acentos y sinónimos.
- Soportar ventas, servicio, repuestos, gerencia y fallback.
- Codificar destinatario, asunto y cuerpo.
- Abrir el cliente del usuario sin envío automático.

### RF-05 Agenda — Must seguro / Could CRM

- Actualmente, abrir solicitud por correo o comunicar indisponibilidad.
- No persistir datos de cita por HTTP.
- El CRM futuro exige contrato, sandbox, autenticación, consentimiento, idempotencia y HTTPS.

### RF-06 Telemetría — Must

- Usar provisionalmente presencia de `sig` como heurística QR y ausencia como DIRECT, declarando su limitación.
- Diseñar a futuro una señal de origen separada de la firma que no sobreviva erróneamente al compartir el enlace.
- Responder a escritura con identificador mínimo.
- Exigir sesión y permiso para lectura.
- No exponer IP, user-agent o localización.

### RF-07 Administración — Should, sin rediseño

- Mantener CRUD y permisos de usuarios, compañías, sucursales, VCards, temas y marketing.
- Mantener importación/exportación y preview existentes.
- Registrar endurecimiento pendiente como deuda, no como requisito cumplido.

### RF-08 Portal cautivo — Must preservar

- Mantener 9301 fuera de la liberación V2.
- No cambiar autorización, RADIUS, sesiones, AP o configuración de portales.
- Ejecutar regresión de no impacto antes de cualquier despliegue futuro.

## Historias y aceptación

| ID | Historia | Aceptación verificable |
|---|---|---|
| HU-01 | Reconocer marca y asesor | Nombre, cargo, compañía y marca visibles; una cabecera; sin fallback Ford incorrecto |
| HU-02 | Contactar en un toque | Cada CTA visible funciona; ninguno es inerte |
| HU-03 | Escribir correo relevante | Borrador editable con plantilla correcta por cargo |
| HU-04 | Solicitar cita sin engaño | Se indica solicitud; no hay folio/confirmación sin CRM |
| HU-05 | Evitar animaciones | `prefers-reduced-motion` elimina movimiento no esencial |
| HU-06 | Conservar V1 y QR | Rutas y contratos existentes pasan regresión |
| HU-07 | Consultar eventos con permiso | Analítica rechaza sesión o permiso ausentes |
| HU-08 | Revertir | Rollback de código documentado; no hay rollback BD porque no hay migración |

## Requisitos no funcionales

- **Accesibilidad:** WCAG 2.2 AA como objetivo, no certificación; teclado, foco, contraste, semántica y movimiento reducido requieren UAT.
- **Responsive:** 360, 390, 768, 1024 y 1440 px sin overflow.
- **Rendimiento:** reservar espacio multimedia y evitar decoraciones bloqueantes.
- **Seguridad:** autorización server-side, URL segura, mínimo dato y secretos fuera del repo.
- **Privacidad:** no captar agenda antes de HTTPS/consentimiento; minimizar analítica.
- **Compatibilidad:** navegadores modernos; V1 como baseline estable.
- **Operabilidad:** build reproducible, health checks y rollback.

## Metas y puertas (no resultados productivos)

- 15/15 combinaciones marca/viewport revisadas.
- 0 encabezados duplicados.
- 0 fallos unitarios, de tipos o build.
- 0 errores de lint; advertencias heredadas inventariadas.
- 0 cambios de esquema o datos.
- 0 cambios o reinicios en 9301.
- 0 riesgos P0 abiertos, o aceptación formal con mitigación y responsable.
- HTTPS/proxy, assets de marca y UAT aprobados antes de desplegar.

Métricas posteriores: tasa de acción por tipo, distribución QR/directo, errores de render/descarga y conversión de solicitudes. No se fija objetivo comercial sin baseline confiable.

## Roadmap

| Fase | Prioridad | Contenido | Salida |
|---|---|---|---|
| 0 Auditoría | P0 | Inventario, riesgos, respaldo fuente | Evidencia aceptada |
| 1 V2 segura | P0 | Marca, composición, acciones y controles | Build/tests/matriz visual |
| 2 Endurecimiento | P0/P1 | Dependencias, CSP, rate limit, URLs configurables | Revisión de seguridad |
| 3 UAT | P0 | Datos autorizados y aprobación de marca | Aprobación negocio/marketing |
| 4 Despliegue | P0 | Backup, publicación atómica, rollback | Autorización explícita |
| 5 Agenda CRM | P1 futuro | Contrato, sandbox, consentimiento, idempotencia | Contrato y HTTPS |
| 6 Separación | P2 | Reducir acoplamiento portal/VCards | ADR y plan aprobado |

## Riesgos y decisiones

| Riesgo/decisión | Estado | Propietario sugerido |
|---|---|---|
| Contrato/sandbox CRM | Bloqueado | Negocio/Proveedor/Arquitectura |
| HTTPS | Bloqueado para formularios | Infraestructura |
| Assets y derechos de marca | Requiere aprobación | Marketing/Legal |
| PostgreSQL compartido | Riesgo alto; secretos no inspeccionados | Infraestructura/DBA |
| Vulnerabilidades transitivas | Confirmadas; remediación controlada | Ingeniería/Seguridad |
| UAT representativa | Pendiente | Negocio/QA |
| Tolerancia visual | Pendiente | Diseño/QA |

## Definición de terminado

La fase termina cuando código, documentos, pruebas y capturas están en PR; los riesgos abiertos están declarados; no hubo producción/BD/9301; y un revisor puede decidir sobre la liberación con evidencia. “PR listo” no significa “desplegado”.
