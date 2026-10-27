# Rama integrada VCards V2 — entrega operativa a Codex

Fecha: 2026-10-26. Estado: **integración de código para ensayos**. Esta rama NO se fusiona automáticamente a `main` ni se despliega.

## Rama candidata única
`integration/vcards-v2-codex-20261026`

```bash
git clone https://github.com/LORDMANUEL/vcards-qr-suite-V2.git
cd vcards-qr-suite-V2
git fetch origin
git checkout integration/vcards-v2-codex-20261026
git log --oneline -n 8
```

Esta rama está **basada en #9 (incluye #2, #3 y #7)** e integra por rutas, sin reescribir las ramas fuente:
- #8: lógica explícita de empresas y sedes, formulario, pruebas y documentación.
- #4: estudio de tarjetas CR80, imagen QR original firmada y PDF frente/reverso.
- #5: shell Portal Manager, accesos a nodos y pruebas.
- #6: README, manual Codex y SQL de auditoría solo lectura.
- Resolución manual conocida de `app/components/sidebar.tsx`: aplicar navegación de portales del #5 más denominaciones "Diseñar temas vCard"/"Publicar temas vCard" del #7.
- `package.json` y workflow provienen de la rama base #9 (incluyen comando de tests corregido). El CI también se habilitó en `integration/**`.

**Esta rama es una candidata para pruebas, no el sustituto de los PRs individuales.** Revisar el historial, trazabilidad y revisiones de #2 a #9 antes de fusionar cambios definitivos. No hacer squash del conjunto a `main` sin confirmar el orden de revisiones y aprobación.

## Estado de cobertura y gates

| Gate | Estado |
|---|---|
| Compilaciones unitarias individuales PR #2–#9 | Confirmar ejecución del SHA final en Actions |
| Compilación integrada | Ver [GitHub Actions](https://github.com/LORDMANUEL/vcards-qr-suite-V2/actions) del SHA final de esta rama |
| Prisma schema + TypeScript + unit/lint/build | CI de la rama integrada |
| Navegación y UI real 360/390/768/1024/1440 | PENDIENTE de pruebas de navegador |
| V1/V2, QR firmados y perfiles existentes con BD copia | PENDIENTE |
| Impresión CR80 frente/reverso con QR real | PENDIENTE test físico |
| Fecha y precedencia de tema Ford/GAC/Quick Lane | PENDIENTE ensayo de integración |
| Datos Company/Branch huérfanos/duplicados | PENDIENTE diagnóstico read-only |
| Compatibilidad de servicios 9301 y 9306, BD compartida | PENDIENTE verificación en servidor |
| Backup y restauración PostgreSQL + release | PENDIENTE autorización y ensayo |
| Despliegue en IP de producción | **NO AUTORIZADO / NO EJECUTADO** |

## Instrucción de ejecución para Codex
1. Tomar esta rama por SHA exacto y leer `README.md`, `docs/v2/AUDIT_FINDINGS.md`, `docs/v2/CODEX_DEPLOYMENT_HANDOFF_2026-10-26.md` y documentos PR01, PR03A, PR06, PR07A, PR07, PR08, PR09.
2. Ejecutar `npm ci && npx prisma validate && npx prisma generate && npm run typecheck && npm test && npm run lint && npm run build` en sistema aislado. No usar credenciales reales de producción.
3. Para diagnóstico del Debian remoto (solo con acceso expresamente aprobado): `bash scripts/vcards-release-preflight.sh`. No recolectar ni publicar secretos; no usar `systemctl cat`, `printenv` ni `cat .env` en logs compartidos.
4. Determinar cómo se relacionan el runtime 9301 y 9306, la ruta efectiva del código y la versión Prisma/BD real. Si 9301 lee `Theme.config` y no admite el objeto `{layout,studioDoc}`, NO activar temas nuevos hasta coordinar compatibilidad.
5. Exportar copia de la base en un entorno seguro, proteger acceso a datos personales y recuperar con `docs/v2/RECONCILIATION_READONLY_2026-10-26.sql` únicamente las asociaciones por ID aprobadas. No ejecutar scripts de semilla o reparación que muten producción sin autorización.
6. En staging con BD anonimizada, probar todos los flujos críticos: empresas y sedes, vCards, HMAC, QR existentes, temas, fechas, PDF, Portal Manager, roles y acceso público. Adjuntar logs y capturas por SHA.
7. Preparar release inmutable de 9306 con SHA/checksum, construir artefacto fuera de producción y preparar rollback con el release previo intacto. El puerto 9301 queda fuera del alcance.
8. Detenerse antes de modificar el servidor: requerir aprobación explícita del responsable, ventana de cambio y respaldo/restauración comprobados.
9. Después de autorizar y realizar el despliegue, documentar SHA, usuario ejecutor, fecha, backups, checks e incidentes. No declarar "100% funcional" solo por CI verde.

## Criterios de aceptación finales
- No se crean empresas/sucursales duplicadas al editar o registrar.
- No se pierden sucursales ni se cambian asociaciones sin confirmación.
- Una tarjeta QR histórica resuelve al mismo contacto con su firma y estadísticas.
- Un tema de una compañía no desplaza otro tema de otra compañía.
- Tema desactivado/expirado no se renderiza y deja espacio a fallback válido.
- El editor guarda borradores de manera reversible sin modificar temas publicados.
- Una tarjeta física imprime frente/reverso CR80 y QR escaneable.
- Borrar tema todavía referenciado devuelve 409, sin destruir asociaciones.
- Portal Manager queda separado de vCards sin afectar portal de invitados.

## Rollback
Sin cambios de base ni servicio durante esta integración. `git revert` únicamente en la rama de integración si es necesario, o descartar la rama y volver a las PRs independientes. Tras despliegue autorizado: restaurar release completo previamente probado, revisar vCards y HMAC y reportar al responsable; rollback de código NO deshace automáticamente datos escritos después del despliegue.
