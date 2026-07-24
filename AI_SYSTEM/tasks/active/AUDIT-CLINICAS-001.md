# AUDIT-CLINICAS-001 — Verificar estado real del backend de Clínicas

## Estado

IN_PROGRESS

## Tipo

Auditoría técnica sin modificaciones de producción

## Objetivo

Comparar la documentación con el código y determinar el estado real del backend del slice Clínicas.

## Contexto

PROJECT_STATUS y CHECKPOINT presentan estados incompatibles.

## Alcance permitido

El agente puede leer:

- zenthera-backend/
- zenthera-db/
- docs/
- BACKLOG.md
- PROJECT_CONTEXT.md
- implementation_plan.md
- task.md

El agente puede ejecutar:

- pruebas del backend;
- compilación Maven;
- búsquedas en el código;
- revisión de migraciones;
- revisión de git diff y git log.

El agente solo puede escribir:

- AI_SYSTEM/reports/analysis/AUDIT-CLINICAS-001.md
- AI_SYSTEM/handoffs/current-handoff.md

## Prohibiciones

- No modificar código de producción.
- No modificar migraciones.
- No corregir errores.
- No crear el frontend.
- No instalar dependencias.
- No modificar la documentación oficial todavía.
- No realizar commits.

## Puntos obligatorios de revisión

1. Rotación concurrente de refresh tokens.
2. Capturas genéricas de excepciones.
3. Perfil de DevNotificationServiceImpl.
4. Exposición de tokens en logs.
5. Entropía del token de activación.
6. Restricción UNIQUE sobre token_hash.
7. Flujo de consumo único del token.
8. Expiración del token.
9. Transaccionalidad.
10. Pruebas relacionadas.
11. Estado de las migraciones V5 y V6.
12. Compilación y pruebas del backend.

## Comandos mínimos

Desde zenthera-backend:

- ./mvnw test
- ./mvnw clean verify

En Windows pueden utilizarse:

- .\mvnw.cmd test
- .\mvnw.cmd clean verify

## Criterios de aceptación

El reporte debe:

- citar archivos y líneas aproximadas;
- distinguir corregido, pendiente y no verificable;
- mostrar comandos y resultados;
- clasificar riesgos;
- recomendar una única siguiente tarea;
- no afirmar que el backend está aprobado sin evidencia.