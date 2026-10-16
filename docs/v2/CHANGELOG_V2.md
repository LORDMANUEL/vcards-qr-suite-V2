# Changelog V2

## 2026-10-16 — Reparación funcional validada en VM aislada

- Añadida selección encadenada Empresa → Ciudad → Sucursal en creación y edición de vCards, con auto-selección cuando solo existe una opción.
- Validada en servidor la relación empresa/sucursal y agrupadas en transacción las escrituras de usuario/vCard.
- Corregida la analítica V1 para enviar el ID interno de la vCard y distinguir acceso QR de acceso directo.
- Eliminado el valor de firma inválida de auditorías y evitado imprimir valores de query string en logs del middleware.
- Reorientada la navegación a VCards y agregado el placeholder no operativo “Administración de portales”; no se modificó el servicio 9301.
- Actualizados identidad global, login, campos accesibles y favicon.
- Corregido el comando de pruebas para que funcione en Windows y Linux.
- Aprobados 7 tests, typecheck, lint sin errores y build en la copia aislada de la VM.
- Generadas 15 capturas fechadas para Ford, GAC y Quick Lane en los cinco anchos requeridos; consola sin errores.

No se ejecutaron migraciones ni escrituras de QA en PostgreSQL. El despliegue de 9306 todavía no forma parte de esta entrada.

## 2026-10-14 — Rama `feat/vcards-v2-visual-overhaul`

- Recuperado y versionado un snapshot saneado del código activo 9306 en GitHub.
- Corregida la duplicación de hero cuando el layout ya contiene `Header` o `SeasonalHero`.
- Centralizadas clasificación de marca/cargo, plantillas `mailto:` y política de URLs públicas.
- Corregido el registro de visitas para usar el ID interno y distinguir QR de acceso directo.
- Protegido el GET de analítica con sesión/rol y reducido el DTO de creación a `scanId`.
- Filtradas vCards y usuarios inactivos en página, API y descarga.
- Aplicada validación de firma a SSR V2 y descarga, con comparación de tiempo constante.
- Añadida agenda por borrador de correo; no almacena datos ni inventa integración CRM.
- Añadido movimiento reducido en V2 y fixture visual desactivado por defecto.
- Alineado el toolchain de lint; typecheck, lint, build y 4 pruebas unitarias aprobados.
- Generadas 15 capturas responsive y una evidencia adicional de movimiento reducido.

No se desplegó código, no se reiniciaron servicios y no se modificó PostgreSQL.

## Auditoría de solo lectura — 2026-10-14

### Documentación

- Se documentó el plan de QA con evidencia real, matriz responsive, controles de seguridad, accesibilidad y criterios de salida.
- No se modificó código de aplicación, esquema, datos, servicios ni configuración de producción.

### Confirmado

- El servicio 9306 publica desde `/home/yc/vcards-fase1-20261014-101842`; 9301 publica desde `/home/yc/vcard-system`.
- Los directorios desplegados no contienen `.git`; la rama y el PR deben originarse en una copia Git separada.
- V2 agrega `AutomotiveBrandHero` antes del layout de temas, confirmando la causa de encabezados apilados.
- El build histórico de 9306 compiló y pasó typecheck, pero omitió lint y registró fallos/reintentos al obtener fuentes externas.
- No existe suite automatizada configurada; los scripts manuales de “test” incluyen escrituras a PostgreSQL.
- El GET anónimo de `/api/vcards/scans` responde 200 y el código devuelve datos de escaneo con IP, agente de usuario y geolocalización.
- El runtime de temas renderiza HTML con `dangerouslySetInnerHTML`, iframes y URLs configurables sin saneamiento/allowlist visible.
- El runtime de temas incluye animaciones propias y Tailwind sin una regla global `prefers-reduced-motion`; solo el hero nuevo declara reducción de movimiento.
- Las respuestas directas de 9301/9306 no incluyen las cabeceras de seguridad revisadas y no ofrecen TLS directo.
- Una VCard V2 inexistente en 9306 muestra estado de inexistencia con HTTP 200 en lugar de 404.

### Pendiente, no declarado resuelto

- Corregir y probar autorización/filtrado de analítica sin exponer datos personales.
- Sanitizar HTML y validar esquemas/hosts de URL; aplicar `sandbox` y allowlist a iframes.
- Corregir estado 404 de V1/V2 sin romper QR ni comportamiento compatible.
- Unificar hero y layout para eliminar duplicación visual.
- Completar `mailto:` por cargo con pruebas; el texto actual contiene secuencias `\\n` literales en varias plantillas.
- Implementar reducción de movimiento integral, foco visible, semántica y pruebas axe/manuales.
- Establecer lint compatible y suite unitaria/integración/Playwright en entorno aislado.
- Producir capturas verificadas para Ford Yude, GAC Yude y Quick Lane en 360/390/768/1024/1440.
- Verificar HTTPS frontal, CSP y demás cabeceras en el punto de entrada público.
- Crear commits y PR pequeños desde la rama Git local; no se hizo commit, push ni despliegue durante esta auditoría.
