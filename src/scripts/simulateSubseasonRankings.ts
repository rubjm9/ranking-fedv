/**
 * Script para simular y almacenar rankings de todas las subtemporadas
 * Basado en los datos existentes de team_season_points
 */

import { supabase } from '../services/supabaseService'

// Formatear temporada (YYYY-YY)
const formatSeason = (year: number): string => {
  const nextYear = (year + 1).toString().slice(-2)
  return `${year}-${nextYear}`
}

// Obtener coeficiente de antigüedad por temporada
const getSeasonCoefficient = (season: string, referenceSeason: string): number => {
  const referenceYear = parseInt(referenceSeason.split('-')[0])
  const seasonYear = parseInt(season.split('-')[0])
  const yearsDiff = referenceYear - seasonYear
  
  switch (yearsDiff) {
    case 0: return 1.0  // Temporada de referencia
    case 1: return 0.8   // 1 año atrás
    case 2: return 0.5    // 2 años atrás
    case 3: return 0.2    // 3 años atrás
    default: return 0.0  // Más de 3 años
  }
}

// Mapear subtemporada a superficies
const subseasonCategories = {
  1: ['beach_mixed'],                    // Subtemporada 1: playa mixto
  2: ['beach_open', 'beach_women'],      // Subtemporada 2: playa open/women
  3: ['grass_mixed'],                    // Subtemporada 3: césped mixto
  4: ['grass_open', 'grass_women']       // Subtemporada 4: césped open/women
}

