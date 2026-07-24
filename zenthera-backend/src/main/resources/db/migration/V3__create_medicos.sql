CREATE TABLE
    medicos (
        id BIGSERIAL PRIMARY KEY,
        clinica_id BIGINT NOT NULL,
        cedula VARCHAR(13) NOT NULL,
        nombres VARCHAR(80) NOT NULL,
        apellidos VARCHAR(80) NOT NULL,
        especialidad VARCHAR(100) NOT NULL,
        telefono VARCHAR(20),
        correo VARCHAR(120),
        direccion VARCHAR(255),
        registro_Profesional VARCHAR(20),
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP,
        CONSTRAINT fk_medico_clinica FOREIGN KEY (clinica_id) REFERENCES clinicas (id)
    );

CREATE UNIQUE INDEX uk_medico_clinica_cedula ON medicos (clinica_id, cedula);
