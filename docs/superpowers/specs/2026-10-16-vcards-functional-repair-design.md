# Diseño — Reparación funcional y enfoque VCards

## Control

- Fecha: 2026-10-16
- Estado: aprobado para planificación
- Rama: `feat/vcards-v2-visual-overhaul`
- Producto principal: administración y publicación de VCards empresariales
- Fuera de esta implementación: despliegue, migraciones PostgreSQL, cambios a 9301, integración real de nodos y HTTPS

## Objetivo

Corregir primero los defectos funcionales del sistema VCards y convertir su administración en un flujo utilizable por Mercadeo. El portal cautivo deja de ser un dominio operativo de esta aplicación. Solo se conservará una representación visual de la futura Administración de portales/nodos, sin conexión ni persistencia hasta que exista el nodo y su contrato.

## Orden de trabajo

1. Reparaciones públicas y seguridad compatibles con HTTP.
2. Creación y edición empresarial de VCards.
3. Temas y flujo de Mercadeo.
4. Auditoría de botones y rutas administrativas VCards.
5. Simplificación visual de Administración de portales.
6. Verificación integral y actualización del PR.
7. HTTPS como proyecto posterior y última puerta antes de capturar información sensible.

## 1. Reparaciones públicas

### Identidad y composición

- V2 muestra un solo hero/header.
- La marca se resuelve como Ford, GAC, Quick Lane o genérica.
- Metadata, ubicación, textos y acciones utilizan la misma marca y sucursal.
- Una tarjeta Quick Lane no debe usar contenido Ford salvo que ese dato esté explícitamente configurado y aprobado.

### Rutas y estados

- Tarjeta inexistente o inactiva devuelve estado HTTP correcto y mensaje neutral.
- Tarjetas y usuarios inactivos no se presentan.
- V1 conserva rutas, QR y comportamiento compatible.
- V2, API pública y descarga comparten política de actividad y firma.

### Acciones

- Llamar, WhatsApp, correo, VCF, compartir y solicitar cita solo aparecen con datos válidos.
- Ningún botón visible puede quedar sin acción.
- Correo abre un borrador según el cargo.
- Solicitar cita abre un borrador separado; no descarga VCF ni confirma una cita.
- URLs configurables se validan por esquema.

### Analítica

- El registro utiliza el identificador interno correcto de VCard.
- Un fallo de telemetría no bloquea la tarjeta.
- La lectura de eventos exige sesión y permiso.
- La respuesta pública no devuelve IP, agente o localización.
- El origen QR/DIRECT actual se documenta como heurística hasta diseñar una señal independiente.

### Seguridad compatible con HTTP

- No registrar firmas o query strings sensibles.
- Evitar datos sensibles en consola y respuestas.
- Añadir cabeceras aplicables sin TLS: CSP validada, `X-Content-Type-Options`, `Referrer-Policy` y eliminación de `X-Powered-By`.
- HSTS, cookies `Secure` obligatorias y formularios de datos sensibles esperan HTTPS.
- La aplicación debe continuar funcionando mediante HTTP durante esta fase.

## 2. Creación y edición empresarial

### Cascada organizativa

Secuencia obligatoria:

1. Empresa.
2. Ciudad.
3. Sucursal.

Reglas:

- Elegir empresa filtra ciudades disponibles.
- Elegir ciudad filtra sucursales de esa empresa y ciudad.
- Si solo existe una ciudad o sucursal, se selecciona automáticamente.
- Cambiar empresa limpia ciudad y sucursal incompatibles.
- Cambiar ciudad limpia una sucursal incompatible.
- Las opciones se ordenan alfabéticamente y no se duplican.
- Una ciudad vacía se presenta como “Ciudad no definida” únicamente para datos heredados; debe corregirse antes de publicar una nueva tarjeta.
- Crear y editar comparten el mismo componente/lógica para evitar divergencia.

### Validación server-side