const simulateAllSubseasonRankings = async (): Promise<{ success: boolean; message: string; processed: number }> => {
  try {
    if (!supabase) {
      throw new Error('Supabase no está configurado')
    }

    console.log('🚀 Iniciando simulación de rankings por subtemporada...')

    // 1. Obtener todas las temporadas disponibles
    const { data: tournaments, error: tournamentsError } = await supabase
      .from('tournaments')
      .select('year')
      .not('year', 'is', null)
      .order('year', { ascending: false })

    if (tournamentsError) {
      throw tournamentsError
    }

    const uniqueYears = [...new Set(tournaments?.map((t: any) => t.year) || [])]
    const seasons = uniqueYears.map((year: number) => formatSeason(year))

    console.log(`📅 Temporadas encontradas: ${seasons.join(', ')}`)

    let totalProcessed = 0

    // 2. Procesar cada temporada
    for (const season of seasons) {
      console.log(`\n⏳ Procesando temporada ${season}...`)

      // 3. Para cada subtemporada (1-4)
      for (let subseason = 1; subseason <= 4; subseason++) {
        console.log(`  📊 Calculando subtemporada ${subseason}...`)

        const categories = subseasonCategories[subseason as keyof typeof subseasonCategories]
        
        // 4. Obtener datos de la temporada actual y las 3 anteriores
        const seasonYear = parseInt(season.split('-')[0])
        const seasonsToConsider = [
          season,
          formatSeason(seasonYear - 1),
          formatSeason(seasonYear - 2),
          formatSeason(seasonYear - 3)
        ]

        // 5. Obtener datos de team_season_points
        const { data: seasonData, error } = await supabase
          .from('team_season_points')
          .select(`
            team_id,
            season,
            ${categories.map(cat => `${cat}_points`).join(', ')}
          `)
          .in('season', seasonsToConsider)

        if (error) {
          console.error(`❌ Error obteniendo datos para subtemporada ${subseason}:`, error)
          continue
        }

        // 6. Calcular rankings para cada superficie
        const rankingsBySurface: { [surface: string]: { team_id: string; total_points: number; rank: number }[] } = {}

        for (const surface of categories) {
          console.log(`    🔄 Procesando superficie: ${surface}`)

          // Agrupar por equipo y calcular puntos totales con coeficientes
          const teamPointsMap: { [teamId: string]: number } = {}

          seasonData?.forEach((row: any) => {
            const teamId = row.team_id
            const season = row.season
            const basePoints = row[`${surface}_points`] || 0

            if (basePoints <= 0) return

            // Calcular coeficiente según la temporada
            const coefficient = getSeasonCoefficient(season, season)
            const weightedPoints = basePoints * coefficient

            if (!teamPointsMap[teamId]) {
              teamPointsMap[teamId] = 0
            }
            teamPointsMap[teamId] += weightedPoints
          })

          // Ordenar por puntos y asignar rankings
          const sortedTeams = Object.entries(teamPointsMap)
            .map(([teamId, totalPoints]) => ({ team_id: teamId, total_points: totalPoints, rank: 0 }))
            .sort((a, b) => b.total_points - a.total_points)

          // Asignar rankings
          sortedTeams.forEach((team, index) => {
            team.rank = index + 1
          })

          rankingsBySurface[surface] = sortedTeams
          console.log(`    ✅ ${sortedTeams.length} equipos rankeados en ${surface}`)
        }

        // 7. Actualizar team_season_points con los nuevos rankings
        const updates: any[] = []

        for (const surface of categories) {
          const rankings = rankingsBySurface[surface]
          
          for (const ranking of rankings) {
            const updateData: any = {
              team_id: ranking.team_id,
              season: season,
              [`subseason_${subseason}_${surface}_rank`]: ranking.rank,
              subseason_ranks_calculated_at: new Date().toISOString()
            }

            updates.push(updateData)
          }
        }

        if (updates.length > 0) {
          console.log(`    💾 Actualizando ${updates.length} registros...`)

          const { data: updatedData, error: updateError } = await supabase
            .from('team_season_points')
            .upsert(updates, {
              onConflict: 'team_id,season',
              ignoreDuplicates: false
            })
            .select()

          if (updateError) {
            console.error(`❌ Error actualizando rankings de subtemporada ${subseason}:`, updateError)
            continue
          }

          totalProcessed += updatedData?.length || 0
          console.log(`    ✅ Rankings de subtemporada ${subseason} calculados: ${updatedData?.length || 0} equipos`)
        }
      }

      // 8. Calcular ranking global final para esta temporada
      console.log(`  🌍 Calculando ranking global final...`)
      
      const seasonYear = parseInt(season.split('-')[0])
      const { data: globalSeasonData, error: globalError } = await supabase
        .from('team_season_points')
        .select(`
          team_id,
          season,
          beach_mixed_points,
          beach_open_points,
          beach_women_points,
          grass_mixed_points,
          grass_open_points,
          grass_women_points
        `)
        .in('season', [
          season,
          formatSeason(seasonYear - 1),
          formatSeason(seasonYear - 2),
          formatSeason(seasonYear - 3)
        ])

      if (!globalError && globalSeasonData) {
        // Calcular puntos globales por equipo con coeficientes
        const teamGlobalPoints: { [teamId: string]: number } = {}

        globalSeasonData.forEach((row: any) => {
          const teamId = row.team_id
          const season = row.season
          
          // Calcular coeficiente según la temporada
          const coefficient = getSeasonCoefficient(season, season)

          // Sumar todos los puntos de todas las categorías
          const totalPoints = (row.beach_mixed_points || 0) + 
                            (row.beach_open_points || 0) + 
                            (row.beach_women_points || 0) + 
                            (row.grass_mixed_points || 0) + 
                            (row.grass_open_points || 0) + 
                            (row.grass_women_points || 0)

          if (totalPoints <= 0) return

          const weightedPoints = totalPoints * coefficient

          if (!teamGlobalPoints[teamId]) {
            teamGlobalPoints[teamId] = 0
          }
          teamGlobalPoints[teamId] += weightedPoints
        })

        // Ordenar por puntos globales y asignar rankings
        const sortedGlobalTeams = Object.entries(teamGlobalPoints)
          .map(([teamId, totalPoints]) => ({ team_id: teamId, total_points: totalPoints, rank: 0 }))
          .sort((a, b) => b.total_points - a.total_points)

        // Asignar rankings
        sortedGlobalTeams.forEach((team, index) => {
          team.rank = index + 1
        })

        // Actualizar ranking global final
        const globalUpdates = sortedGlobalTeams.map(team => ({
          team_id: team.team_id,
          season: season,
          final_season_global_rank: team.rank,
          subseason_ranks_calculated_at: new Date().toISOString()
        }))

        const { error: globalUpdateError } = await supabase
          .from('team_season_points')
          .upsert(globalUpdates, {
            onConflict: 'team_id,season',
            ignoreDuplicates: false
          })

        if (!globalUpdateError) {
          console.log(`  ✅ Ranking global final calculado: ${sortedGlobalTeams.length} equipos`)
        }
      }
    }

    console.log(`\n🎉 Simulación completada exitosamente`)
    console.log(`📊 Total de registros procesados: ${totalProcessed}`)

    return {
      success: true,
      message: `Simulación completada: ${totalProcessed} registros procesados`,
      processed: totalProcessed
    }

  } catch (error: any) {
    console.error('❌ Error en simulación de rankings:', error)
    return {
      success: false,
      message: error.message || 'Error desconocido',
      processed: 0
    }
  }
}

export default simulateAllSubseasonRankings
