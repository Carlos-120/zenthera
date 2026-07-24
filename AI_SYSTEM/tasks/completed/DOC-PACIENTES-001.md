# DOC-PACIENTES-001

Status: IN_PROGRESS
Owner: Builder
Type: Documentation
Priority: High

## Objective
Actualizar `docs/API_CONTRACT.md` con los endpoints y reglas del módulo de Pacientes.

## Scope
- Definir endpoints bajo el prefijo `/api/v1/clinica/pacientes`.
- Aclarar exclusiones de payload: prohibido `clinicaId`, historia clínica, citas, facturación, archivos médicos.
- Reglas de negocio en PUT: No se puede mover el paciente (cross-tenant), ID foráneo devuelve `404 Not Found`, actualización restringida por rol y campos permitidos.
- Parámetros `GET /`: `page`, `size` (máximo 50), `search`, `activo`, `sort` (whitelist: `createdAt, nombres, apellidos, cedula`).

## Matriz de Roles
| Operación | ADMIN_CLINICA | MEDICO | RECEPCIONISTA |
|---|---|---|---|
| GET / (Listar) | ✅ | ✅ | ✅ |
| GET /{id} (Detalle) | ✅ | ✅ | ✅ |
| POST / (Crear) | ✅ | ✅ | ✅ |
| PUT /{id} (Editar) | ✅ | ✅ | ✅ |
| PATCH /{id}/estado | ✅ | ❌ | ❌ |
