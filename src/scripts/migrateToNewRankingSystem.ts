/**
 * Script de migración al nuevo sistema de rankings
 * Migra datos de current_rankings a team_season_rankings
 * Recalcula todos los rankings históricos desde team_season_points
 */

import teamSeasonRankingsService from '../services/teamSeasonRankingsService'
import { supabase } from '../services/supabaseService'

interface MigrationReport {
  totalSeasons: number
  successfulSeasons: number
  failedSeasons: string[]
  totalTeamsUpdated: number
  startTime: string
  endTime: string
  duration: string
}

const migrateToNewRankingSystem = async (): Promise<MigrationReport> => {
  const startTime = new Date()
  console.log('🚀 Iniciando migración al nuevo sistema de rankings...')
  console.log(`⏰ Hora de inicio: ${startTime.toLocaleString('es-ES')}`)
  console.log('=' .repeat(60))

  const report: MigrationReport = {
    totalSeasons: 0,
    successfulSeasons: 0,
    failedSeasons: [],
    totalTeamsUpdated: 0,
    startTime: startTime.toISOString(),
    endTime: '',
    duration: ''
  }

  try {
    if (!supabase) {
      throw new Error('Supabase no está configurado')
    }

    // Paso 1: Obtener todas las temporadas disponibles
    console.log('\n📅 Paso 1: Obteniendo temporadas disponibles...')
    const { data: seasonData, error: seasonError } = await supabase
      .from('team_season_points')
      .select('season')
      .order('season', { ascending: false })

    if (seasonError) {
      console.error('❌ Error obteniendo temporadas:', seasonError)
      throw seasonError
    }

    const uniqueSeasons = [...new Set((seasonData || []).map((s: any) => s.season))]
    report.totalSeasons = uniqueSeasons.length

    console.log(`✅ Encontradas ${uniqueSeasons.length} temporadas:`)
    uniqueSeasons.forEach((season, index) => {
      console.log(`   ${index + 1}. ${season}`)
    })

    // Paso 2: Verificar estado de team_season_rankings
    console.log('\n🔍 Paso 2: Verificando estado de team_season_rankings...')
    const { count: existingCount, error: countError } = await supabase
      .from('team_season_rankings')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('❌ Error verificando tabla:', countError)
      throw countError
    }

    console.log(`📊 Registros existentes en team_season_rankings: ${existingCount || 0}`)

    if (existingCount && existingCount > 0) {
      console.log('⚠️  La tabla ya contiene datos. Se sobrescribirán los registros existentes.')
    }

    // Paso 3: Migrar cada temporada
    console.log('\n⚙️  Paso 3: Calculando rankings para cada temporada...')
    console.log('=' .repeat(60))

    for (let i = 0; i < uniqueSeasons.length; i++) {
      const season = uniqueSeasons[i]
      const progress = `[${i + 1}/${uniqueSeasons.length}]`

      console.log(`\n${progress} Procesando temporada ${season}...`)

      try {
        const result = await teamSeasonRankingsService.calculateSeasonRankings(season)

        if (result.success) {
          report.successfulSeasons++
          report.totalTeamsUpdated += result.updated
          console.log(`✅ ${progress} ${season}: ${result.updated} equipos actualizados`)
        } else {
          report.failedSeasons.push(`${season}: ${result.message}`)
          console.error(`❌ ${progress} ${season}: ${result.message}`)
        }

        // Pequeña pausa para no sobrecargar la base de datos
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error: any) {
        report.failedSeasons.push(`${season}: ${error.message}`)
        console.error(`❌ ${progress} Error en ${season}:`, error.message)
      }
    }

    // Paso 4: Validación post-migración
    console.log('\n' + '='.repeat(60))
    console.log('✅ Paso 4: Validación post-migración...')

    const { count: finalCount, error: finalCountError } = await supabase
      .from('team_season_rankings')
      .select('*', { count: 'exact', head: true })

    if (!finalCountError) {
      console.log(`📊 Total de registros en team_season_rankings: ${finalCount}`)
    }

    // Paso 5: Comparar con current_rankings (si existe)
    console.log('\n🔍 Paso 5: Comparando con current_rankings...')
    
    const { count: currentRankingsCount, error: crCountError } = await supabase
      .from('current_rankings')
      .select('*', { count: 'exact', head: true })

    if (!crCountError) {
      console.log(`📊 Registros en current_rankings: ${currentRankingsCount}`)
      
      if (currentRankingsCount && currentRankingsCount > 0) {
        console.log('ℹ️  La tabla current_rankings aún contiene datos.')
        console.log('ℹ️  Puedes eliminarla después de validar que todo funciona correctamente.')
        console.log('ℹ️  Ejecuta la migración 010_drop_current_rankings.sql cuando estés listo.')
      }
    }

  } catch (error: any) {
    console.error('\n❌ Error fatal durante la migración:', error.message)
    throw error
  } finally {
    const endTime = new Date()
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000)
    
    report.endTime = endTime.toISOString()
    report.duration = `${Math.floor(duration / 60)}m ${duration % 60}s`

    // Reporte final
    console.log('\n' + '='.repeat(60))
    console.log('📊 REPORTE DE MIGRACIÓN')
    console.log('='.repeat(60))
    console.log(`⏰ Hora de inicio:     ${new Date(report.startTime).toLocaleString('es-ES')}`)
    console.log(`⏰ Hora de fin:        ${new Date(report.endTime).toLocaleString('es-ES')}`)
    console.log(`⏱️  Duración:           ${report.duration}`)
    console.log(`📅 Total temporadas:   ${report.totalSeasons}`)
    console.log(`✅ Exitosas:           ${report.successfulSeasons}`)
    console.log(`❌ Fallidas:           ${report.failedSeasons.length}`)
    console.log(`👥 Equipos actualizados: ${report.totalTeamsUpdated}`)
    
    if (report.failedSeasons.length > 0) {
      console.log('\n❌ Temporadas fallidas:')
      report.failedSeasons.forEach(season => {
        console.log(`   - ${season}`)
      })
    }

    console.log('='.repeat(60))

    if (report.successfulSeasons === report.totalSeasons) {
      console.log('🎉 ¡Migración completada exitosamente!')
      console.log('\n📝 Próximos pasos:')
      console.log('   1. Valida que los rankings se muestran correctamente en la web')
      console.log('   2. Compara algunos rankings con los de current_rankings')
      console.log('   3. Ejecuta la migración 008 para limpiar team_season_points')
      console.log('   4. Ejecuta la migración 009 para preparar coeficientes regionales')
      console.log('   5. Después de validar (1 semana), ejecuta migración 010 para eliminar current_rankings')
    } else {
      console.log('⚠️  La migración se completó con errores.')
      console.log('   Revisa las temporadas fallidas y vuelve a ejecutar si es necesario.')
    }
  }

  return report
}

export default migrateToNewRankingSystem

