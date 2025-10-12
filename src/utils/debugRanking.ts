/**
 * Script de debug para verificar el estado del ranking
 */

import { supabase } from '../services/supabaseService'
import rankingService from '../services/rankingService'

export const debugRanking = async () => {
  try {
    console.log('🔍 Debug del sistema de ranking...')

    // 1. Verificar datos actuales en current_rankings
    console.log('\n📊 Verificando datos actuales en current_rankings:')
    const { data: currentData, error: currentError } = await supabase
      .from('current_rankings')
      .select('*')
      .limit(3)

    if (currentError) {
      console.error('❌ Error al obtener datos actuales:', currentError)
    } else {
      console.log('✅ Datos actuales:', currentData)
    }

    // 2. Verificar posiciones por temporada
    console.log('\n📊 Verificando posiciones por temporada:')
    const { data: positionsData, error: positionsError } = await supabase
      .from('positions')
      .select(`
        *,
        tournaments:tournamentId(
          id,
          name,
          year,
          surface,
          modality
        ),
        teams:teamId(
          id,
          name
        )
      `)
      .limit(5)

    if (positionsError) {
      console.error('❌ Error al obtener posiciones:', positionsError)
    } else {
      console.log('✅ Posiciones encontradas:', positionsData)
    }

    // 3. Recalcular ranking
    console.log('\n🔄 Recalculando ranking...')
    const recalcResult = await rankingService.recalculateRankingAlternative()
    console.log('✅ Resultado del recálculo:', recalcResult)

    // 4. Verificar datos después del recálculo
    console.log('\n📊 Verificando datos después del recálculo:')
    const { data: newData, error: newError } = await supabase
      .from('current_rankings')
      .select('*')
      .limit(3)

    if (newError) {
      console.error('❌ Error al obtener datos nuevos:', newError)
    } else {
      console.log('✅ Datos nuevos:', newData)
    }

    return {
      success: true,
      currentData,
      positionsData,
      recalcResult,
      newData
    }

  } catch (error) {
    console.error('❌ Error en debug:', error)
    return { success: false, error: error.message }
  }
}

// Función para formatear temporada
const formatSeason = (year: number): string => {
  const nextYear = (year + 1).toString().slice(-2)
  return `${year}-${nextYear}`
}

// Función para obtener coeficiente de antigüedad
const getSeasonCoefficient = (season: string, currentSeason: string): number => {
  const currentYear = parseInt(currentSeason.split('-')[0])
  const seasonYear = parseInt(season.split('-')[0])
  const yearsDiff = currentYear - seasonYear
  
  switch (yearsDiff) {
    case 0: return 1.0  // Temporada actual
    case 1: return 0.8   // 1 año atrás
    case 2: return 0.5    // 2 años atrás
    case 3: return 0.2    // 3 años atrás
    default: return 0.0  // Más de 3 años
  }
}

export const testSeasonCalculation = async () => {
  try {
    console.log('🧪 Probando cálculo de temporadas...')

    // Obtener posiciones
    const { data: positions, error } = await supabase
      .from('positions')
      .select(`
        *,
        tournaments:tournamentId(
          id,
          name,
          year,
          surface,
          modality
        ),
        teams:teamId(
          id,
          name
        )
      `)

    if (error) {
      console.error('❌ Error al obtener posiciones:', error)
      return { success: false, error: error.message }
    }

    console.log('📊 Posiciones obtenidas:', positions?.length || 0)

    // Agrupar por equipo, categoría y temporada
    const teamPoints: { [key: string]: { [key: string]: { [key: string]: number } } } = {}

    positions?.forEach(position => {
      const tournament = position.tournaments
      const team = position.teams

      if (!tournament || !team) return

      const category = `${tournament.surface.toLowerCase()}_${tournament.modality.toLowerCase()}`
      const teamKey = team.id
      const season = formatSeason(tournament.year)

      if (!teamPoints[teamKey]) {
        teamPoints[teamKey] = {}
      }

      if (!teamPoints[teamKey][category]) {
        teamPoints[teamKey][category] = {}
      }

      if (!teamPoints[teamKey][category][season]) {
        teamPoints[teamKey][category][season] = 0
      }

      teamPoints[teamKey][category][season] += position.points || 0
    })

    console.log('📈 Puntos agrupados:', teamPoints)

    // Calcular puntos por temporada para un equipo específico
    const currentSeason = formatSeason(new Date().getFullYear())
    
    Object.keys(teamPoints).slice(0, 2).forEach(teamId => {
      Object.keys(teamPoints[teamId]).forEach(category => {
        const seasonPoints = teamPoints[teamId][category]
        
        console.log(`\n🏆 Equipo ${teamId}, Categoría ${category}:`)
        
        let totalPoints = 0
        Object.keys(seasonPoints).forEach(season => {
          const basePoints = seasonPoints[season]
          const coefficient = getSeasonCoefficient(season, currentSeason)
          const weightedPoints = basePoints * coefficient
          
          console.log(`  ${season}: ${basePoints} puntos base × ${coefficient} = ${weightedPoints} puntos ponderados`)
          totalPoints += weightedPoints
        })
        
        console.log(`  Total: ${totalPoints} puntos`)
      })
    })

    return { success: true, teamPoints }

  } catch (error) {
    console.error('❌ Error en prueba de cálculo:', error)
    return { success: false, error: error.message }
  }
}

