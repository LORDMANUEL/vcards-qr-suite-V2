# App Flow — VCards V1, V2, QR y agenda

## Entrada pública

```mermaid
flowchart TD
    QR[Escaneo de QR existente] --> URL{Destino del QR}
    LINK[Enlace compartido] --> URL
    URL -->|/vcard/:id| V1[V1 preservada]
    URL -->|/v2/vcard/:id| V2[V2 nueva]
    URL -->|otro| E404[404]
    V1 --> RESOLVE1[Resolver tarjeta activa]
    V2 --> POLICY[Validar política pública y firma]
    POLICY --> RESOLVE2[Resolver tarjeta y usuario activos]
    RESOLVE1 --> THEME1[Render V1 sin cambios]
    RESOLVE2 --> BRAND[Resolver marca]
    RESOLVE2 --> THEME2[Resolver tema]
    BRAND --> COMPOSE[Elegir una cabecera]
    THEME2 --> COMPOSE
    COMPOSE --> CARD[VCard V2]
```

## Estados de resolución V2

```mermaid
stateDiagram-v2
    [*] --> Loading
    Loading --> InvalidSignature: firma requerida e inválida
    Loading --> NotFound: id ausente o tarjeta/usuario inactivo
    Loading --> TemporaryError: BD/red/servicio no disponible
    Loading --> Ready: datos públicos válidos
    InvalidSignature --> [*]
    NotFound --> [*]
    TemporaryError --> Loading: reintentar
    Ready --> Action
    Action --> Ready
```

Hoy el cliente convierte errores HTTP y de red en “vCard no encontrada”; la separación anterior es objetivo, no estado implementado.

## Selección de tema

```mermaid
flowchart TD
    START[Tarjeta válida] --> ROLE{Regla activa de puesto}
    ROLE -->|sí| RT[Tema del puesto]
    ROLE -->|no| BS{Temporada sucursal activa y vigente}
    BS -->|sí| BST[Tema estacional sucursal]
    BS -->|no| BT{Tema normal sucursal}
    BT -->|sí| BTT[Tema sucursal]
    BT -->|no| CS{Temporada compañía activa y vigente}
    CS -->|sí| CST[Tema estacional compañía]
    CS -->|no| CD{Tema predeterminado compañía}
    CD -->|sí| CDT[Tema compañía]
    CD -->|no| GLOBAL{Tema global activo}
    GLOBAL -->|sí| GT[Tema global]
    GLOBAL -->|no| LEGACY[Tema legado o fallback neutral]
```

## Composición de cabecera

```mermaid
flowchart TD
    T[Tema resuelto] --> CHECK{Contiene Header o SeasonalHero}
    CHECK -->|sí| TH[Renderizar cabecera del tema]
    CHECK -->|no| BH[Renderizar BrandHero]
    TH --> PROFILE[Perfil]
    BH --> PROFILE
```

## Acciones

```mermaid
flowchart LR
    CARD[VCard lista] --> CALL[Llamar]
    CARD --> WA[WhatsApp]
    CARD --> EMAIL[Correo]
    CARD --> VCF[Guardar VCF]
    CARD --> SHARE[Compartir]
    CALL --> EVENT[Evento click]
    WA --> EVENT
    EMAIL --> ROLEMAIL[Resolver plantilla por puesto]
    ROLEMAIL --> DRAFT[Abrir borrador mailto]
    VCF --> DOWNLOAD[Descarga validada]
    SHARE --> NATIVE{Web Share disponible}
    NATIVE -->|sí| SHAREUI[Selector nativo]
    NATIVE -->|no| COPY[Copiar enlace]
```

## Atribución de visita

```mermaid
flowchart TD
    OPEN[Apertura] --> SOURCE{Origen verificable}
    SOURCE -->|QR firmado o parámetro aprobado| QR_EVT[QR]
    SOURCE -->|enlace compartido/directo| DIRECT_EVT[DIRECT]
    SOURCE -->|entrada administrativa explícita| MANUAL_EVT[MANUAL]
    QR_EVT --> POST[POST telemetría]
    DIRECT_EVT --> POST
    MANUAL_EVT --> POST
```

Estado confirmado actual: V1 y V2 envían siempre `scanMethod: QR` al montar, independientemente del origen.

## Agenda y CRM

```mermaid
flowchart TD
    CTA[Solicitar cita] --> CONTRACT{Contrato API aprobado}
    CONTRACT -->|no| INFO[Mostrar canal aprobado o estado pendiente]
    CONTRACT -->|sí| HTTPS{HTTPS, auth y sandbox validados}
    HTTPS -->|no| BLOCK[Integración bloqueada]
    HTTPS -->|sí| AVAIL[Consultar disponibilidad]
    AVAIL --> SELECT[Seleccionar fecha y servicio]
    SELECT --> CONSENT[Datos y consentimiento]
    CONSENT --> CREATE[Crear solicitud idempotente]
    CREATE -->|confirmada| CONFIRM[Mostrar folio real]
    CREATE -->|error| RETRY[Error recuperable y reintento]
```

## Flujos de error

| Caso | Respuesta esperada | Telemetría |
|---|---|---|
| Firma ausente/inválida cuando es obligatoria | 403 neutral | Evento de seguridad sin guardar firma completa |
| Tarjeta o usuario inactivo | 404 neutral | Conteo agregado, sin PII |
| API/BD temporalmente caída | 503/estado de reintento | Error correlacionado |
| Acción sin dato | Control oculto | Ninguna |
| URL de acción no permitida | Bloquear y registrar configuración inválida | Alerta administrativa |
| CRM no disponible | No confirmar cita | Error y reintento seguro |

## Compatibilidad y rutas

- `/vcard/[id]`: V1, sin redirección automática.
- `/v2/vcard/[id]`: V2 aislada.
- QR existentes: no regenerar ni alterar durante esta fase.
- `/portal` y puerto 9301: fuera del cambio.
- Promoción de QR hacia V2: decisión futura con plan de migración y rollback.

