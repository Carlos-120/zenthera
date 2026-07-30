# BACK-CLINICAS-DETAIL-001

STATUS: COMPLETED
VERIFICATION: VERIFIED
Owner: Builder
Type: Backend
Priority: High

ENDPOINT: GET /api/v1/admin/clinicas/{id}
RESPONSE: ApiResponse<ClinicaResponse>
SECURITY: SUPER_ADMIN
NOT_FOUND: HTTP 404 mediante ResourceNotFoundException
TARGETED_TESTS: 12/12 PASS
BACKEND_TESTS: 111/111 PASS
BUILD: BUILD SUCCESS
FEATURE_COMMIT: ace179621fca5bbc7d6c351f04cbc1b14f087d35
MERGE_COMMIT: 2507b041f2c5460c0e1756987b6d98551030a6be
PR: #3 MERGED

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
