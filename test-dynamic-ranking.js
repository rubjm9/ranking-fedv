/**
 * Script de prueba para verificar el sistema dinámico de ranking
 */

import dynamicRankingService from './src/services/dynamicRankingService'

const testDynamicRanking = async () => {
  console.log('🧪 Iniciando prueba del sistema dinámico de ranking...')
  
  try {
    // Probar obtención de historial
    console.log('\n📊 Probando getGlobalRankingHistory...')
    const history = await dynamicRankingService.getGlobalRankingHistory()
    console.log(`✅ Historial obtenido: ${history.length} puntos de datos`)
    
    if (history.length > 0) {
      console.log('📈 Primeros 3 puntos de datos:')
      history.slice(0, 3).forEach((point, index) => {
        console.log(`  ${index + 1}. ${point.season}: ${point.team_name} - Posición #${point.rank} (${point.points.toFixed(1)} pts)`)
      })
    }

    // Probar cálculo de ranking actual
    console.log('\n🏆 Probando calculateCurrentGlobalRanking...')
    const currentRanking = await dynamicRankingService.calculateCurrentGlobalRanking()
    console.log(`✅ Ranking actual calculado: ${currentRanking.length} equipos`)
    
    if (currentRanking.length > 0) {
      console.log('🥇 Top 5 equipos:')
      currentRanking.slice(0, 5).forEach((team, index) => {
        console.log(`  ${index + 1}. ${team.team_name} - ${team.total_points.toFixed(1)} pts`)
      })
    }

    console.log('\n🎉 Prueba completada exitosamente!')
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error)
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testDynamicRanking()
}

export default testDynamicRanking
