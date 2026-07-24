# DOC-USUARIOS-001

Status: COMPLETED
Owner: Atlas / Writer
Type: Documentation
Priority: High

## Objective
Actualizar `docs/API_CONTRACT.md` con las especificaciones del nuevo Módulo de Usuarios.

## Scope
- Definir los nuevos endpoints para el módulo Usuarios:
  - `GET /api/v1/clinica/usuarios` (listado paginado)
  - `POST /api/v1/clinica/usuarios` (creación)
  - `PUT /api/v1/clinica/usuarios/{id}` (edición)
  - `PATCH /api/v1/clinica/usuarios/{id}/estado` (suspensión/reactivación)
- Definir que el restablecimiento de contraseñas queda fuera de alcance temporalmente.
- Asegurar que la matriz de roles y permisos estipule claramente que `ADMIN_CLINICA` gestiona usuarios (`MEDICO`, `RECEPCIONISTA`) y que hay aislamiento por `TenantContext`.
