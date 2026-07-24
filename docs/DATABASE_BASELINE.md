# Línea Base de la Base de Datos (Zenthera)

Este documento describe el estado real de la base de datos que se esperaba fuera creado en `V1__baseline.sql` (pero que quedó vacío por error). Las migraciones posteriores como `V2` y `V3` dependen de estas tablas para ejecutarse correctamente.

```sql
CREATE TABLE clinicas (
    id          BIGSERIAL     PRIMARY KEY,
    nombre      VARCHAR(150)  NOT NULL,
    ruc         VARCHAR(13)   UNIQUE,
    telefono    VARCHAR(20),
    correo      VARCHAR(120),
    direccion   TEXT,
    ciudad      VARCHAR(100),
    provincia   VARCHAR(100),
    pais        VARCHAR(80),
    logo        VARCHAR(255),
    activa      BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP     NOT NULL,
    updated_at  TIMESTAMP
);

CREATE TABLE roles (
    id          BIGSERIAL    PRIMARY KEY,
    nombre      VARCHAR(50)  NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    created_at  TIMESTAMP    NOT NULL,
    updated_at  TIMESTAMP
);

CREATE TABLE usuarios (
    id               BIGSERIAL    PRIMARY KEY,
    clinica_id       BIGINT       NOT NULL REFERENCES clinicas(id),
    rol_id           BIGINT       NOT NULL REFERENCES roles(id),
    nombres          VARCHAR(120) NOT NULL,
    apellidos        VARCHAR(120) NOT NULL,
    cedula           VARCHAR(20)  NOT NULL UNIQUE,
    telefono         VARCHAR(20),
    correo           VARCHAR(120) NOT NULL UNIQUE,
    password         TEXT         NOT NULL,
    foto             VARCHAR(255),
    activo           BOOLEAN      NOT NULL DEFAULT TRUE,
    ultimo_login     TIMESTAMP,
    bloqueado        BOOLEAN      NOT NULL DEFAULT FALSE,
    cambiar_password BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMP    NOT NULL,
    updated_at       TIMESTAMP
);
```
