# FRONT-CLINICAS-005

Status: COMPLETED
Owner: Builder
Type: Frontend
Priority: High

## Objective

Crear la Pantalla de Configuración Local (`/dashboard/mi-clinica`) exclusiva para el rol `ADMIN_CLINICA`.

## Scope

- Mostrar y permitir la edición de los datos de la propia clínica mediante un formulario.
- Utilizar `RoleGuard` para garantizar que solo un `ADMIN_CLINICA` ingrese.
- Utilizar el endpoint `GET /api/v1/clinica` para cargar los datos actuales.
- Utilizar el endpoint `PUT /api/v1/clinica` para actualizarlos.
- Prevenir envíos múltiples.
- Mostrar notificaciones de éxito/error.

## Acceptance Criteria

- El layout y los estilos siguen la identidad visual del proyecto.
- Al guardar exitosamente, la caché de React Query se invalida para refrescar datos.
- `npm run build` compila sin errores.
