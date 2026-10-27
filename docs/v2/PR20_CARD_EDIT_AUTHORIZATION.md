# PR 20 — Edición segura de vCards

PUT administrativo requiere rol permitido (ADMIN/IT/SUPER_ADMIN o roles de carga con sucursal propia), tarjeta y usuario activos, y evita editar desde una sola tarjeta la cuenta cuyo perfil se comparte entre múltiples vCards. Actualización de User y VCard sigue siendo transaccional; cambio de estado durante edición responde 409 y revierte perfil.

QA: probar rol ADVISOR denegado, MARKETING de sucursal, tarjeta archivada, User inactivo, usuario con 2 vCards, y carrera de archivado. En un futuro crear editor explícito de cuenta multitarjeta. No migración, no producción.
