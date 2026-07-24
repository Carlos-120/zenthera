CREATE TABLE
    pacientes (
        id BIGSERIAL PRIMARY KEY,
        clinica_id BIGINT NOT NULL,
        cedula VARCHAR(13) NOT NULL,
        nombres VARCHAR(80) NOT NULL,
        apellidos VARCHAR(80) NOT NULL,
        fecha_nacimiento DATE NOT NULL,
        sexo VARCHAR(20) NOT NULL,
        telefono VARCHAR(20),
        correo VARCHAR(120),
        direccion VARCHAR(255),
        tipo_sangre VARCHAR(5),
        alergias TEXT,
        contacto_emergencia VARCHAR(120),
        telefono_emergencia VARCHAR(20),
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP,
        CONSTRAINT fk_paciente_clinica FOREIGN KEY (clinica_id) REFERENCES clinicas (id)
    );

CREATE UNIQUE INDEX uk_paciente_clinica_cedula ON pacientes (clinica_id, cedula);
