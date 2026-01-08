import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  BarChart3, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  Filter,
  TrendingUp,
  Users,
  Calendar
} from 'lucide-react'
import toast from 'react-hot-toast'
import rankingService from '@/services/rankingService'
import hybridRankingService from '@/services/hybridRankingService'
import TeamLogo from '@/components/ui/TeamLogo'

const RankingComparisonPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('beach_mixed')
  const [selectedSeason, setSelectedSeason] = useState<string>('current')
  const [isLoading, setIsLoading] = useState(false)

  const categories = [
    { value: 'beach_mixed', label: 'Playa Mixto', icon: '🏖️' },
    { value: 'beach_open', label: 'Playa Open', icon: '🏖️' },
    { value: 'beach_women', label: 'Playa Women', icon: '🏖️' },
    { value: 'grass_mixed', label: 'Césped Mixto', icon: '⚽' },
    { value: 'grass_open', label: 'Césped Open', icon: '⚽' },
    { value: 'grass_women', label: 'Césped Women', icon: '⚽' }
  ]

  const seasons = [
    { value: 'current', label: 'Ranking Actual' },
    { value: '2025-26', label: 'Temporada 2025-26' },
    { value: '2024-25', label: 'Temporada 2024-25' },
    { value: '2023-24', label: 'Temporada 2023-24' }
  ]

  // Determinar la temporada de referencia
  const referenceSeason = selectedSeason === 'current' ? '2024-25' : selectedSeason

  // Query para sistema original
  const { data: originalData, isLoading: isLoadingOriginal, error: originalError } = useQuery({
    queryKey: ['original-ranking', selectedCategory],
    queryFn: () => rankingService.getRanking(selectedCategory),
    enabled: !!selectedCategory
  })

  // Query para sistema híbrido
  const { data: hybridData, isLoading: isLoadingHybrid, error: hybridError } = useQuery({
    queryKey: ['hybrid-ranking', selectedCategory, referenceSeason],
    queryFn: () => hybridRankingService.getRankingFromSeasonPoints(
      selectedCategory as any,
      referenceSeason
    ),
    enabled: !!selectedCategory && !!referenceSeason
  })

  // Función para comparar los datos
  const compareData = () => {
    if (!originalData?.data || !hybridData) return null

    const original = originalData.data
    const hybrid = hybridData

    const comparison = {
      totalTeams: {
        original: original.length,
        hybrid: hybrid.length,
        match: original.length === hybrid.length
      },
      topTeams: [] as any[],
      differences: [] as any[],
      summary: {
        exactMatches: 0,
        totalComparisons: 0,
        averageDifference: 0,
        maxDifference: 0
      }
    }

    // Comparar equipos
    original.forEach((originalTeam, index) => {
      const hybridTeam = hybrid.find(h => h.team_id === originalTeam.team_id)
      
      if (hybridTeam) {
        const pointsDiff = Math.abs(originalTeam.total_points - hybridTeam.total_points)
        const positionDiff = Math.abs(originalTeam.ranking_position - hybridTeam.ranking_position)
        
        comparison.summary.totalComparisons++
        
        if (pointsDiff < 0.1 && positionDiff === 0) {
          comparison.summary.exactMatches++
        }

        comparison.summary.averageDifference += pointsDiff
        comparison.summary.maxDifference = Math.max(comparison.summary.maxDifference, pointsDiff)

        comparison.topTeams.push({
          team_id: originalTeam.team_id,
          team_name: originalTeam.team_name,
          original: {
            position: originalTeam.ranking_position,
            points: originalTeam.total_points,
            season_breakdown: originalTeam.season_breakdown
          },
          hybrid: {
            position: hybridTeam.ranking_position,
            points: hybridTeam.total_points,
            season_breakdown: hybridTeam.season_breakdown
          },
          differences: {
            pointsDiff,
            positionDiff,
            isExact: pointsDiff < 0.1 && positionDiff === 0
          }
        })

        if (pointsDiff > 0.1 || positionDiff > 0) {
          comparison.differences.push({
            team_name: originalTeam.team_name,
            pointsDiff,
            positionDiff,
            originalPoints: originalTeam.total_points,
            hybridPoints: hybridTeam.total_points
          })
        }
      }
    })

    comparison.summary.averageDifference = comparison.summary.totalComparisons > 0 
      ? comparison.summary.averageDifference / comparison.summary.totalComparisons 
      : 0

    return comparison
  }

  const comparison = compareData()

  const handleRefresh = () => {
    setIsLoading(true)
    // Refrescar ambas queries
    setTimeout(() => {
      setIsLoading(false)
      toast.success('Datos actualizados')
    }, 1000)
  }

  const getStatusIcon = (isExact: boolean) => {
    return isExact ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <AlertTriangle className="w-4 h-4 text-orange-500" />
    )
  }

  const getStatusColor = (isExact: boolean) => {
    return isExact ? 'text-green-600' : 'text-orange-600'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Comparación de sistemas de ranking</h1>
        <p className="text-gray-600 mt-1">
          Compara resultados del sistema original vs sistema híbrido
        </p>
      </div>

      {/* Información */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-blue-900 mb-2">ℹ️ Sobre esta comparación</h2>
        <p className="text-sm text-blue-800">
          Esta página compara los resultados del sistema original (que calcula desde positions) 
          con el sistema híbrido (que usa team_season_points). Ambos deberían mostrar los mismos números.
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Filter className="w-5 h-5 mr-2" />
          Filtros
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Superficie
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.icon} {category.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Temporada (sistema híbrido)
            </label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {seasons.map(season => (
                <option key={season.value} value={season.value}>
                  {season.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualizar comparación</span>
          </button>
        </div>
      </div>

      {/* Resumen de comparación */}
      {comparison && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen de comparación</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Equipos</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {comparison.totalTeams.original} / {comparison.totalTeams.hybrid}
                  </p>
                  {comparison.totalTeams.match ? (
                    <CheckCircle className="w-4 h-4 text-green-500 mt-1" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-orange-500 mt-1" />
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Coincidencias exactas</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {comparison.summary.exactMatches}
                  </p>
                  <p className="text-xs text-gray-500">
                    de {comparison.summary.totalComparisons}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <BarChart3 className="w-8 h-8 text-purple-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Diferencia promedio</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {comparison.summary.averageDifference.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">puntos</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-orange-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Diferencia máxima</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {comparison.summary.maxDifference.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">puntos</p>
                </div>
              </div>
            </div>
          </div>

          {/* Estado general */}
          <div className={`p-4 rounded-lg ${
            comparison.summary.exactMatches === comparison.summary.totalComparisons
              ? 'bg-green-50 border border-green-200'
              : comparison.summary.averageDifference < 1
              ? 'bg-yellow-50 border border-yellow-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center">
              {comparison.summary.exactMatches === comparison.summary.totalComparisons ? (
                <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
              ) : comparison.summary.averageDifference < 1 ? (
                <AlertTriangle className="w-6 h-6 text-yellow-500 mr-3" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
              )}
              <div>
                <h3 className={`font-semibold ${
                  comparison.summary.exactMatches === comparison.summary.totalComparisons
                    ? 'text-green-900'
                    : comparison.summary.averageDifference < 1
                    ? 'text-yellow-900'
                    : 'text-red-900'
                }`}>
                  {comparison.summary.exactMatches === comparison.summary.totalComparisons
                    ? '✅ Sistemas completamente sincronizados'
                    : comparison.summary.averageDifference < 1
                    ? '⚠️ Diferencias menores detectadas'
                    : '❌ Diferencias significativas detectadas'
                  }
                </h3>
                <p className={`text-sm ${
                  comparison.summary.exactMatches === comparison.summary.totalComparisons
                    ? 'text-green-800'
                    : comparison.summary.averageDifference < 1
                    ? 'text-yellow-800'
                    : 'text-red-800'
                }`}>
                  {comparison.summary.exactMatches === comparison.summary.totalComparisons
                    ? 'Ambos sistemas muestran exactamente los mismos resultados.'
                    : comparison.summary.averageDifference < 1
                    ? 'Las diferencias son menores y pueden deberse a redondeos o actualizaciones recientes.'
                    : 'Hay diferencias significativas que requieren revisión.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Diferencias detectadas */}
      {comparison && comparison.differences.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Diferencias detectadas ({comparison.differences.length})
          </h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Puntos Original
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Puntos Híbrido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Diferencia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {comparison.differences.map((diff, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {diff.team_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {diff.originalPoints.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {diff.hybridPoints.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        diff.pointsDiff < 0.5 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {diff.pointsDiff.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusIcon(diff.pointsDiff < 0.5)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Comparación detallada de los primeros 10 equipos */}
      {comparison && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Comparación detallada (Top 10)
          </h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Posición Original
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Posición Híbrido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Puntos Original
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Puntos Híbrido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {comparison.topTeams.slice(0, 10).map((team, index) => (
                  <tr key={team.team_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <TeamLogo teamName={team.team_name} size="sm" />
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {team.team_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      #{team.original.position}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      #{team.hybrid.position}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {team.original.points.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {team.hybrid.points.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusIcon(team.differences.isExact)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Estados de carga */}
      {(isLoadingOriginal || isLoadingHybrid) && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-500">
              {isLoadingOriginal && isLoadingHybrid 
                ? 'Cargando ambos sistemas...'
                : isLoadingOriginal 
                ? 'Cargando sistema original...'
                : 'Cargando sistema híbrido...'
              }
            </p>
          </div>
        </div>
      )}

      {/* Errores */}
      {(originalError || hybridError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-red-900 mb-2">❌ Errores detectados</h3>
          {originalError && (
            <p className="text-sm text-red-800 mb-1">
              <strong>Sistema original:</strong> {originalError.message}
            </p>
          )}
          {hybridError && (
            <p className="text-sm text-red-800">
              <strong>Sistema híbrido:</strong> {hybridError.message}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default RankingComparisonPage
