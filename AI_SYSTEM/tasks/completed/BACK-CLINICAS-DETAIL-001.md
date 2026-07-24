# BACK-CLINICAS-DETAIL-001

Status: COMPLETED
Owner: Builder
Type: Backend
Priority: High

## Objective

Implementar el endpoint `GET /api/v1/admin/clinicas/{id}` en `SuperAdminClinicaController` que actualmente falta.

## Scope

- Crear el método `@GetMapping("/{id}")` para obtener el detalle de una clínica por ID.
- Validación de rol `SUPER_ADMIN`.
- Capa de servicio para devolver un `ClinicaResponse`.
- Pruebas de integración.

## Acceptance Criteria

- El endpoint devuelve `ApiResponse<ClinicaResponse>`.
- Si no existe la clínica, devuelve el error correcto (404/400 según estándar).
- `mvnw clean test` es 100% exitoso.
