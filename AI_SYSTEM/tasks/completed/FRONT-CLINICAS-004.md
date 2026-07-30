# FRONT-CLINICAS-004

Status: COMPLETED
Owner: Builder
Type: Frontend
Priority: Medium

## Objective

Crear la Pantalla de Detalle y Suspensión de clínica en `/admin/clinicas/[id]`.

## Scope

- Mostrar toda la información detallada de la clínica.
- Botones y modal interactivo para "Suspender" y "Reactivar" requiriendo un `motivo`.
- **BLOQUEO:** Requiere obligatoriamente que la tarea `BACK-CLINICAS-DETAIL-001` sea finalizada y probada, ya que depende del endpoint `GET /api/v1/admin/clinicas/{id}` que actualmente no existe en el backend.
  BACKEND_BLOCKER: RESOLVED
  READY_TO_CONTINUE: YES

## Acceptance Criteria

- El bloqueo debe mantenerse hasta que backend valide.
- Funcionalidad de suspensión enviando un PATCH correcto.
