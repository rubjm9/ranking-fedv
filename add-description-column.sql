-- Agregar columna description a la tabla regions
-- Ejecutar en Supabase SQL Editor

-- Agregar columna description si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'regions' 
        AND column_name = 'description'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.regions ADD COLUMN description TEXT;
    END IF;
END $$;

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'regions' 
AND table_schema = 'public'
ORDER BY ordinal_position;
