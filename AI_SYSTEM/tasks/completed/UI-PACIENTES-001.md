# UI-PACIENTES-001

Status: COMPLETED
Owner: Inspector
Type: UI/UX
Priority: Low

## Lecturas Obligatorias
El agente responsable debe leer estrictamente los siguientes archivos antes de ejecutar esta tarea:
- `AI_SYSTEM/agents/04-aura-uiux.md`
- `AI_SYSTEM/tasks/active/UI-PACIENTES-001.md`
- `AI_SYSTEM/design/DESIGN_SYSTEM.md`
- `AI_SYSTEM/handoffs/current-handoff.md`

## Objetivo
Aplicar el rediseño y estandarización visual según `DESIGN_SYSTEM.md` al módulo de Pacientes recientemente implementado.

## Alcance
1. Revisar `/dashboard/pacientes`.
2. Revisar `/dashboard/pacientes/nuevo`.
3. Revisar `/dashboard/pacientes/[id]`.
4. Revisar modales (cambio de estado Activo/Inactivo).
5. Mejorar consistencia visual de botones, inputs complejos, tablas y mensajes de estado.
6. Asegurar accesibilidad (aria-labels, focus rings) y jerarquía visual del modo de lectura vs modo edición.

## Prohibiciones
- NO modificar el backend.
- NO romper la lógica de los formularios (React Hook Form, Zod).
- NO alterar dependencias ni rutas.

## Criterio de Aceptación
- Las pantallas lucen consistentes con el módulo de Usuarios (post-rediseño) y con el `DESIGN_SYSTEM.md`.
- Inspector valida la funcionalidad completa después de la aplicación de estilos.
