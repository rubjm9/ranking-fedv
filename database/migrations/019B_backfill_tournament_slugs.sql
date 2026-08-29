-- ================================================
-- Migración 019B: Backfill de slugs de campeonatos (ejecutar en SQL Editor)
-- Bypassa RLS al ejecutarse como postgres/service role.
-- Ejecutar DESPUÉS de 019_add_tournament_slugs.sql
-- ================================================

DO $$
DECLARE
  r RECORD;
  base_slug text;
  final_slug text;
  counter int;
  used_slugs text[] := ARRAY[]::text[];
BEGIN
  FOR r IN
    SELECT id, name
    FROM tournaments
    WHERE slug IS NULL
    ORDER BY year DESC, "updatedAt" DESC NULLS LAST, id ASC
  LOOP
    base_slug := trim(both '-' from regexp_replace(
      regexp_replace(
        lower(translate(
          coalesce(nullif(trim(r.name), ''), 'campeonato'),
          'áàäâãéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ',
          'aaaaaeeeeiiiiooooouuuuncAAAAAEEEEIIIIOOOOOUUUUNC'
        )),
        '[^a-z0-9]+', '-', 'g'
      ),
      '-+', '-', 'g'
    ));

    IF base_slug = '' OR base_slug IS NULL THEN
      base_slug := 'campeonato';
    END IF;

    final_slug := base_slug;
    counter := 2;
    WHILE final_slug = ANY(used_slugs) LOOP
      final_slug := base_slug || '-' || counter::text;
      counter := counter + 1;
    END LOOP;

    used_slugs := array_append(used_slugs, final_slug);
    UPDATE tournaments SET slug = final_slug WHERE id = r.id;
  END LOOP;
END $$;

-- Verificación
SELECT id, name, slug FROM tournaments ORDER BY year DESC LIMIT 20;
