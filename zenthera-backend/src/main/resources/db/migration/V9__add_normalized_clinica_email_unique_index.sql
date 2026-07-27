DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM clinicas
        WHERE correo IS NOT NULL
        GROUP BY LOWER(BTRIM(correo))
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Cannot create normalized clinic email unique index: duplicate normalized non-null values detected';
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uk_clinica_correo_normalized
    ON clinicas (LOWER(BTRIM(correo)))
    WHERE correo IS NOT NULL;
