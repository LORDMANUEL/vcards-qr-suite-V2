# PRD — VCards V2

## Estado del documento

- Fecha: 2026-10-14
- Rama objetivo: `feat/vcards-v2-visual-overhaul`
- Estado: propuesta basada en auditoría; implementación y aceptación pendientes
- Superficie modificable: únicamente `/v2/vcard/[id]` y documentación relacionada

## Problema

La plataforma reúne administración, portal cautivo y vCards en una misma aplicación. La V2 agrega una presentación automotriz, pero actualmente duplica encabezados cuando el tema ya contiene un `Header` o `SeasonalHero`, aplica identidad Ford como fallback global y carece de evidencia automatizada o visual suficiente para afirmar paridad entre Ford Yude, GAC Yude y Quick Lane.

Además, la auditoría confirmó defectos transversales que deben tratarse antes de considerar la V2 lista: acceso a tarjetas inactivas, elusión de firma en render SSR/descarga, exposición no autenticada de analítica y clasificación incorrecta de todas las visitas como QR. Estos defectos no se corrigen silenciosamente como parte de un cambio visual: requieren fases y validación explícitas.

## Objetivos

1. Ofrecer una vCard V2 premium, mobile-first y coherente con Ford Yude, GAC Yude y Quick Lane.
2. Mantener intactos `/vcard/[id]`, QR existentes, datos reales, resolución de temas y servicio 9301.
3. Eliminar encabezados visualmente duplicados en V2.
4. Adaptar banners, jerarquía, acciones y animaciones a 360, 390, 768, 1024 y 1440 px.
5. Abrir un borrador `mailto:` según una clasificación de puesto documentada y verificable.
6. Mostrar agenda como capacidad pendiente o enlace aprobado, sin simular integración CRM.
7. Incorporar estados explícitos de carga, tarjeta inexistente/inactiva, error temporal y acción no disponible.
8. Producir evidencia reproducible de build, lint/typecheck, pruebas funcionales, seguridad básica y regresión visual.

## No objetivos

- Modificar, desplegar o reiniciar el portal cautivo del puerto 9301.
- Migrar o escribir PostgreSQL durante desarrollo/QA, salvo telemetría en un entorno aislado expresamente preparado.
- Cambiar `/vcard/[id]` o regenerar QR existentes.
- Integrar agenda con CRM sin contrato de API, autenticación, HTTPS, sandbox y aprobación.
- Desplegar a producción 9306 sin autorización explícita.

## Usuarios y necesidades

| Usuario | Necesidad | Resultado esperado |
|---|---|---|
| Cliente desde QR | Identificar marca y asesor rápidamente | Marca correcta, contacto legible y acciones en un toque |
| Cliente desde enlace | Mismo acceso sin atribución falsa a QR | Visita clasificada como directa o manual |
| Asesor | Recibir consultas contextualizadas | Borrador de correo apropiado a su función |
| Marketing | Controlar diseño por tema | Un solo hero/header, banner responsive y fallback neutro |
| Administrador | Conservar V1 y QR | Cero cambios funcionales en `/vcard/[id]` |
| QA/Operaciones | Decidir si liberar | Evidencia por marca, viewport y flujo; rollback practicable |

## Requisitos funcionales

### RF-01 Resolución pública

- La ruta V2 resuelve por `qrCodeData` existente.
- Una tarjeta o usuario inactivo no se presenta.
- La política de firma se aplica de forma coherente en SSR, API y descarga.
- V1 conserva su URL y comportamiento hasta una migración aprobada.

### RF-02 Identidad visual

- La marca procede de datos estructurados de compañía/sucursal, no de un fallback Ford universal.
- Solo se renderiza una cabecera principal.
- El orden de temas conserva la regla vigente documentada: puesto, temporada de sucursal, tema de sucursal, temporada de compañía, tema predeterminado de compañía, global y legado.

### RF-03 Acciones

- Llamar, WhatsApp, correo, descargar y compartir aparecen solo cuando tienen datos válidos.
- Cada control tiene etiqueta accesible, foco visible y objetivo táctil mínimo de 44×44 px.
- El correo genera asunto y cuerpo según una taxonomía única de puesto, con fallback neutral.
- Las URL configurables aceptan únicamente esquemas permitidos.

### RF-04 Agenda

- Sin contrato CRM, la UI no promete una cita confirmada.
- Puede mostrar “Solicitar cita” únicamente si dirige a un canal aprobado o a un estado informativo.
- Estados futuros: disponibilidad, selección, datos, confirmación, error y reintento.

### RF-05 Telemetría

- QR, DIRECT y MANUAL se distinguen por una señal verificable.
- Clics no exponen información sensible en respuestas públicas.
- La lectura de analítica exige sesión y permiso.

## Requisitos no funcionales

- Accesibilidad WCAG 2.2 AA como objetivo: teclado, contraste, semántica y reducción de movimiento.
- Rendimiento: sin saltos relevantes de layout; imágenes responsivas; evitar banners sobredimensionados.
- Seguridad: validación server-side, esquemas URL permitidos, mínimos datos públicos y cabeceras endurecidas.
- Observabilidad: errores operativos distinguibles sin exponer secretos ni PII.
- Compatibilidad: móvil, tablet y escritorio en navegadores modernos; IE no forma parte del alcance V2 aunque figure en `browserslist`.

## Criterios de aceptación

1. Capturas aprobadas para tres marcas × cinco viewports.
2. Una sola cabecera visible por tarjeta, con identidad correcta.
3. Pruebas de acciones, estados de error, teclado y `prefers-reduced-motion` satisfactorias.
4. V1 y QR existentes pasan regresión sin cambios de URL.
5. Build, typecheck y lint ejecutados con salida conservada; ningún éxito se infiere de un artefacto antiguo.
6. Agenda permanece desconectada de CRM hasta completar las puertas contractuales.
7. No hay migración, escritura de datos de negocio, reinicio ni despliegue durante la preparación del PR.

## Indicadores de éxito

- 0 duplicaciones de cabecera en casos con y sin tema dinámico.
- 0 fallos críticos de accesibilidad en el flujo público.
- 100 % de la matriz visual capturada y revisada.
- 100 % de tarjetas desactivadas bloqueadas en las superficies públicas relevantes.
- Clasificación de visita verificada para QR/DIRECT/MANUAL.

## Bloqueos

- Contrato y sandbox del CRM de agenda: no disponibles.
- Identificadores de tarjetas de prueba representativas de las tres marcas: por confirmar.
- Diseño aprobado fuente y tolerancias de comparación visual: deben adjuntarse al PR.
- Confirmación de si 9301 y 9306 comparten `DATABASE_URL`: no se leyó ningún secreto durante la auditoría.

