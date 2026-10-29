# PR43 — Privacidad de páginas públicas

V1 y V2 se sirven dinámicamente sin revalidación del servidor y evitan indexación mediante metadata; GET JSON de perfil añade `Cache-Control: private, no-store` y noindex. Se reduce riesgo de cachear perfiles archivados tras cambios de estado.

QA: inspeccionar headers y cache de reverse proxy/CDN (9301/9306); comprobar que 404 de tarjetas archivadas no se sirva con datos antiguos. Configurar también reglas CDN porque cabeceras no pueden invalidar contenido ya cacheado. Sin migración.
