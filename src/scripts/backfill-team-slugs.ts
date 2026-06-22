/**
 * Backfill de slugs para equipos existentes.
 * Ejecutar tras aplicar la migración 015_add_team_slugs.sql:
 *   npm run backfill-slugs
 *
 * Requiere .env.local con VITE_SUPABASE_URL y una de:
 * - SUPABASE_SERVICE_ROLE_KEY (recomendado; la anon key no puede escribir por RLS)
 * - VITE_SUPABASE_ANON_KEY (solo si las políticas RLS permiten UPDATE)
 *
 * Alternativa sin service role: ejecutar 015B_backfill_team_slugs.sql en Supabase SQL Editor.
 */

import { createClient } from '@supabase/supabase-js'
import { generateUniqueSlug } from '../utils/slug'

const url = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.VITE_SUPABASE_ANON_KEY
const key = serviceKey || anonKey

if (!url || !key) {
  console.error('Faltan VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (o VITE_SUPABASE_ANON_KEY) en .env.local')
  process.exit(1)
}

if (!serviceKey) {
  console.warn('⚠️  Sin SUPABASE_SERVICE_ROLE_KEY: el backfill puede fallar silenciosamente por RLS.')
  console.warn('   Añade SUPABASE_SERVICE_ROLE_KEY a .env.local o ejecuta database/migrations/015B_backfill_team_slugs.sql')
}

const supabase = createClient(url, key)

const backfillTeamSlugs = async () => {
  console.log('Iniciando backfill de slugs de equipos...')

  const { data: teams, error } = await supabase
    .from('teams')
    .select('id, name, slug, createdAt')
    .order('createdAt', { ascending: true })

  if (error) throw error
  if (!teams?.length) {
    console.log('No hay equipos para procesar.')
    return
  }

  const usedSlugs = new Set<string>(
    teams.filter((t) => t.slug).map((t) => t.slug as string)
  )
  let updated = 0
  let skipped = 0
  let failed = 0

  for (const team of teams) {
    if (team.slug) {
      skipped++
      continue
    }

    const slug = generateUniqueSlug(team.name, usedSlugs)
    usedSlugs.add(slug)

    const { data: updatedRows, error: updateError } = await supabase
      .from('teams')
      .update({ slug })
      .eq('id', team.id)
      .select('id')

    if (updateError) {
      console.error(`Error actualizando "${team.name}":`, updateError.message)
      failed++
      continue
    }

    if (!updatedRows?.length) {
      console.error(`Sin permisos para actualizar "${team.name}" (RLS). Usa service role o SQL 015B.`)
      failed++
      continue
    }

    console.log(`  ${team.name} -> ${slug}`)
    updated++
  }

  console.log(`Backfill completado: ${updated} actualizados, ${skipped} ya tenían slug, ${failed} fallidos.`)
  if (failed > 0) process.exit(1)
}

backfillTeamSlugs().catch((err) => {
  console.error('Error en backfill:', err)
  process.exit(1)
})
