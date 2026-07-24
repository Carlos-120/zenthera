# FRONT-CLINICAS-003

Status: COMPLETED
Owner: Builder
Type: Frontend
Priority: High

## Objective

Crear la Pantalla de Onboarding (Creación) de Clínicas en `/admin/clinicas/nueva`.

## Scope

- Implementar formulario interactivo para registrar nueva clínica y administrador inicial.
- Utilizar `react-hook-form` acoplado al esquema `ClinicaCreateSchema` de Zod existente.
- Prevenir doble envío del formulario durante la carga (submit múltiple).
- Manejo de error y redirección en caso de éxito a `/admin/clinicas` usando un toast.

## Out of Scope

- Pantalla de configuración local de clínica.
- Cambios en endpoints del backend.

## Acceptance Criteria

- El formulario renderiza correctamente y luce premium (diseño unificado).
- La validación del esquema se ejecuta client-side (Zod).
- Tras el éxito, redirige a la tabla principal.
- `npm run build` compila correctamente.
