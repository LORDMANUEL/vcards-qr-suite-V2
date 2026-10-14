# QA Test Plan — VCards V2

## Estado y límites

Este plan distingue evidencia observada el 14 de octubre de 2026 de validaciones pendientes. La auditoría remota fue de solo lectura: no se ejecutaron builds, linters, scripts que escriben PostgreSQL, reinicios ni despliegues. El portal cautivo 9301 se inspeccionó únicamente con GET/HEAD y no se modificó.

## Evidencia ya obtenida

| Área | Prueba realizada | Resultado real |
|---|---|---|
| Servicios | Inspección de sockets y unidades systemd | 9301 y 9306 estaban activos. 9301 ejecuta `/home/yc/vcard-system`; 9306 ejecuta `/home/yc/vcards-fase1-20261014-101842`. |
| Build publicado | Lectura de `.build.log`, `BUILD_ID` y manifiesto de rutas de 9306 | Build de Next.js 14.2.28 compiló y validó tipos; el lint fue omitido. Hubo reintentos fallidos al descargar Inter desde Google Fonts. El manifiesto contiene V1 y V2. |
| Git | Inspección de los tres directorios del servidor | Ninguno contiene metadatos `.git`; no es posible crear rama, commits o PR desde esos directorios. |
| Rutas públicas | GET/HEAD a rutas sin identificadores reales | `/vcard/nonexistent-audit-id` devuelve 200 en ambos puertos. `/v2/vcard/nonexistent-audit-id` devuelve 404 en 9301 y 200 en 9306; el HTML muestra estado de tarjeta inexistente, pero no utiliza estado HTTP 404 en 9306. |
| API protegida | GET anónimo a temas y banners con ID ficticio | `/api/vcard-themes`, `/api/themes/{id}` y `/api/banners/{id}` respondieron 401 en 9301 y 9306. |
| Privacidad de analítica | GET anónimo a `/api/vcards/scans?vcardId=nonexistent-audit-id&limit=1` | Respondió 200 en 9301 y 9306. El código devuelve registros completos de `Scan`, que incluyen IP, agente de usuario, país y ciudad. No se consultó un ID real para evitar exponer datos personales. |
| Cabeceras/TLS directo | HEAD y negociación TLS local | No se observaron CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy ni Permissions-Policy. 9301/9306 sirven HTTP y rechazan TLS directo; debe verificarse por separado cualquier proxy HTTPS frontal. |
| Cobertura existente | Revisión de scripts y configuración | No hay configuración Jest, Vitest, Playwright, axe ni Lighthouse. `package.json` solo define build/start/lint. Los scripts `test_create.js`, `test_vcard.js` y `test-vcard-flow.js` escriben datos reales y no deben usarse contra la BD compartida. |
| Responsive/visual | Revisión estática | El CSS usa breakpoints y contenedores responsivos, pero no hay capturas ni pruebas visuales reproducibles para Ford, GAC y Quick Lane. No se declara aprobado. |

## Gating obligatorio antes de cambios

1. Trabajar desde la copia Git local, nunca desde el directorio servido.
2. Usar una base aislada con datos ficticios; prohibido apuntar las pruebas a `vcard_db` compartida.
3. Crear fixtures sintéticos para Ford Yude, GAC Yude y Quick Lane, con variantes de foto y datos faltantes.
4. No recopilar datos de agenda hasta disponer de HTTPS, consentimiento, contrato de API del CRM y aprobación.
5. Tratar cualquier HTML, URL, iframe, imagen o vídeo configurado en temas como entrada no confiable.

## Matriz de validación pendiente

## Ejecución local posterior a la auditoría — 2026-10-14

| Control | Resultado |
|---|---|
| Instalación reproducible | Aprobada después de alinear ESLint/Next y Nodemailer/NextAuth; `npm ci` terminó sin `--force` |
| Pruebas unitarias | 4/4 aprobadas para marca, cargo, mailto/cita y URLs seguras |
| Typecheck | Aprobado con `tsc --noEmit --incremental false` |
| Lint | Aprobado sin errores; quedan advertencias heredadas de imágenes y hooks |
| Build | Aprobado; incluye `/vcard/[id]`, `/v2/vcard/[id]` y fixture QA protegido |
| Capturas | 15 capturas aprobadas técnicamente en 360/390/768/1024/1440, más variante de movimiento reducido |
| PostgreSQL | No conectado, no migrado, no escrito |
| Producción | No desplegada ni reiniciada |

Evidencia: `docs/v2/evidence/README.md` y `docs/v2/evidence/visual/`.

Ejecutar para cada marca en 360, 390, 768, 1024 y 1440 px:

- V2 con tema completo, sin tema y tema estacional dentro/fuera de vigencia.
- Perfil con/sin foto, teléfono, email, sitio y dirección.
- Un solo encabezado visual; jerarquía de títulos coherente; sin overflow horizontal ni CLS visible.
- Acciones llamar, WhatsApp, email por cargo, guardar VCF, compartir y agenda.
- Teclado completo, foco visible, lector de pantalla, zoom 200 %, contraste WCAG 2.2 AA y objetivos táctiles.
- `prefers-reduced-motion: reduce` debe desactivar animaciones del hero, bloques configurables y clases Tailwind animadas.
- URLs externas limitadas a esquemas y hosts permitidos; iframes con allowlist y `sandbox`; HTML sanitizado.
- V1 debe conservar contenido, rutas, QR y acciones; 9301 solo recibe verificaciones GET/HEAD.

## Pruebas automatizadas por incorporar

- Unitarias: selección de marca, precedencia/vigencia de temas, clasificación de cargos y construcción/codificación de `mailto:`.
- Unitarias de seguridad: sanitización de HTML, rechazo de `javascript:`/`data:` no permitido, allowlist de iframe/media y limpieza de cabeceras proxy.
- Integración: 404 real para QR inexistente, descarga VCF válida, analítica POST con límites, y autorización/aislamiento de GET de analítica.
- Componentes con `jest-axe` o equivalente para hero, tarjeta, acciones, estados loading/empty/error y layouts configurables.
- Playwright: matriz de 15 viewports/marcas, navegación por teclado, acciones interceptadas sin llamadas externas, screenshots deterministas y comparación visual.
- Seguridad: pruebas de control de acceso por rol, CSRF donde aplique, abuso de rate limit, cabeceras, CSP y XSS almacenado.
- Rendimiento: Lighthouse móvil/escritorio y presupuestos para LCP, CLS, INP y peso de medios.

## Criterios de salida

- Build, typecheck y lint pasan sin omisiones.
- Suite unitaria/integración/E2E verde en entorno aislado.
- Cero violaciones axe de impacto serious/critical; revisión manual de teclado y lector de pantalla completada.
- Las 15 capturas base y sus variantes clave están adjuntas y revisadas.
- V1 y QR existentes pasan regresión; 9301 permanece sin cambios.
- Hallazgos de privacidad y contenido activo quedan corregidos y verificados antes de aprobar el PR.
- Rollback ensayado sin tocar PostgreSQL compartido.

## Limitaciones actuales

- No se usaron identificadores ni datos reales por privacidad.
- No se ejecutaron los scripts existentes porque escriben en la base compartida.
- No se validó el proxy público ni un certificado HTTPS frontal.
- No se realizó prueba visual dinámica por marca: faltan fixtures sintéticos y entorno de ejecución aislado.
- Un log histórico de build no equivale a una nueva validación del código local.