- `branchId` debe existir y estar activo dentro del alcance autorizado del usuario.
- La compañía recibida debe coincidir con la compañía de la sucursal; el servidor no confía en el selector cliente.
- Ciudad se deriva de la sucursal y no se persiste duplicada en VCard.
- Nombre, email y sucursal son obligatorios.
- Email se normaliza y valida.
- No actualizar un usuario existente de otra compañía/sucursal sin permiso explícito.
- La creación de User y VCard debe ser transaccional para evitar usuarios huérfanos.
- Un conflicto de VCard existente devuelve respuesta específica, no error 500 genérico.

### Flujo de Mercadeo

El asistente de creación tendrá pasos claros:

1. Organización: empresa, ciudad y sucursal.
2. Persona: nombre, cargo, email, teléfono y foto.
3. Presencia: sitio, dirección heredada de sucursal y acciones disponibles.
4. Diseño: tema efectivo y marca resuelta.
5. Preview: móvil y escritorio con datos ficticios o del formulario.
6. Confirmación: resumen y creación.
7. Resultado: QR, enlace V1/V2 y acciones de copiar/descargar.

La primera implementación puede conservar un modal si el flujo sigue siendo comprensible; si el contenido excede una pantalla móvil se convierte en asistente por pasos.

## 3. Temas empresariales

- Mostrar claramente el tema efectivo y su origen: cargo, temporada, sucursal, compañía, global o legado.
- Permitir a Mercadeo seleccionar tema sin mezclar temas de portal cautivo.
- Previsualizar Ford, GAC, Quick Lane y fallback genérico.
- Evitar hero duplicado cuando el layout ya contiene cabecera.
- Mantener `prefers-reduced-motion` y contraste accesible.
- Ocultar configuraciones de portal cautivo del flujo VCards.
- No cambiar precedencia de temas sin prueba de regresión.

## 4. Auditoría de botones

Cada pantalla VCards se revisa mediante una matriz:

| Control | Debe hacer | Validación |
|---|---|---|
| Crear | Abrir flujo y crear de forma transaccional | E2E/integ. |
| Editar | Cargar y guardar valores existentes | E2E/integ. |
| Borrar/desactivar | Confirmar y aplicar según contrato | API/UI |
| Ver QR | Mostrar enlace correcto | UI |
| Descargar QR/VCF | Descargar formato correcto | Red/UI |
| Copiar | Copiar URL correcta y mostrar feedback | UI |
| Preview | Abrir V1/V2 correcta | UI |
| Importar/exportar | Validar archivo/alcance y reportar resultado | Integ. |
| Tema | Guardar y reflejar origen efectivo | Integ./visual |

Un botón sin implementación debe ocultarse o mostrarse deshabilitado con explicación; nunca aparentar éxito.

## 5. Administración de portales/nodos

### Alcance actual

- Retirar del menú principal los accesos a usuarios conectados, temas de portal, sucursales de portal, links, promociones y reportes del portal cautivo.
- Añadir un único acceso “Administración de portales”.
- Crear una pantalla visual sin persistencia ni conectores.

### Pantalla placeholder

- Encabezado que explique que los portales funcionan como nodos externos.
- Estado vacío “Aún no hay nodos conectados”.
- Tarjeta de ejemplo visual claramente marcada como demostración.
- Botón “Añadir nodo” deshabilitado con texto “Disponible cuando exista el contrato del nodo”.
- Campos previstos: nombre, URL base, Connector ID, Key ID y estado.
- No solicitar, guardar ni mostrar secretos.

### Integración futura

Cuando exista el nodo se definirá otro diseño para:

- alta/edición de nodos;
- autenticación y secreto cifrado;
- health check;
- redirección segura mediante allowlist;
- permisos y auditoría;
- rotación/revocación de claves;
- comportamiento cuando el nodo esté fuera de línea.

No se reutilizarán `AccessPoint`, `PortalSession` o `PortalConfig` sin una decisión de migración explícita.

