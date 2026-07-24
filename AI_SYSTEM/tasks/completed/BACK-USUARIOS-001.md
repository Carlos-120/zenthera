# BACK-USUARIOS-001

Status: COMPLETED
Owner: Builder
Reviewed by: Inspector
Closed: 2026-07-20
Type: Backend
Priority: High

## Objective
Refactorizar y securizar el módulo de Usuarios garantizando el aislamiento multi-tenant y la prevención de escalamiento de privilegios.

## Scope
- Eliminar o refactorizar el antiguo `UsuarioController` mapeado en `/api/usuarios`.
- Implementar los nuevos endpoints bajo `/api/v1/clinica/usuarios`:
  - `GET` (Listado paginado)
  - `POST` (Creación, limitando a roles MEDICO o RECEPCIONISTA)
  - `PUT` (Actualización de datos)
  - `GET /{id}` (Detalle — APROBADO por Carlos el 2026-07-20)
  - `PATCH /{id}/estado` (Activar/desactivar usuario)
- Forzar la extracción del `clinicaId` desde el `TenantContext` en `UsuarioService`.
- Evitar confiar en el `clinicaId` proveniente de payloads del usuario.
- Agregar `@PreAuthorize("hasRole('ADMIN_CLINICA')")` donde corresponda.
- Pruebas unitarias/integración validando el aislamiento por clínica y la denegación de escalamiento de roles.

## Corrections Required (Inspector — 2026-07-20)

### OBLIGATORIAS (Bloqueantes)

1. **Whitelist de campos para `sort`:**
   - `UsuarioSpecification` o el controlador deben validar que el parámetro `sort` solo acepte campos de la whitelist: `nombres`, `apellidos`, `correo`, `activo`, `createdAt`.
   - Cualquier otro campo debe resultar en `400 Bad Request`.

2. **Límite máximo de `size`:**
   - Configurar `size` máximo en 50 (ej. vía `@PageableDefault(size = 20, max = 50)` o filtro en el servicio).
   - Peticiones con `size > 50` deben devolver `400 Bad Request`.

3. **Impedir autodesactivación de ADMIN_CLINICA:**
   - En `PATCH /{id}/estado`, verificar que el usuario autenticado no esté desactivando su propia cuenta.
   - Si coincide el ID del usuario autenticado con el `{id}`, retornar `400 Bad Request` con mensaje claro.

4. **Impedir desactivar al último ADMIN_CLINICA activo:**
   - En `PATCH /{id}/estado` con `activo = false`, verificar que no sea el único `ADMIN_CLINICA` activo de la clínica.
   - Si es el último, retornar `400 Bad Request` con mensaje descriptivo.

### PRUEBAS ADICIONALES REQUERIDAS

5. **Prueba de filtro `search`:** Verificar que se retornan solo los usuarios que coincidan.
6. **Prueba de filtro `activo`:** Verificar listado con `activo=true` y `activo=false`.
7. **Prueba de filtro `rolId`:** Verificar listado filtrado por rol.
8. **Prueba de `GET /{id}`:** Confirmar aislamiento tenant (retorna 404 ante IDs de otra clínica).
9. **Prueba de autodesactivación:** ADMIN_CLINICA intenta desactivarse a sí mismo → `400`.
10. **Prueba de último ADMIN_CLINICA:** Intentar desactivar al único ADMIN_CLINICA activo → `400`.
