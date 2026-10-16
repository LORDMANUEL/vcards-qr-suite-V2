# Development Plan — VCards V2

## Orden de ejecución vigente desde 2026-10-16

1. **Plataforma y límites operativos:** inventario completo, respaldo verificable, separación 9306/9301 y retirada de superficies cautivas del 9306.
2. **Seguridad transversal:** autenticación/roles, logs, respaldos, endpoints administrativos, dependencias, contenido activo y privacidad.
3. **Administración central:** dashboard, usuarios, empresas, ciudades, sucursales, configuración, reportes y estados de error/carga/vacío.
4. **Diseño y marketing:** temas, banners, promociones y editores con controles seguros, previsualización y flujo corporativo.
5. **Administración de nodos:** placeholder navegable; conectores e ID/Key quedan bloqueados hasta crear el nodo y su contrato.
6. **VCards al final:** creación/edición, temas por marca/cargo, V1/QR, V2 premium, acciones, agenda por correo y matriz visual 3×5.
7. **HTTPS al final:** después de pruebas completas, dominio definitivo, proxy, certificados y reversión.
8. **Un solo cambio productivo:** release versionado, smoke tests, cambio exclusivo de 9306 y rollback ante regresión; 9301 no se reinicia.

## Reglas de ejecución

- Trabajar solo en `feat/vcards-v2-visual-overhaul` dentro del repositorio local.
- Commits pequeños y temáticos; no mezclar seguridad, UI y configuración operativa.
- No tocar 9301, datos PostgreSQL, QR ni V1 durante la fase visual.
- No desplegar ni reiniciar servicios sin autorización explícita.
- Ningún hallazgo se marca resuelto sin prueba y evidencia asociada.

## Fase 0 — Baseline y puertas

1. Verificar rama, árbol limpio y remoto autorizado.
2. Conservar inventario y hashes de V1.
3. Identificar tarjetas de prueba anonimizadas por marca.
4. Acordar maquetas aprobadas y tolerancias visuales.
5. Confirmar, sin exponer credenciales, si 9301 y 9306 apuntan a la misma BD.
6. Definir entorno aislado o mocks para telemetría y estados de datos.

Salida: baseline reproducible y cero cambios en producción.

## Fase 1 — Documentación y pruebas de caracterización

- Consolidar PRD, TRD, UI/UX, App Flow, esquema backend, QA, auditoría y rollback.
- Añadir pruebas que describan V1 sin modificarla.
- Cubrir resolución de tema, clasificación de marca/puesto y render básico V2.
- Registrar incompatibilidades reales de lint/typecheck antes de corregirlas.

Salida: suite inicial que falla únicamente por defectos conocidos y documentados.

## Fase 2 — Composición visual V2

- Extraer componentes V2 pequeños.
- Resolver marca estructurada con fallback neutral.
- Renderizar exactamente una cabecera.
- Ajustar hero, perfil, acciones, banners y footer para cinco viewports.
- Aplicar reducción global de movimiento en V2.

Salida: pruebas de componentes y capturas preliminares para tres marcas.

## Fase 3 — Acciones y estados

- Unificar clasificación de puesto y plantillas de correo.
- Validar teléfono, WhatsApp y esquemas de URL.
- Añadir estados diferenciados 403/404/5xx/offline.
- Mantener agenda desconectada; añadir solo canal aprobado o estado informativo.

Salida: pruebas funcionales de cada acción y estado.

## Fase 4 — Seguridad pública y analítica

Esta fase debe revisarse separadamente porque afecta contratos compartidos:

- Aplicar política de firma/actividad a SSR, API y descarga.
- Proteger lectura de scans con sesión y permiso.
- Minimizar respuestas de telemetría.
- Clasificar QR/DIRECT/MANUAL correctamente.
- Revisar confianza de proxy, rate limit y comparación de firma.

Salida: pruebas de autorización, abuso y regresión. Si el cambio puede afectar QR existentes, mantenerlo tras feature flag hasta aprobación.

## Fase 5 — QA integral

- Build limpio desde checkout nuevo.
- Lint y typecheck explícitos.
- Pruebas unitarias, integración y E2E.
- Matriz visual 3×5.
- Accesibilidad automatizada y manual.
- Regresión V1 y verificación de QR.
- Verificación read-only de 9301.

Salida: informe con comandos, versiones, resultados, fallos y rutas a evidencias.

## Fase 6 — PR y revisión

- PR contra rama acordada, nunca directamente a producción.
- Descripción con alcance, riesgos, capturas, resultados, limitaciones y rollback.
- Checklist de seguridad y base de datos.
- Revisión de diseño, backend, QA y operaciones.

Salida: PR revisable. No implica autorización de despliegue.

## Estrategia de commits propuesta

1. `docs(v2): add audited product and technical baseline`
2. `test(v2): characterize public vcard behavior`
3. `refactor(v2): isolate brand and theme composition`
4. `feat(v2): implement responsive single-header layout`
5. `feat(v2): add accessible actions and error states`
6. `fix(security): enforce public vcard policy`
7. `test(v2): add visual and regression evidence`

## Matriz de validación

| Área | Técnica | Evidencia obligatoria |
|---|---|---|
| Build | instalación bloqueada por lockfile + build | log completo y código de salida |
| Tipos | `tsc --noEmit` o script acordado | log completo |
| Lint | configuración compatible y comando explícito | log y lista de excepciones |
| Unitarias | marca, puesto, tema, URL, firma | reporte |
| Integración | SSR/API/descarga/analítica | reporte sin PII |
| E2E | acciones y errores | video/traza o capturas |
| Visual | 3 marcas × 5 viewports | 15 capturas mínimas |
| Accesibilidad | axe + teclado + movimiento reducido | reporte y capturas |
| V1 | rutas y QR existentes | comparación baseline |

## Rollback de desarrollo

- Revertir commits V2 en orden inverso.
- No eliminar datos ni ejecutar migraciones destructivas.
- Mantener V1 como camino estable.
- Si una corrección transversal no es compatible, desactivarla mediante flag y volver al contrato previo documentado.

## Bloqueos actuales

- No hay contrato CRM.
- No hay pruebas existentes.
- No hay migraciones Prisma.
- La compatibilidad del stack de lint está sin verificar.
- No se ha aprobado la matriz visual.
- No existe evidencia actual de pruebas satisfactorias V2; el build remoto activo demuestra compilación, no QA.

