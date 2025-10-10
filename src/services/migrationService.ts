/**
 * Script de migración para actualizar la tabla current_rankings
 * con las nuevas columnas del sistema de rankings completo
 */

import { supabase } from './supabaseService'

const migrationService = {
  /**
   * Verificar estructura actual de la tabla current_rankings
   */
  checkCurrentStructure: async () => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log('🔍 Verificando estructura actual de current_rankings...')

      // Intentar obtener una muestra de datos para ver qué columnas existen
      const { data, error } = await supabase
        .from('current_rankings')
        .select('*')
        .limit(1)

      if (error) {
        console.error('❌ Error al acceder a la tabla:', error)
        return { success: false, error: error.message }
      }

      console.log('📊 Estructura actual:', data)
      
      if (data && data.length > 0) {
        const columns = Object.keys(data[0])
        console.log('📋 Columnas existentes:', columns)
        return { success: true, columns }
      } else {
        console.log('📋 Tabla vacía, verificando estructura...')
        return { success: true, columns: [] }
      }

    } catch (error) {
      console.error('Error al verificar estructura:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Crear tabla current_rankings con la estructura completa
   */
  createTableWithFullStructure: async () => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log('🏗️ Creando tabla current_rankings con estructura completa...')

      // SQL para crear la tabla con todas las columnas necesarias
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS current_rankings (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          team_id TEXT NOT NULL,
          team_name TEXT NOT NULL,
          ranking_category TEXT NOT NULL,
          current_season_points INTEGER DEFAULT 0,
          previous_season_points INTEGER DEFAULT 0,
          two_seasons_ago_points INTEGER DEFAULT 0,
          three_seasons_ago_points INTEGER DEFAULT 0,
          total_points INTEGER NOT NULL,
          ranking_position INTEGER NOT NULL,
          last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          regional_coefficient DECIMAL(5,3) DEFAULT 1.000,
          breakdown JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `

      // Crear índices para mejor rendimiento
      const createIndexesSQL = [
        'CREATE INDEX IF NOT EXISTS idx_current_rankings_category ON current_rankings(ranking_category);',
        'CREATE INDEX IF NOT EXISTS idx_current_rankings_position ON current_rankings(ranking_category, ranking_position);',
        'CREATE INDEX IF NOT EXISTS idx_current_rankings_team ON current_rankings(team_id);',
        'CREATE INDEX IF NOT EXISTS idx_current_rankings_points ON current_rankings(ranking_category, total_points DESC);'
      ]

      console.log('📝 Ejecutando SQL de creación...')
      
      // Nota: En Supabase, normalmente usarías la interfaz web para ejecutar SQL
      // Este es un ejemplo de lo que necesitas ejecutar en el SQL Editor
      
      return {
        success: true,
        message: 'Estructura de tabla definida',
        sql: {
          createTable: createTableSQL,
          indexes: createIndexesSQL
        }
      }

    } catch (error) {
      console.error('Error al crear tabla:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Alternativa: Insertar datos sin las columnas faltantes
   */
  insertDataWithoutNewColumns: async () => {
    try {
      if (!supabase) {
        throw new Error('Supabase no está configurado')
      }

      console.log('🔄 Insertando datos sin columnas nuevas...')

      // Obtener datos reales
      const { data: positions, error: positionsError } = await supabase
        .from('positions')
        .select(`
          *,
          tournaments:tournamentId(
            id,
            name,
            type,
            year,
            surface,
            modality
          ),
          teams:teamId(
            id,
            name,
            regionId
          )
        `)
        // Sin limit para obtener todas las posiciones

      if (positionsError) {
        console.error('Error al obtener posiciones:', positionsError)
        return { success: false, error: positionsError.message }
      }

      if (!positions || positions.length === 0) {
        return { success: false, error: 'No hay posiciones para procesar' }
      }

      // Procesar datos
      const teamPoints: { [key: string]: { [key: string]: { [key: number]: number } } } = {}

      positions.forEach(position => {
        const tournament = position.tournaments
        const team = position.teams
        
        if (!tournament || !team || !tournament.surface || !tournament.modality || !tournament.year) {
          return
        }

        const category = `${tournament.surface.toLowerCase()}_${tournament.modality.toLowerCase()}`
        const teamKey = team.id
        const yearKey = tournament.year

        if (!teamPoints[teamKey]) {
          teamPoints[teamKey] = {}
        }
        if (!teamPoints[teamKey][category]) {
          teamPoints[teamKey][category] = {}
        }
        if (!teamPoints[teamKey][category][yearKey]) {
          teamPoints[teamKey][category][yearKey] = 0
        }

        teamPoints[teamKey][category][yearKey] += position.points || 0
      })

      // Crear datos de ranking SIN las columnas nuevas
      const rankingEntries = []
      const categories = new Set()
      
      Object.values(teamPoints).forEach(teamData => {
        Object.keys(teamData).forEach(category => {
          categories.add(category)
        })
      })

      Array.from(categories).forEach(category => {
        const categoryTeams = []
        
        Object.keys(teamPoints).forEach(teamId => {
          const teamCategoryPoints = teamPoints[teamId][category]
          
          if (!teamCategoryPoints || Object.keys(teamCategoryPoints).length === 0) {
            return
          }

          let totalPoints = 0
          Object.values(teamCategoryPoints).forEach(yearPoints => {
            totalPoints += yearPoints as number
          })

          if (totalPoints > 0) {
            categoryTeams.push({
              teamId,
              category,
              totalPoints
            })
          }
        })

        // Ordenar y asignar posiciones
        categoryTeams.sort((a, b) => b.totalPoints - a.totalPoints)
        
        categoryTeams.forEach((team, index) => {
          rankingEntries.push({
            team_id: team.teamId,
            ranking_category: category,
            current_season_points: team.totalPoints,
            previous_season_points: 0,
            two_seasons_ago_points: 0,
            three_seasons_ago_points: 0,
            total_points: team.totalPoints,
            ranking_position: index + 1,
            last_calculated: new Date().toISOString()
            // Sin team_name, regional_coefficient ni breakdown
          })
        })
      })

      console.log(`📊 Datos preparados: ${rankingEntries.length} entradas`)

      // Limpiar tabla
      await supabase
        .from('current_rankings')
        .delete()
        .not('id', 'is', null)

      // Insertar datos
      const { data: insertedData, error: insertError } = await supabase
        .from('current_rankings')
        .insert(rankingEntries)
        .select()

      if (insertError) {
        console.error('❌ Error al insertar:', insertError)
        return { success: false, error: insertError.message }
      }

      console.log('✅ Datos insertados exitosamente')

      return {
        success: true,
        message: 'Datos insertados sin columnas nuevas',
        insertedCount: insertedData?.length || 0,
        categories: Array.from(categories)
      }

    } catch (error) {
      console.error('Error en inserción sin columnas nuevas:', error)
      return { success: false, error: error.message }
    }
  }
}

export default migrationService
