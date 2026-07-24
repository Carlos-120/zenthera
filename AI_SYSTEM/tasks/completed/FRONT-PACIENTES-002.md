# FRONT-PACIENTES-002

Status: IN_PROGRESS
Owner: Builder
Type: Frontend
Priority: High

## Objective
Implementar formularios de creación, edición y control de estado de pacientes.

## Scope
- Pantalla o Modal para "Nuevo Paciente" consumiendo `POST /`.
- Pantalla o Modal para edición de Paciente consumiendo `PUT /{id}` (actualizando solo campos aprobados).
- Mostrar datos obligatorios y opcionales (alergias, contacto de emergencia, etc.) según Zod schema.
- Implementar modal de confirmación para Cambio de Estado (`PATCH /{id}/estado`), visible solo para `ADMIN_CLINICA`.
- Manejo de errores unificado, mostrando correctamente el conflicto 409 (cédula duplicada).