## 6. Arquitectura de componentes

### Nuevas fronteras

- `OrganizationCascade`: empresa, ciudad y sucursal, sin lógica de persistencia.
- `VCardForm`: campos comunes y validación de presentación.
- `VCardPreview`: render de preview aislado.
- `VCardAction`: contrato común para botones funcionales.
- `PortalNodesPlaceholder`: pantalla puramente visual.
- Servicio server-side de creación VCard: autorización, validación y transacción.

### Principios

- Componentes cliente reciben el mínimo view model necesario.
- Autorización y validación final viven en servidor.
- La lógica de cascada se prueba como función pura cuando sea posible.
- No duplicar comportamiento entre crear y editar.
- No introducir una nueva tabla de nodos en esta fase.

## 7. Estados y errores

| Estado | Resultado |
|---|---|
| Cargando organización | Selectores deshabilitados con texto claro |
| Empresa sin ciudades | Mensaje y acceso a corregir sucursales |
| Ciudad sin sucursales | Mensaje; no permitir crear |
| API organización falla | Reintentar sin cerrar el formulario |
| Validación falla | Error junto al campo y resumen accesible |
| Conflicto email/VCard | Explicar qué registro existe |
| Creación parcial | Transacción revierte todo |
| Acción pública falla | Feedback no bloqueante |
| Telemetría falla | VCard sigue operativa |
| Nodo no implementado | Botón deshabilitado, sin navegación falsa |

## 8. Pruebas

### Unitarias

- ciudades únicas por empresa;
- sucursales filtradas por empresa/ciudad;
- autoselección;
- limpieza de selección incompatible;
- marca y cargo;
- mailto de contacto y cita;
- URL segura;
- códigos de estado públicos.

### Integración

- permisos por rol;
- sucursal pertenece a empresa;
- transacción User + VCard;
- VCard duplicada;
- registro de scan con ID interno;
- tarjetas inactivas;
- firma válida/inválida/desactivada.

### UI/E2E

- crear y editar con Empresa → Ciudad → Sucursal;
- teclado y lector de pantalla;
- todos los botones de la matriz;
- preview V1/V2;
- 360, 390, 768, 1024 y 1440 px;
- Ford, GAC y Quick Lane;
- movimiento reducido;
- menú sin módulos operativos del portal cautivo;
- placeholder de nodos sin acciones engañosas.

### Puertas

- build, typecheck, lint y pruebas sin fallos;
- cero errores de consola en flujos examinados;
- cero botones visibles sin resultado definido;
- V1 y QR existentes sin regresión;
- sin cambios BD/9301/producción;
- riesgos P0 cerrados o formalmente aceptados antes de desplegar.

## 9. Migración y compatibilidad

- El PR puede dejar código legado del portal cautivo temporalmente presente pero inaccesible desde navegación mientras se define su retiro físico seguro.
- No borrar tablas, modelos, APIs o rutas del portal en esta fase porque 9301 puede compartir código o datos.
- El retiro físico se hará solo tras comprobar que ningún servicio depende de ellos.
- La V1 y los QR no cambian.
- HTTPS se implementará al final como cambio de infraestructura independiente y reversible.

## 10. Criterios de aceptación

1. Un usuario autorizado crea o edita una VCard seleccionando empresa, ciudad y sucursal sin quedar bloqueado.
2. El servidor rechaza combinaciones organizativas inválidas.
3. No quedan botones VCards visibles sin acción real o estado explicado.
4. Analítica no devuelve 404 al abrir una tarjeta válida.
5. V2 no duplica cabecera ni mezcla marcas/ubicaciones.
6. Rutas inexistentes/inactivas devuelven estados correctos.
7. No se registran firmas completas.
8. La interfaz funciona por HTTP durante esta fase.
9. El menú se centra en VCards y solo muestra Administración de portales como placeholder de nodos.
10. Producción, PostgreSQL y 9301 permanecen sin cambios.
