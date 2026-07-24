# DOC-API-CONTRACT-001

Status: READY
Owner: Scribe
Type: Documentation
Priority: Medium

## Objective

Corregir las discrepancias en `docs/API_CONTRACT.md` para que coincida exactamente con la implementación real del backend de Clínicas.

## Scope

- Corregir el método del cambio de estado a `PATCH /api/v1/admin/clinicas/{id}/estado`.
- Corregir la ruta de configuración de la clínica de `/api/v1/clinica/configuracion` a `/api/v1/clinica`.
- Marcar explícitamente como "Faltante en Backend por ahora" el endpoint `GET /api/v1/admin/clinicas/{id}`.

## Out of Scope

- Escribir código Java o TypeScript.

## Acceptance Criteria

- El contrato describe el comportamiento exacto de `SuperAdminClinicaController` y `ClinicaController`.
