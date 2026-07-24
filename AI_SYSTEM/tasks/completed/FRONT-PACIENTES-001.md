# FRONT-PACIENTES-001

Status: IN_PROGRESS
Owner: Builder
Type: Frontend
Priority: High

## Objective
Crear servicio API, validaciones Zod y listado principal de pacientes.

## Scope
- Crear `src/lib/api/pacientes.ts` con consumo de los endpoints unificados.
- Crear esquemas en `src/lib/validations/pacientes.schema.ts` (`PacienteRequest`, omitiendo explícitamente historia clínica, citas, y `clinicaId`).
- Desarrollar la pantalla `/dashboard/pacientes` con tabla paginada.
- Implementar controles de búsqueda por nombre/cédula, filtro de estado y ordenamiento (whitelist).
- Mostrar botón de "Nuevo Paciente" para los roles autorizados.
- Respetar matriz de roles en la interfaz (RoleGuard u ocultando acciones).
