# PR32 — Bloqueo de eliminación destructiva de sucursales

DELETE Branch ahora bloquea la fila padre (`FOR UPDATE`), comprueba usuarios, vCards archivadas/activas, AccessPoint, PortalSession, reglas y PortalConfig **en la misma transacción serializable**, y rechaza 409 si existen dependencias. Impide pérdida de sesiones/temas por borrado en cascada. Sin migraciones.

QA con PostgreSQL staging: Branch con vCard archivada 409; usuario activo 409; nodo portal 409; Branch vacía 200. Carrera de inserción de VCard vs DELETE sin pérdidas. Respaldar antes de cambios reales. Rollback revertir PR.
