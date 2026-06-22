/**
 * Backfill de coeficientes regionales para todas las temporadas con torneos.
 * Ejecutar tras aplicar migraciones 015 y 017:
 *   npm run backfill-regional-coefficients
 *
 * Requiere .env.local con VITE_SUPABASE_URL y:
 * - SUPABASE_SERVICE_ROLE_KEY (recomendado; la anon key no puede escribir por RLS)
 */

import { createClient } from '@supabase/supabase-js'
import seasonService from '../services/seasonService'

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
  console.warn('   Añade SUPABASE_SERVICE_ROLE_KEY a .env.local.')
}

// El script usa el cliente global de seasonService (anon). Sustituimos el módulo
// inyectando el cliente con service role cuando esté disponible.
const supabase = createClient(url, key)

const backfillRegionalCoefficients = async () => {
  console.log('Iniciando backfill de coeficientes regionales...')

  const { data: rows, error } = await supabase
    .from('tournaments')
    .select('year')
    .not('year', 'is', null)
    .order('year', { ascending: true })

  if (error) {
    console.error('Error obteniendo temporadas:', error)
    process.exit(1)
  }

  const years = [...new Set((rows || []).map((r: { year: number }) => r.year))]
  const seasons = years.map(y => `${y}-${String(y + 1).slice(-2)}`)
  console.log(`Temporadas: ${seasons.join(', ')}`)

  let totalSaved = 0
  let totalFailed = 0

  for (const season of seasons) {
    const coefficients = await seasonService.calculateRegionalCoefficients(season)
    if (coefficients.length === 0) {
      console.log(`  ${season}: sin datos`)
      continue
    }

    const payload = coefficients.map(c => ({
      id: c.id,
      regionId: c.regionId,
      season: c.season,
      modality: c.modality,
      coefficient: c.coefficient,
      isManualOverride: false,
      calculatedValue: c.calculatedValue,
      appliedAt: c.appliedAt,
    }))

    const { error: upsertError } = await supabase
      .from('regional_coefficients')
      .upsert(payload)

    if (upsertError) {
      console.error(`  ${season}: error —`, upsertError.message)
      totalFailed += coefficients.length
    } else {
      console.log(`  ${season}: ${coefficients.length} coeficientes guardados`)
      totalSaved += coefficients.length
    }
  }

  console.log(`\nCompletado: ${totalSaved} guardados, ${totalFailed} fallidos`)
  if (totalSaved === 0) process.exit(1)
}

backfillRegionalCoefficients()
