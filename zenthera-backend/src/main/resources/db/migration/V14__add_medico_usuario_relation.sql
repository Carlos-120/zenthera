ALTER TABLE IF EXISTS medicos 
    ADD COLUMN usuario_id BIGINT;

ALTER TABLE IF EXISTS medicos 
    ADD CONSTRAINT fk_medicos_usuario 
    FOREIGN KEY (usuario_id) 
    REFERENCES usuarios (id);

ALTER TABLE IF EXISTS medicos 
    ADD CONSTRAINT uk_medico_usuario UNIQUE (usuario_id);
