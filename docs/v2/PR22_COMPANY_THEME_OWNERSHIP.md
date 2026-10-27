# PR 22 — Aislamiento de temas corporativos

Crear Company ya no recicla por coincidencia de nombre un Theme existente: genera un borrador corporativo independiente. Si se entrega un ID existente, exige que sea VCARD y no esté asignado a otra Company/Branch ni marcado como propiedad de una compañía.

QA: Ford/GAC con colores propios; crear empresa usando tema ajeno devuelve 422; clon real antes de publicar a otras entidades. No cambios DB. Riesgo: carreras entre asignaciones concurrentes siguen requiriendo constraint/locks y pruebas de integración.
