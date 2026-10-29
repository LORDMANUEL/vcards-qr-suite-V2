# PR31 — Edición atómica de sucursales y temas

PUT de Branch verifica que cada tema y regla por puesto exista, pertenezca a la empresa adecuada y tenga la categoría correcta. Se guardan sucursal y reglas por puesto en una transacción serializable; si falla un registro se revierte todo.

QA: mezclar tema Ford/GAC debe dar 422, regla de puesto inexistente 422, error de regla debe preservar Branch; comprobar portalTheme categoría PORTAL, legacy VCARD. No migración. Revisar concurrencia y mapeo de reglas en staging.
