-- Activa RLS en las tablas que marcaba el Security Advisor de Supabase.
-- Seguro de ejecutar varias veces. Mantiene la web funcionando:
-- lectura pública (anon) + escritura solo para usuarios autenticados.

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['current_rankings', 'ranking_history', 'team_season_points', 'configuration']
  LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS "Lectura pública" ON public.%I', t);
      EXECUTE format('DROP POLICY IF EXISTS "Escritura autenticados" ON public.%I', t);
      EXECUTE format('CREATE POLICY "Lectura pública" ON public.%I FOR SELECT USING (true)', t);
      EXECUTE format('CREATE POLICY "Escritura autenticados" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
    END IF;
  END LOOP;
END $$;

-- Tabla interna de Prisma: RLS sin políticas = inaccesible por la API REST.
-- (Las migraciones de Prisma conectan con el rol postgres, que ignora RLS.)
ALTER TABLE IF EXISTS public._prisma_migrations ENABLE ROW LEVEL SECURITY;
