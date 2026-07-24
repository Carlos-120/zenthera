# Auditoría de Constraints en PostgreSQL (ZENTHERA)

Esta auditoría describe el estado actual de la base de datos PostgreSQL, los esquemas de Flyway y cómo se relacionan con las entidades JPA, con el fin de diseñar una migración (V7) segura.

## 1. Entorno de Base de Datos
- **Versión de PostgreSQL:** PostgreSQL 17.10 on x86_64-windows
- **Esquema Activo:** `public`
- **Usuario:** `postgres`

## 2. Historial de Flyway (`flyway_schema_history`)

| installed_rank | version | description | type | script | success |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | 1 | `<< Flyway Baseline >>` | BASELINE | `<< Flyway Baseline >>` | t |
| 2 | 2 | create pacientes | SQL | V2__create_pacientes.sql | t |
| 3 | 3 | create medicos | SQL | V3__create_medicos.sql | t |
| 4 | 4 | create refresh tokens | SQL | V4__create_refresh_tokens.sql | t |
| 5 | 5 | update clinicas and audit | SQL | V5__update_clinicas_and_audit.sql | t |
| 6 | 6 | create activation tokens | SQL | V6__create_activation_tokens.sql | t |

> **V1 (Baseline)** no contiene DDL para crear las tablas fundacionales (`usuarios`, `clinicas`, `roles`). En su lugar, el esquema original fue generado automáticamente por Hibernate (antes de implementar Flyway) y luego Flyway fue "baselinizado" en la versión 1.
> **Impacto:** Actualmente NO es posible reconstruir el esquema desde cero en una base de datos vacía usando exclusivamente Flyway, ya que las migraciones asumen la existencia previa de estas tablas.

## 3. Constraints Reales en PostgreSQL

Mediante una consulta directa a `pg_constraint`, se identificaron los siguientes constraints en las tablas `usuarios` y `clinicas`:

### Tabla `clinicas`
| Nombre Real | Tipo | Columnas | Definición | Validated | Deferrable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `clinicas_pkey` | Primary Key (`p`) | `id` | `PRIMARY KEY (id)` | `true` | `false` |
| `ukp4ikh0cjnhgbvk5lmq61gch11` | Unique (`u`) | `ruc` | `UNIQUE (ruc)` | `true` | `false` |

### Tabla `usuarios`
| Nombre Real | Tipo | Columnas | Definición | Validated | Deferrable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `usuarios_pkey` | Primary Key (`p`) | `id` | `PRIMARY KEY (id)` | `true` | `false` |
| `ukefovjjo5q5jlsa0f9eoptdjly` | Unique (`u`) | `cedula` | `UNIQUE (cedula)` | `true` | `false` |
| `ukcdmw5hxlfj78uf4997i3qyyw5` | Unique (`u`) | `correo` | `UNIQUE (correo)` | `true` | `false` |
| `fknd12oq18m4e8stc8nkckhrxog` | Foreign Key (`f`) | `clinica_id` | `FOREIGN KEY (clinica_id) REFERENCES clinicas(id)` | `true` | `false` |
| `fkqf5elo4jcq7qrt83oi0qmenjo` | Foreign Key (`f`) | `rol_id` | `FOREIGN KEY (rol_id) REFERENCES roles(id)` | `true` | `false` |

## 4. Índices Existentes
Al consultar `pg_indexes`, cada restricción UNIQUE cuenta con su respectivo índice B-Tree, y sus nombres coinciden exactamente con los de los constraints autogenerados:

- `ukp4ikh0cjnhgbvk5lmq61gch11` (`clinicas.ruc`)
- `ukefovjjo5q5jlsa0f9eoptdjly` (`usuarios.cedula`)
- `ukcdmw5hxlfj78uf4997i3qyyw5` (`usuarios.correo`)

## 5. Análisis de Duplicados Existentes

Antes de proponer cualquier migración, verificamos si existen registros duplicados en las tablas.
- `usuarios.correo`: 0 duplicados.
- `usuarios.cedula`: 0 duplicados.
- `clinicas.ruc`: 0 duplicados.

> Dado que no hay datos duplicados, podemos renombrar y/o recrear de forma segura estas restricciones en Flyway sin temor a fallos por violación de integridad preexistente.

## 6. Diferencias entre PostgreSQL, JPA y Flyway

Existen discrepancias significativas entre lo que el código Java asume y lo que realmente existe en la base de datos:

1. **Entidades JPA**: `@Table` define `name="uk_usuario_correo"` y `name="uk_usuario_cedula"`.
2. **GlobalExceptionHandler**: Busca los nombres `"usuarios_correo_key"`, `"uk_usuario_correo"`, `"clinicas_ruc_key"`, `"uk_clinica_ruc"`.
3. **PostgreSQL Real**: Los nombres reales son autogenerados por versiones antiguas de Hibernate (ej. `ukcdmw5hxlfj78uf4997i3qyyw5`).

> **Fallo Funcional Actual**: Si un usuario intenta registrar un correo duplicado hoy en el ambiente de desarrollo, la BD arroja un error mencionando `ukcdmw5hxlfj78uf4997i3qyyw5`. Como el handler no reconoce este hash, no retorna el mensaje amigable ("El correo electrónico..."), sino el genérico HTTP 409.
