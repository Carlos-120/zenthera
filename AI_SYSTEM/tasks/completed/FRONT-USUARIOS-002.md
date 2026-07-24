# FRONT-USUARIOS-002

Status: COMPLETED
Owner: Builder
Reviewed by: Inspector
Type: Frontend
Priority: Medium

## Objective
Pantallas/Modales de creación, edición y control de estado de usuarios.

## Scope
- Crear formulario para agregar nuevos usuarios (MEDICO o RECEPCIONISTA).
- Crear formulario de edición de datos básicos (Nombres, apellidos, teléfono).
- Implementar la lógica para cambiar el estado a través de `PATCH /api/v1/clinica/usuarios/{id}/estado`.
- Evitar dobles envíos y proveer _feedback_ claro de éxito o error al usuario.
- Refrescar automáticamente la caché del listado tras operaciones exitosas.
