# FRONT-CLINICAS-002

Status: COMPLETED
Owner: Builder
Type: Frontend
Priority: High

## Objective

Crear la pantalla de Listado Global de Clínicas para SUPER_ADMIN en `/admin/clinicas`.

## Scope

- Implementar la tabla interactiva con columnas: Nombre, RUC, Ciudad, Estado (Activa/Suspendida).
- Paginación básica conectada a `/api/v1/admin/clinicas`.
- Implementar "Skeletons" para estado de carga (Loading State).
- Implementar "Empty State" (estado vacío) visualmente premium.

## Out of Scope

- Pantalla de creación (Onboarding).
- Pantalla de detalle individual.

## Acceptance Criteria

- La UI es premium, estética y moderna (TailwindCSS).
- Los servicios de `clinicas.ts` se usan correctamente con manejo de errores estandarizado.
- `npm run build` es exitoso.
