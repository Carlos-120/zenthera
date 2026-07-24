# FRONT-CLINICAS-006

Status: COMPLETED
Owner: Builder
Type: QA
Priority: Medium

## Objective

Pruebas E2E en Playwright y revisión de Accesibilidad de todo el flujo de Clínicas.

## Scope

- Escribir flujos automatizados de extremo a extremo que cubran:
  - Listado de Clínicas.
  - Creación (Onboarding).
  - Detalle de la clínica.
  - Suspensión y reactivación (control de estado).
  - Configuración local de `ADMIN_CLINICA` (`/dashboard/mi-clinica`).
  - Control de acceso estricto por roles (`SUPER_ADMIN` vs `ADMIN_CLINICA`).
- Asegurar conformidad con reglas de accesibilidad básicas (roles ARIA, contrastes, navegación por teclado).
- No cerrar la vertical de Clínicas hasta que Inspector valide los resultados y confirme que los tests de Playwright se ejecutan y pasan correctamente.
