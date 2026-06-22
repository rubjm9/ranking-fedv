-- ================================================
-- Migración 015B: Backfill de slugs (ejecutar en SQL Editor)
-- Bypassa RLS al ejecutarse como postgres/service role.
-- Ejecutar DESPUÉS de 015_add_team_slugs.sql
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
    FROM teams
    WHERE slug IS NULL
    ORDER BY "createdAt" ASC NULLS LAST, id ASC
  LOOP
    base_slug := trim(both '-' from regexp_replace(
      regexp_replace(
        lower(translate(
          r.name,
          'áàäâãéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ',
          'aaaaaeeeeiiiiooooouuuuncAAAAAEEEEIIIIOOOOOUUUUNC'
        )),
        '[^a-z0-9]+', '-', 'g'
      ),
      '-+', '-', 'g'
    ));

    IF base_slug = '' OR base_slug IS NULL THEN
      base_slug := 'equipo';
    END IF;

    final_slug := base_slug;
    counter := 2;
    WHILE final_slug = ANY(used_slugs) LOOP
      final_slug := base_slug || '-' || counter::text;
      counter := counter + 1;
    END LOOP;

    used_slugs := array_append(used_slugs, final_slug);
    UPDATE teams SET slug = final_slug WHERE id = r.id;
  END LOOP;
END $$;

-- Verificación
SELECT id, name, slug FROM teams ORDER BY name LIMIT 20;
