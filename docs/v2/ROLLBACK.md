# Rollback — VCards V2

## 1. Alcance

Este procedimiento cubre únicamente el código y build de `/v2/vcard/[id]`. No autoriza desplegar, reiniciar servicios, cambiar el portal 9301, modificar PostgreSQL ni retirar archivos del servidor.

La producción observada permanece fuera de este procedimiento hasta recibir autorización explícita:

- 9301: `/home/yc/vcard-system`, `vcard-admin-9301.service`;
- 9306: `/home/yc/vcards-fase1-20261014-101842`, `vcard-admin-9306.service`;
- build 9306 observado: `8ig-OXnVVUwpi0uNIWphp`.

## 2. Condiciones conocidas

- El servidor desplegado no tenía Git ni metadata `.git`; no puede usarse como fuente de historial.
- Este repositorio local es la recuperación versionada del snapshot activo indicada en `SOURCE_SNAPSHOT.md`.
- 9301 y 9306 probablemente comparten `vcard_db`; el rollback visual no requiere ni permite rollback de base de datos.
- No existe historial Prisma de migraciones ni backup PostgreSQL contemporáneo verificado.
- El `node_modules` de la fase 9306 desplegada era un enlace simbólico a otro snapshot; el rollback no debe depender de enlaces externos no documentados.

## 3. Estrategia de reversión

La unidad mínima de rollback es un commit revisado. Cada fase debe conservar:

1. commit base identificado;
2. commits pequeños de documentación, componentes, estilos y pruebas;
3. build reproducible desde `package-lock.json`;
4. evidencia de V1 y V2 antes/después;
5. artefacto de build identificado con checksum y sin secretos;
6. registro de quién autorizó el despliegue.

Nunca se hará rollback copiando selectivamente archivos sobre un directorio activo. Se prepara un release completo en un directorio nuevo, se valida y solo después se cambia el apuntador de despliegue mediante el procedimiento operacional aprobado.

## 4. Rollback local durante desarrollo

Antes de revertir:

```bash
git status --short --branch
git log --oneline --decorate -n 20
```

Si una fase todavía no se ha compartido, se corrige con un commit nuevo o se restaura únicamente el archivo afectado desde el commit base. No se usa `git reset --hard`, no se borran cambios ajenos y no se reescribe historial compartido.

Para revertir un commit ya revisado o publicado:

```bash
git revert <commit-de-la-fase>
```

Después de revertir se ejecuta de nuevo la matriz completa de validación. Un revert compilable no se considera satisfactorio sin pruebas de V1, V2 y rutas críticas.

## 5. Preparación de un release reversible

Estos pasos son preparatorios; no despliegan:

1. partir del commit aprobado de la rama;
2. instalar dependencias bloqueadas con `npm ci` en entorno aislado;
3. ejecutar typecheck, lint y pruebas automatizadas;
4. ejecutar `npm run build` y registrar el Build ID;
5. verificar que el artefacto no contenga `.env`, claves, logs, bases, backups, archivos subidos ni `node_modules` heredado;
6. calcular SHA-256 del paquete;
7. conservar el release aprobado anterior, su checksum y su configuración externa;
8. documentar directorio destino, propietario, permisos y unidad systemd, sin cambiar aún el servidor.

El build no valida lint por sí solo porque `next.config.js` configura `eslint.ignoreDuringBuilds=true`. Lint debe ejecutarse y reportarse por separado. Si la herramienta de lint falla por incompatibilidad de versiones, se registra como limitación; no se declara aprobado.

## 6. Gate previo a cualquier despliegue

No se puede desplegar hasta comprobar todos los puntos:

- autorización explícita del propietario;
- backup actual de código/configuración no secreta y restauración verificada;
- backup PostgreSQL actual, cifrado, con restauración ensayada, aunque V2 no cambie datos;
- release anterior disponible y ejecutable;
- puerto 9301 y portal cautivo fuera del alcance del cambio;
- ninguna migración, `db push`, seed o script de escritura incluido;
- pruebas de `/vcard/[id]` y QR existentes satisfactorias;
- pruebas V2 en Ford Yude, GAC Yude y Quick Lane a 360, 390, 768, 1024 y 1440 px;
- revisión de seguridad, enlaces, `mailto:` por cargo, teclado y `prefers-reduced-motion`;
- responsable, ventana, criterio de abortar y observador definidos.

## 7. Procedimiento operativo propuesto

Solo debe ejecutarlo una persona autorizada en una ventana aprobada:

1. registrar servicio, directorio activo, Build ID, respuestas HTTP y checksum actuales;
2. confirmar que 9301 sigue apuntando exclusivamente a `/home/yc/vcard-system`;
3. colocar el release nuevo en un directorio versionado distinto, sin sobrescribir el activo;
4. verificar propietario, permisos y referencias de configuración externa sin imprimir secretos;
5. construir o usar el artefacto previamente verificado, sin ejecutar Prisma ni scripts de datos;
6. validar el release en un puerto temporal o entorno aislado;
7. cambiar únicamente el servicio 9306 al directorio aprobado y reiniciar solo 9306;
8. ejecutar smoke tests y regresión visual;
9. conservar el release anterior intacto durante el período de observación.

Este documento no ejecuta ni autoriza esos pasos.

## 8. Disparadores de rollback

Se revierte 9306 si ocurre cualquiera de los siguientes eventos:

- V1 o un QR existente deja de responder como antes;
- error 5xx, excepción de renderizado o incremento sostenido de errores;
- tarjeta o tema incorrecto para Ford Yude, GAC Yude o Quick Lane;
- botones de llamada, WhatsApp, correo, mapa o descarga apuntan a datos erróneos;
- regresión crítica de accesibilidad o responsive;
- solicitud inesperada de escritura, alteración de datos o degradación de PostgreSQL;
- cambio observado en 9301 o el portal cautivo;
- checksum, configuración o Build ID no corresponden al release aprobado.

## 9. Reversión de 9306

Con autorización operacional:

1. detener únicamente la unidad 9306;
2. restaurar en la unidad el directorio exacto del release anterior verificado;
3. iniciar únicamente 9306;
4. comprobar estado del servicio y logs redactados;
5. validar `/`, `/vcards`, `/vcard/[id]` y la respuesta esperada de `/v2/vcard/[id]` para ese release;
6. confirmar que 9301 continúa sin cambios;
7. registrar hora, operador, release/Build ID restaurado, causa y evidencia.

No se modifica ni reinicia PostgreSQL. No se restaura una base para corregir una regresión visual. Si se detecta una mutación de datos no autorizada, se congela la operación y se escala; cualquier restauración de datos exige un procedimiento independiente, análisis de pérdida y aprobación explícita.

## 10. Validación posterior

El rollback se considera satisfactorio solo cuando:

- 9306 ejecuta el Build ID anterior esperado;
- V1 y los QR existentes pasan smoke tests;
- 9301 y el portal cautivo mantienen su estado previo;
- no aparecen nuevas escrituras ni errores PostgreSQL;
- las métricas y logs permanecen estables durante la ventana acordada;
- la evidencia está adjunta al PR/incidente sin secretos ni datos personales.

Si alguno falla, el rollback queda **incompleto** y debe comunicarse como tal. Nunca se declara recuperación basándose únicamente en que el proceso esté activo o devuelva HTTP 200.
