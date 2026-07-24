# FRONT-USUARIOS-001

Status: COMPLETED
Owner: Builder
Reviewed by: Inspector
Type: Frontend
Priority: Medium

## Objective
Infraestructura de datos y pantalla de listado de usuarios para ADMIN_CLINICA.

## Scope
- Crear esquemas de validación Zod y el servicio Axios (`src/lib/api/usuarios.ts`) basándose en `API_CONTRACT.md`.
- Crear la pantalla de listado en `/dashboard/usuarios`.
- Mostrar tabla de usuarios con estado (Activo/Inactivo) y Rol (`MEDICO`, `RECEPCIONISTA`).
- Implementar skeletons de carga y paginación si aplica.
- Proteger la ruta para `ADMIN_CLINICA`.
