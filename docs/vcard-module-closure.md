# Cierre de modulo vCards

Fecha: 2026-03-17

## Estado

El modulo `vCards` queda funcionalmente estabilizado para la ruta publica, pero no debe considerarse cerrado de forma ficticia. El estado correcto es: `operativo con deuda tecnica controlada y documentada`.

## Alcance confirmado

- empresas vCard con branding, logo, colores y tema base/estacional
- sucursales por ciudad con asignacion y orden
- activacion de temas por empresa y por sucursal
- programacion por fechas para temas de temporada
- builder visual de vCards con widgets y preview responsive
- vista publica de vCard para cliente final
- QR funcional apuntando a la URL publica real
- descarga `.vcf` funcional
- editor premium de tarjetas imprimibles
- guardado de plantillas imprimibles como temas `CARD`
- exportacion `PNG`
- exportacion `PDF` vectorial
- exportacion `DOCX` nativa

## Correcciones aplicadas en la estabilizacion 2026-03-17

- se consolido una sola variante activa para la vista publica en `app/vcard/[id]/page.tsx` y `app/vcard/[id]/client-page.tsx`
- se eliminaron variantes obsoletas que estaban rompiendo compilacion y confundiendo mantenimiento
- se corrigio la URL base SSR para que use host real y no dependa de `localhost` hardcodeado
- se propagaron encabezados relevantes y la firma `sig` al fetch SSR para no degradar seguridad ni trazabilidad
- se corrigio el tipado del cliente para reflejar `branch.company`, `theme`, `defaultVcardTheme` y `seasonalVcardTheme`
- se elimino el registro de scan dentro de `GET /api/vcard/[id]` para evitar doble conteo y side effects en la lectura de datos
- se movio el tracking real al endpoint `POST /api/vcards/scans`, con validacion de existencia de vCard, geolocalizacion y tipo de dispositivo
- se valido `actionType` en `POST /api/vcards/click` para reducir eventos basura o inyecciones triviales
- se corrigio un bug funcional: el endpoint de scans ya no incrementa `downloadCount`
- se sanitizo la generacion de `.vcf` para reducir riesgo de ruptura por saltos de linea, comas o caracteres de control

## Deuda tecnica residual de vCards

### Critica operativa

- el smoke test `scripts/test-vcard-flow.js` no puede ejecutarse en esta estacion si no existe PostgreSQL local en `localhost:5432`
- el rate limiting sigue siendo en memoria dentro de `lib/security.ts` y `app/api/vcards/scans/route.ts`; esto sirve como contencion basica, pero no es control distribuido ni persistente

### Calidad y seguridad

- la firma HMAC sigue siendo opcional cuando la URL publica no incluye `sig`; el control existe, pero no es una exigencia universal del flujo
- la geolocalizacion depende de un tercero (`ipapi.co`), por lo que la disponibilidad y privacidad siguen acopladas a ese servicio
- quedan `console.error` operativos en rutas vCard; sirven para diagnostico, pero no sustituyen logging centralizado
- no existe aun una bateria automatizada reproducible de aceptacion funcional sobre la ruta vCard con base de datos real

## Validacion realizada

- `npm run build` completado con exito despues del saneamiento del area vCard
- compilacion sin errores en:
  - `app/vcard/[id]/page.tsx`
  - `app/vcard/[id]/client-page.tsx`
  - `app/api/vcard/[id]/route.ts`
  - `app/api/vcard/[id]/download/route.ts`
  - `app/api/vcards/scans/route.ts`
  - `app/api/vcards/click/route.ts`
- la carpeta `app/vcard/[id]` quedo con solo los archivos activos necesarios

## Validacion pendiente para declarar cierre total

- ejecutar smoke test end-to-end con base de datos real disponible
- validar en servidor de produccion una vCard real con:
  - carga publica `200`
  - descarga `.vcf` `200`
  - un solo scan por visita
  - click tracking para llamada, email y WhatsApp
- confirmar que el rate limiting no introduce falsos positivos en trafico real

## Decision de cierre

No se recomienda declarar el modulo `vCards` como “cerrado sin pendientes”.

Si se requiere pasar al area de `Portales`, la formulacion correcta es:

`vCards queda operativo para continuar, con deuda tecnica residual documentada y sin bloqueos criticos abiertos en la ruta publica.`

## Siguiente fase

Con la ruta publica vCard estabilizada, el siguiente frente puede moverse a `Portal Cautivo`, manteniendo abierta una cola corta de endurecimiento operativo de vCards.
