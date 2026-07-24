# Configuración de Base de Datos para Nuevos Desarrolladores

Para crear la base de datos de ZENTHERA desde cero:

1. **Crear base de datos en PostgreSQL:**
   ```sql
   CREATE DATABASE zenthera_db;
   ```

> [!WARNING]
> **El proceso de Re-Baseline automatizado está pendiente.**
>
> Actualmente **NO** existe un procedimiento automatizado o script Flyway oficial aprobado para reconstruir el esquema de PostgreSQL desde cero debido al estado vacío de `V1__baseline.sql`.
>
> Cualquier solución temporal (como ejecutar Hibernate DDL-Auto en `create` o usar `flyway:repair`) está estrictamente desaconsejada y prohibida hasta que se diseñe y apruebe la Fase 2 del Roadmap (donde se resolverá el re-baseline de la clínica y esquema principal).
>
> Consulta `DATABASE_BASELINE.md` si necesitas revisar el esquema lógico de las entidades base.
