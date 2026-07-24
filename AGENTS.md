# Zenthera AI Development System

## Objetivo

Desarrollar Zenthera de forma incremental, segura, verificable y documentada mediante agentes de inteligencia artificial supervisados por el propietario del proyecto.

## Producto

Zenthera es una plataforma SaaS multi-tenant y modular para la gestión de clínicas privadas.

## Tecnologías principales

- Backend: Java 21 y Spring Boot
- Frontend: Next.js, React y TypeScript
- Base de datos: PostgreSQL
- Migraciones: Flyway
- Arquitectura: monolito modular
- Método de desarrollo: vertical slices

## Autoridad

Carlos es el Product Owner y responsable final del proyecto.

Ningún agente puede:

- cambiar el alcance del producto;
- iniciar una nueva fase;
- modificar la arquitectura principal;
- agregar dependencias importantes;
- eliminar información;
- integrar cambios en main;

sin aprobación humana.

## Archivos que deben leerse antes de trabajar

1. AGENTS.md
2. PROJECT_CONTEXT.md
3. docs/PROJECT_STATUS.md
4. docs/CHECKPOINT.md
5. docs/API_CONTRACT.md
6. docs/DATABASE.md
7. BACKLOG.md
8. AI_SYSTEM/phases/current-phase.md
9. AI_SYSTEM/tasks/active/
10. AI_SYSTEM/handoffs/current-handoff.md

## Flujo obligatorio

Toda funcionalidad debe pasar por:

1. análisis;
2. definición de la tarea;
3. implementación;
4. pruebas;
5. revisión independiente;
6. corrección;
7. prueba del usuario;
8. documentación;
9. aprobación humana;
10. cierre.

## Una tarea a la vez

Solo puede existir una tarea principal en estado IN_PROGRESS.

No comenzar otra funcionalidad mientras la tarea activa tenga errores bloqueantes o no haya sido aprobada.

## Estados permitidos

- BACKLOG
- ANALYSIS
- READY
- IN_PROGRESS
- BLOCKED
- IN_REVIEW
- CHANGES_REQUESTED
- USER_ACCEPTANCE
- APPROVED
- COMPLETED

## Seguridad multi-tenant

Toda operación que maneje datos de una clínica debe:

- identificar la clínica desde el usuario autenticado;
- evitar que el cliente seleccione arbitrariamente otro clinicaId;
- filtrar consultas por clínica;
- comprobar permisos;
- impedir acceso cruzado entre clínicas;
- tener pruebas de aislamiento multi-tenant.

## Prohibiciones

- No trabajar directamente sobre main.
- No modificar archivos fuera del alcance de la tarea.
- No eliminar migraciones ya aplicadas.
- No exponer contraseñas, tokens o secretos.
- No usar datos médicos reales en pruebas.
- No ocultar errores de compilación.
- No desactivar pruebas para obtener un resultado exitoso.
- No instalar dependencias sin justificación.
- No declarar una tarea terminada sin evidencia.
- No cambiar contratos de API sin actualizar la documentación.
- No hacer refactorizaciones no relacionadas con la tarea.

## Definición de terminado

Una tarea solo puede considerarse terminada cuando:

- cumple los criterios de aceptación;
- el backend compila;
- el frontend compila, cuando corresponda;
- pasan las pruebas relacionadas;
- no existen hallazgos bloqueantes;
- la seguridad multi-tenant fue revisada;
- el código fue revisado por otro agente;
- la documentación está actualizada;
- existe un reporte de entrega;
- Carlos aprobó el funcionamiento.