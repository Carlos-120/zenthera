# BACK-PACIENTES-001

Status: IN_PROGRESS
Owner: Builder
Type: Backend
Priority: High

## Objective
Refactorizar el controlador y servicio de Pacientes para cumplir con el API Contract aprobado y eliminar deuda técnica.

## Scope
- Cambiar URL base de `PacienteController` a `/api/v1/clinica/pacientes`.
- Unificar listado y búsqueda en un solo `GET /` usando `Pageable`, `search`, `activo` y whitelist de `sort`.
- Refactorizar desactivación lógica de `DELETE` a `PATCH /{id}/estado`.
- Envolver todas las respuestas en `ApiResponse`.
- Validar `TenantContext` y asegurar `404 Not Found` en caso de ID cross-tenant.
- Aplicar restricciones de roles (`@PreAuthorize`) según matriz definida en DOC-PACIENTES-001.
- Restringir campos editables en `PUT /` (básicos y de contacto, ignorando campos de auditoría u otros que no correspondan).

## Reglas Bloqueantes (De cumplimiento obligatorio)
- `PacienteRequest` NO puede contener `clinicaId` ni `activo`.
- El `clinicaId` siempre proviene de `TenantContext`.
- Cédula única por clínica, **incluso si el paciente está inactivo**.
- Conflictos de cédula responden `409 Conflict`.
- Acceso cross-tenant (solicitar un paciente de otra clínica) responde `404 Not Found`.
- Solo `ADMIN_CLINICA` puede activar o desactivar (`PATCH /{id}/estado`).
