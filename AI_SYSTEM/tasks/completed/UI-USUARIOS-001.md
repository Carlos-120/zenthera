# UI-USUARIOS-001

Status: COMPLETED
Owner: Inspector
Type: UI/UX
Priority: Low

## Lecturas Obligatorias
El agente responsable debe leer estrictamente los siguientes archivos antes de ejecutar esta tarea:
- `AI_SYSTEM/agents/04-aura-uiux.md`
- `AI_SYSTEM/tasks/active/UI-USUARIOS-001.md`
- `AI_SYSTEM/design/DESIGN_SYSTEM.md`
- `AI_SYSTEM/handoffs/current-handoff.md`

## Objetivo
Aplicar el rediseño y estandarización visual según `DESIGN_SYSTEM.md` al módulo de Usuarios previamente implementado.

## Alcance
1. Revisar `/dashboard/usuarios`.
2. Revisar `/dashboard/usuarios/nuevo`.
3. Revisar `/dashboard/usuarios/[id]`.
4. Revisar modales (e.g., reseteo de contraseña, cambio de estado).
5. Mejorar consistencia visual de botones, tablas, formularios, modales y mensajes de estado (loading, error, vacío).
6. Asegurar accesibilidad y contrastes correctos.

## Prohibiciones
- NO modificar el backend.
- NO romper la lógica implementada de React Query o Axios.
- NO alterar la matriz de roles o guardas de seguridad.

## Criterio de Aceptación
- La UI sigue fielmente el `DESIGN_SYSTEM.md`.
- Inspector valida que la funcionalidad se mantiene intacta tras el refactor estético.
