# QA-PACIENTES-001

Status: COMPLETED
Owner: Builder
Type: QA
Priority: Medium

## Objective
Pruebas E2E en Playwright y verificación multi-tenant del módulo de Pacientes.

## Scope
- Ejecución de suite completa E2E simulando ADMIN_CLINICA, RECEPCIONISTA y MEDICO.
- Validar listado, búsqueda, creación y edición exitosas respetando campos editables.
- Validar restricción de endpoints según rol (MEDICO/RECEPCIONISTA no deben poder desactivar pacientes).
- Asegurar aislamiento cross-tenant (Alpha no ve, ni edita, ni lista a los pacientes de Beta, lanzando 404).
