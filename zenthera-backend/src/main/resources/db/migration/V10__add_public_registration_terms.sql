ALTER TABLE clinicas
    ADD COLUMN terminos_aceptados BOOLEAN DEFAULT FALSE,
    ADD COLUMN terminos_aceptados_en TIMESTAMP WITH TIME ZONE,
    ADD COLUMN terminos_version VARCHAR(50);
