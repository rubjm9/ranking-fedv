/**
 * Backfill de slugs para campeonatos existentes.
 * Ejecutar tras aplicar la migración 019_add_tournament_slugs.sql:
 *   npm run backfill-tournament-slugs
 *
 * Requiere .env.local con VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (recomendado).
 * Alternativa sin service role: ejecutar 019B_backfill_tournament_slugs.sql en Supabase SQL Editor.
 */

import { createClient } from '@supabase/supabase-js'
import { generateUniqueSlug } from '../utils/slug'
import { buildTournamentPageTitle } from '../utils/seoTitles'

const url = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.VITE_SUPABASE_ANON_KEY
const key = serviceKey || anonKey

if (!url || !key) {
  console.error('Faltan VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (o VITE_SUPABASE_ANON_KEY) en .env.local')
  process.exit(1)
}

if (!serviceKey) {
  console.warn('⚠️  Sin SUPABASE_SERVICE_ROLE_KEY: el backfill puede fallar por RLS.')
  console.warn('   Añade SUPABASE_SERVICE_ROLE_KEY a .env.local o ejecuta database/migrations/019B_backfill_tournament_slugs.sql')
}

const supabase = createClient(url, key)

const backfillTournamentSlugs = async () => {
  console.log('Iniciando backfill de slugs de campeonatos...')

  const { data: tournaments, error } = await supabase
    .from('tournaments')
    .select('id, name, slug, type, year, surface, category, updatedAt, region:regions(name)')
    .order('year', { ascending: false })

  if (error) throw error
  if (!tournaments?.length) {
    console.log('No hay campeonatos para procesar.')
    return
  }

  const usedSlugs = new Set<string>(
    tournaments.filter((t) => t.slug).map((t) => t.slug as string)
  )
  let updated = 0
  let skipped = 0
  let failed = 0

  for (const tournament of tournaments) {
    if (tournament.slug) {
      skipped++
      continue
    }

    const region = Array.isArray(tournament.region) ? tournament.region[0] : tournament.region
    const title = buildTournamentPageTitle({
      type: tournament.type,
      year: tournament.year,
      surface: tournament.surface,
      category: tournament.category,
      region,
    })
    const slug = generateUniqueSlug(title, usedSlugs)
    usedSlugs.add(slug)

    const { data: updatedRows, error: updateError } = await supabase
      .from('tournaments')
      .update({ slug })
      .eq('id', tournament.id)
      .select('id')

    if (updateError) {
      console.error(`Error actualizando "${title}":`, updateError.message)
      failed++
      continue
    }

    if (!updatedRows?.length) {
      console.error(`Sin permisos para actualizar "${title}" (RLS). Usa service role o SQL 019B.`)
      failed++
      continue
    }

    console.log(`  ${title} -> ${slug}`)
    updated++
  }

  console.log(`Backfill completado: ${updated} actualizados, ${skipped} ya tenían slug, ${failed} fallidos.`)
  if (failed > 0) process.exit(1)
}

backfillTournamentSlugs().catch((err) => {
  console.error('Error en backfill:', err)
  process.exit(1)
})
