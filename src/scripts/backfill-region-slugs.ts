/**
 * Backfill de slugs para regiones existentes.
 * Ejecutar tras aplicar la migración 018_add_region_slug.sql:
 *   npm run backfill-region-slugs
 *
 * Requiere .env.local con VITE_SUPABASE_URL y una de:
 * - SUPABASE_SERVICE_ROLE_KEY (recomendado; la anon key no puede escribir por RLS)
 * - VITE_SUPABASE_ANON_KEY (solo si las políticas RLS permiten UPDATE)
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
}

const supabase = createClient(url, key)

const backfillRegionSlugs = async () => {
  console.log('Iniciando backfill de slugs de regiones...')

  const { data: regions, error } = await supabase
    .from('regions')
    .select('id, name, slug, createdAt')
    .order('createdAt', { ascending: true })

  if (error) throw error
  if (!regions?.length) {
    console.log('No hay regiones para procesar.')
    return
  }

  const usedSlugs = new Set<string>(
    regions.filter((r) => r.slug).map((r) => r.slug as string)
  )
  let updated = 0
  let skipped = 0
  let failed = 0

  for (const region of regions) {
    if (region.slug) {
      skipped++
      continue
    }

    const slug = generateUniqueSlug(region.name, usedSlugs)
    usedSlugs.add(slug)

    const { data: updatedRows, error: updateError } = await supabase
      .from('regions')
      .update({ slug })
      .eq('id', region.id)
      .select('id')

    if (updateError) {
      console.error(`Error actualizando "${region.name}":`, updateError.message)
      failed++
      continue
    }

    if (!updatedRows?.length) {
      console.error(`Sin permisos para actualizar "${region.name}" (RLS). Usa service role.`)
      failed++
      continue
    }

    console.log(`  ${region.name} -> ${slug}`)
    updated++
  }

  console.log(`Backfill completado: ${updated} actualizados, ${skipped} ya tenían slug, ${failed} fallidos.`)
  if (failed > 0) process.exit(1)
}

backfillRegionSlugs().catch((err) => {
  console.error('Error en backfill:', err)
  process.exit(1)
})
