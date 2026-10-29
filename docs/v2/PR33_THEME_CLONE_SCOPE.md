# PR33 — Clonado seguro de diseños vCard

POST cloneThemeId ahora exige que un diseñador de sucursal solo clone diseños públicos globales o de la misma compañía; admin conserva permisos explícitos de clonación transversal. Las nuevas copias son borradores inactivos y no heredan calendarios antiguos sin solicitud expresa.

QA: MARKETING Ford clonar GAC 403; Ford propio 201; admin 201; tema no VCARD 404; clon queda isActive=false, fechas null. No cambia publicación existente ni BD histórica. Validar GET catálogo separado en posterior revisión de RBAC.
