CREATE TABLE citas (
    id BIGSERIAL PRIMARY KEY,
    clinica_id BIGINT NOT NULL,
    paciente_id BIGINT NOT NULL,
    medico_id BIGINT NOT NULL,
    fecha_hora_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_hora_fin TIMESTAMP WITH TIME ZONE NOT NULL,
    duracion_minutos INT NOT NULL,
    estado VARCHAR(50) NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    observaciones VARCHAR(1000),
    motivo_cancelacion VARCHAR(500),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    created_by VARCHAR(120),
    updated_by VARCHAR(120),
    CONSTRAINT fk_cita_clinica FOREIGN KEY (clinica_id) REFERENCES clinicas (id),
    CONSTRAINT fk_cita_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes (id),
    CONSTRAINT fk_cita_medico FOREIGN KEY (medico_id) REFERENCES medicos (id)
);

CREATE INDEX idx_citas_clinica ON citas (clinica_id);
CREATE INDEX idx_citas_clinica_fecha_inicio ON citas (clinica_id, fecha_hora_inicio);
CREATE INDEX idx_citas_clinica_medico_fecha ON citas (clinica_id, medico_id, fecha_hora_inicio);
CREATE INDEX idx_citas_clinica_paciente_fecha ON citas (clinica_id, paciente_id, fecha_hora_inicio);
CREATE INDEX idx_citas_clinica_estado_fecha ON citas (clinica_id, estado, fecha_hora_inicio);
