import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { 
  Trophy, 
  Medal, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  Filter
} from 'lucide-react'
import toast from 'react-hot-toast'
import hybridRankingService from '@/services/hybridRankingService'
import RankingTableSkeleton from '@/components/ui/RankingTableSkeleton'
import seasonPointsService from '@/services/seasonPointsService'
import TeamLogo from '@/components/ui/TeamLogo'

const RankingAdminPageHybrid: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('beach_mixed')
  const [selectedSeason, setSelectedSeason] = useState<string>('current')
  const [isLoading, setIsLoading] = useState(false)
  const queryClient = useQueryClient()

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
    { value: '2023-24', label: 'Temporada 2023-24' },
    { value: '2022-23', label: 'Temporada 2022-23' }
  ]

  // Determinar la temporada de referencia
  const referenceSeason = selectedSeason === 'current' ? '2024-25' : selectedSeason

  // Query optimizada usando el sistema híbrido
  const { data: rankingData, isLoading: isLoadingRanking, error, refetch } = useQuery({
    queryKey: ['hybrid-admin-ranking', selectedCategory, referenceSeason],
    queryFn: () => hybridRankingService.getRankingFromSeasonPoints(
      selectedCategory as any,
      referenceSeason
    ),
    staleTime: 2 * 60 * 1000, // 2 minutos
    enabled: !!selectedCategory && !!referenceSeason
  })

  // Mutación para sincronizar rankings
  const syncRankingsMutation = useMutation({
    mutationFn: () => hybridRankingService.syncWithCurrentRankings(
      selectedCategory as any,
      referenceSeason
    ),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message)
        queryClient.invalidateQueries({ queryKey: ['hybrid-admin-ranking'] })
      } else {
        toast.error(result.message)
      }
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`)
    }
  })

  // Mutación para regenerar temporada
  const regenerateSeasonMutation = useMutation({
    mutationFn: () => seasonPointsService.calculateAndSaveSeasonPoints(referenceSeason),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message)
        queryClient.invalidateQueries({ queryKey: ['hybrid-admin-ranking'] })
      } else {
        toast.error(result.message)
      }
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`)
    }
  })

  const handleSyncRankings = () => {
    syncRankingsMutation.mutate()
  }

  const handleRegenerateSeason = () => {
    if (confirm(`¿Regenerar temporada ${referenceSeason} desde datos brutos?`)) {
      regenerateSeasonMutation.mutate()
    }
  }

  const handleRefresh = () => {
    refetch()
  }

  const getRankIcon = (position: number) => {
    if (position === 1) return <Trophy className="w-6 h-6 text-yellow-500" />
    if (position === 2) return <Medal className="w-6 h-6 text-gray-400" />
    if (position === 3) return <Medal className="w-6 h-6 text-orange-500" />
    return <span className="text-sm font-semibold text-gray-500">#{position}</span>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ranking Actual</h1>
          <p className="text-gray-600 mt-1">
            Sistema híbrido optimizado - Datos desde team_season_points
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/admin/ranking-update"
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Actualizar Rankings</span>
          </Link>
        </div>
      </div>

      {/* Información del sistema */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-green-900 mb-2">✅ Sistema híbrido activo</h2>
        <p className="text-sm text-green-800">
          Esta página usa el sistema optimizado que combina datos brutos con cache materializada 
          para consultas instantáneas y análisis históricos.
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
              Temporada
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
      </div>

      {/* Ranking */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Ranking Actual – {categories.find(c => c.value === selectedCategory)?.label}
            </h2>
            <div className="text-sm text-gray-500">
              Actualizado: {new Date().toLocaleDateString('es-ES')}
            </div>
          </div>
        </div>

        {isLoadingRanking ? (
          <RankingTableSkeleton rows={10} />
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p>Error al cargar el ranking</p>
            <button
              onClick={handleRefresh}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Posición
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Región
                  </th>
                  {selectedSeason === 'current' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        2024-25
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        2023-24
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        2022-23
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        2021-22
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </>
                  )}
                  {selectedSeason !== 'current' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Puntos
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rankingData?.map((team, index) => (
                  <tr key={team.team_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getRankIcon(team.ranking_position)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <TeamLogo name={team.team_name} size="sm" />
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {team.team_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {team.ranking_category.replace('_', ' ').toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {team.team?.region?.name || 'Sin región'}
                    </td>
                    {selectedSeason === 'current' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {team.season_breakdown?.['2024-25']?.weighted_points?.toFixed(1) || '0.0'}
                          {team.season_breakdown?.['2024-25'] && (
                            <div className="text-xs text-gray-400">
                              (x{team.season_breakdown['2024-25'].coefficient?.toFixed(1)})
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {team.season_breakdown?.['2023-24']?.weighted_points?.toFixed(1) || '0.0'}
                          {team.season_breakdown?.['2023-24'] && (
                            <div className="text-xs text-gray-400">
                              (x{team.season_breakdown['2023-24'].coefficient?.toFixed(1)})
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {team.season_breakdown?.['2022-23']?.weighted_points?.toFixed(1) || '0.0'}
                          {team.season_breakdown?.['2022-23'] && (
                            <div className="text-xs text-gray-400">
                              (x{team.season_breakdown['2022-23'].coefficient?.toFixed(1)})
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {team.season_breakdown?.['2021-22']?.weighted_points?.toFixed(1) || '0.0'}
                          {team.season_breakdown?.['2021-22'] && (
                            <div className="text-xs text-gray-400">
                              (x{team.season_breakdown['2021-22'].coefficient?.toFixed(1)})
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {team.total_points?.toFixed(1) || '0.0'}
                        </td>
                      </>
                    )}
                    {selectedSeason !== 'current' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {team.total_points?.toFixed(1) || '0.0'}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          Ver
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">ℹ️ Información del sistema híbrido</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Fuente de datos:</strong> team_season_points (cache materializada)</p>
          <p><strong>Actualización:</strong> Automática al cambiar positions</p>
          <p><strong>Rendimiento:</strong> Consultas instantáneas</p>
          <p><strong>Históricos:</strong> Acceso rápido a cualquier temporada</p>
        </div>
      </div>
    </div>
  )
}

export default RankingAdminPageHybrid
