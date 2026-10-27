# PR-12 — Enlaces públicos, firmas QR y aislamiento de temas

Fecha: 26 de octubre de 2026. PR dependiente de #11 → #10. Ningún deploy ni cambio de PostgreSQL.

## Defectos confirmados por lectura del código
1. Al crear la vCard, el generador de URL QR aceptaba `x-forwarded-host` / `host` como alternativa si faltaban `NEXTAUTH_URL` o `NEXT_PUBLIC_SITE_URL`. Un remitente que controle esos encabezados podría obtener un QR firmado apuntando a otro dominio.
2. Cuando `REQUIRE_VCARD_SIGNATURE=true`, las páginas V1/V2 emitían llamadas de perfil (fallback) y descarga de contacto sin `?sig=`, por lo que la API podía devolver 403 aunque el QR original fuese legítimo.
3. `GET /api/vcard/[id]` seleccionaba como fallback global cualquier tema activo, incluso `Theme.companyId` de otra empresa; el SSR ya restringía a temas globales `companyId=null`. La inconsistencia podía aplicar un tema de compañía ajena en la carga del cliente.

## Implementación
- `lib/vcard-public-links.ts`: origen de URL QR tomado **exclusivamente** de `NEXT_PUBLIC_VCARD_BASE_URL`, `NEXT_PUBLIC_SITE_URL` o `NEXTAUTH_URL`, en ese orden. Se comprueba origen absoluto HTTP(S), sin usuario/contraseña, query, fragmento ni ruta adicional. El valor configurado manda, nunca Host/X-Forwarded-Host.
- Si ninguna URL válida está configurada, el alta de vCard devuelve **503 antes de modificar User o VCard**. Esto requiere definir el dominio real del servicio antes del despliegue.
- Helper `publicVCardApiPath` añade la firma existente desde la URL pública actual a GET de perfil y GET de descarga; no genera otra firma, no modifica HMAC, secretos ni links publicados.
- El fallback de `GET /api/vcard/[id]` usa `category=VCARD,isActive=true,companyId=null`, en línea con V1 y V2 SSR.
- Tests `tests/vcard-public-links.test.ts`: precedencia de variables, dominio/puerto interno, rechazo de URLs inválidas y propagación de firma.

## Configuración sugerida para Codex
En staging usar `NEXT_PUBLIC_VCARD_BASE_URL=https://vcard.grupoyc.com` **solo si ese FQDN resuelve al servicio público verdadero y los certificados están válidos**. No asumir que el DNS está operativo. En servidores con acceso por IP y puerto, se puede utilizar temporalmente un origen HTTP(S) explícito ya validado, pero el QR entregado a empleados debe resolverse desde sus móviles fuera de la red local.
No publicar variables de entorno ni secretos; comprobar `NEXTAUTH_URL` y `NEXT_PUBLIC_SITE_URL` reales sin divulgar cookies o cadenas de conexión.

## Pruebas de aceptación
1. CI: `npm ci; npx prisma validate; npx prisma generate; npm run typecheck; npm test; npm run lint; npm run build`.
2. Sin dominio configurado, POST de vCard retorna 503, usuarios y tarjetas sin cambios; con dominio válido, PNG QR contiene la URL y firma correctas.
3. Con dominio configurado, cabeceras manipuladas `Host` y `X-Forwarded-Host` no modifican el QR emitido.
4. Escanear QR vigente `/vcard/UUID?sig=HEX`, cargar datos y descargar VCF con `REQUIRE_VCARD_SIGNATURE=true`. Verificar también ruta V2 firmada.
5. Sin firma, comprobar el comportamiento de compatibilidad configurado (actualmente depende del flag `REQUIRE_VCARD_SIGNATURE`). Si se decide forzar HMAC en todas las rutas, auditar QR/links antiguos antes de cambiar el flag.
6. Definir 2 compañías con temas distintos y un tema global verdadero: fallback API nunca selecciona un tema con `companyId` de otra compañía.
7. Probar HTTP 401/403/404, errores de rate limit, portal 9301 y continuidad 9306, sin exponer información privada.
8. Verificación final con QR físico y descarga VCF desde smartphone.

## Limitaciones / deuda de seguridad
- La ruta pública V1 SSR `/vcard/[id]` no verifica explícitamente el HMAC, mientras V2 sí llama `verifyVCardSignature`; aun cuando el API está protegido, queda riesgo de acceso directo no firmado en V1. No se modifica esa política en este PR para no invalidar códigos QR antiguos sin una auditoría de compatibilidad. Codex debe priorizar un PR de transición con datos de inventario de URLs heredadas.
- Los enlaces generados a partir de `NEXTAUTH_SECRET` pueden invalidarse si se rota el secreto sin mantener una política de claves heredadas. Preparar plan de rotación antes de exigir firmas.
- La función `securityCheck` confía en cabeceras proxy al determinar IP y registra eventos con datos sensibles; revisar la confianza del proxy y retención de logs en una fase independiente.
- La descarga de contacto incrementa métricas antes de escribir el archivo; se debe investigar el caso de fallos de exportación.
- La aplicación no está probada contra la IP activa, y no se ha enviado ningún cambio a producción.

## Rollback
Sin migraciones. Revertir la rama o conservar release 9306 previo tras ensayos de staging; nunca mutar 9301. No se eliminan ni regeneran QR históricos; no se modifica la base de datos durante el desarrollo del PR.
