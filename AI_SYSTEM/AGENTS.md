# Router interno del sistema de agentes

CANONICAL_GLOBAL_RULES: ../AGENTS.md

Este archivo no sustituye `AGENTS.md`. La fuente global canónica es `../AGENTS.md`.

## Orden obligatorio de carga

1. Leer `../AGENTS.md` del raíz.
2. Leer el archivo exacto del rol activo.
3. Bloquear si cualquiera de los dos no está disponible.

## Roles disponibles

| Rol | Ruta |
| --- | --- |
| Atlas | `AI_SYSTEM/agents/00-atlas.md` |
| Builder | `AI_SYSTEM/agents/01-builder.md` |
| Inspector | `AI_SYSTEM/agents/02-inspector.md` |
| Scribe | `AI_SYSTEM/agents/03-scribe.md` |
| Aura | `AI_SYSTEM/agents/04-aura-uiux.md` |

Cada agente debe cargar primero `../AGENTS.md` y después su archivo exacto de rol. Este router no es una segunda fuente global de reglas.
