import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Trophy, 
  Medal, 
  TrendingUp, 
  Users, 
  Calendar,
  Filter, 
  RefreshCw,
  Download,
  BarChart3,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'
import rankingService from '@/services/rankingService'
import TeamLogo from '@/components/ui/TeamLogo'
import ActionButtonGroup from '@/components/ui/ActionButtonGroup'
import toast from 'react-hot-toast'

const RankingAdminPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [selectedCategory, setSelectedCategory] = useState<string>('beach_mixed')
  const [selectedSeason, setSelectedSeason] = useState<string>('current')

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
    { value: '2024-25', label: 'Temporada 2024-25' }
  ]

  // Query para obtener ranking actual
  const { data: currentRankingData, isLoading: isLoadingCurrent, error: currentError } = useQuery({
    queryKey: ['ranking', 'current', selectedCategory],
    queryFn: () => rankingService.getCurrentRankingWithTeams(selectedCategory),
    enabled: selectedSeason === 'current'
  })

  // Query para obtener ranking por temporada
  const { data: seasonRankingData, isLoading: isLoadingSeason, error: seasonError } = useQuery({
    queryKey: ['ranking', 'season', selectedSeason],
    queryFn: () => rankingService.getSeasonRankingWithTeams(selectedSeason),
    enabled: selectedSeason !== 'current'
  })

  // Query para estadísticas
  const { data: statsData } = useQuery({
    queryKey: ['ranking', 'stats'],
    queryFn: () => rankingService.getRankingStats()
  })

  // Mutación para recalcular ranking
  const recalculateMutation = useMutation({
    mutationFn: () => rankingService.recalculateRanking(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ranking'] })
      toast.success('Ranking recalculado exitosamente')
    },
    onError: (error: any) => {
      console.error('Error al recalcular ranking:', error)
      toast.error('Error al recalcular el ranking')
    }
  })

  const isLoading = isLoadingCurrent || isLoadingSeason
  const error = currentError || seasonError
  const rankingData = selectedSeason === 'current' ? currentRankingData?.data : seasonRankingData?.data

  const getPositionIcon = (position: number) => {
    if (position === 1) return <Trophy className="h-6 w-6 text-yellow-500" />
    if (position === 2) return <Medal className="h-6 w-6 text-gray-400" />
    if (position === 3) return <Medal className="h-6 w-6 text-orange-500" />
    return <span className="text-lg font-bold text-gray-600">#{position}</span>
  }

  const getPositionColor = (position: number) => {
    if (position === 1) return 'bg-yellow-50 border-yellow-200'
    if (position === 2) return 'bg-gray-50 border-gray-200'
    if (position === 3) return 'bg-orange-50 border-orange-200'
    return 'bg-white border-gray-200'
  }

  const handleRecalculate = () => {
    if (window.confirm('¿Estás seguro de que quieres recalcular el ranking? Esto puede tomar unos momentos.')) {
      recalculateMutation.mutate()
    }
  }

  const handleExportRanking = () => {
    // TODO: Implementar exportación de ranking
    toast.info('Función de exportación en desarrollo')
  }

  const handleDiagnose = async () => {
    try {
      console.log('🔍 Ejecutando diagnóstico...')
      const result = await rankingService.diagnoseRanking()
      console.log('📋 Resultado del diagnóstico:', result)
      toast.success('Diagnóstico completado. Revisa la consola para ver los resultados.')
    } catch (error) {
      console.error('Error en diagnóstico:', error)
      toast.error('Error al ejecutar diagnóstico')
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-red-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar el ranking</h1>
          <p className="text-gray-600 mb-4">No se pudo cargar la información del ranking.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between">
          <div>
              <h1 className="text-3xl font-bold text-gray-900">Administración de Ranking</h1>
              <p className="text-gray-600 mt-2">Gestión y visualización del ranking oficial</p>
          </div>
            <div className="flex items-center space-x-4">
            <button
                onClick={handleExportRanking}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Exportar</span>
            </button>
            <button
              onClick={handleDiagnose}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-white bg-orange-600 rounded-md hover:bg-orange-700 transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Diagnosticar</span>
            </button>
            <button
              onClick={handleRecalculate}
                disabled={recalculateMutation.isPending}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {recalculateMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span>Recalcular</span>
            </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modalidad
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.icon} {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Temporada */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temporada
              </label>
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {seasons.map((season) => (
                  <option key={season.value} value={season.value}>
                    {season.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        {statsData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Equipos</p>
                  <p className="text-2xl font-bold text-gray-900">{statsData.total_teams || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Trophy className="h-8 w-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Con Puntos</p>
                  <p className="text-2xl font-bold text-gray-900">{statsData.teams_with_points || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Max Puntos</p>
                  <p className="text-2xl font-bold text-gray-900">{statsData.max_points || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Promedio</p>
                  <p className="text-2xl font-bold text-gray-900">{statsData.avg_points || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ranking */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedSeason === 'current' ? 'Ranking Actual' : `Temporada ${selectedSeason}`}
              </h2>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                <span>Actualizado: {new Date().toLocaleDateString('es-ES')}</span>
              </div>
        </div>
      </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Cargando ranking...</p>
        </div>
          ) : rankingData && rankingData.length > 0 ? (
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
                          Esta Temporada
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Temporada Anterior
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
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                  {rankingData.map((team: any, index: number) => (
                    <tr key={team.team_id || team.id || index} className={getPositionColor(team.ranking_position || index + 1)}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                          {getPositionIcon(team.ranking_position || index + 1)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <TeamLogo
                              name={team.team?.name || 'Equipo desconocido'}
                              logo={team.team?.logo}
                              size="sm"
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {team.team?.name || 'Equipo desconocido'}
                            </div>
                          </div>
                    </div>
                  </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {team.team?.region?.name || 'Sin región'}
                      </td>
                      {selectedSeason === 'current' && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {team.current_season_points || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {team.previous_season_points || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {team.total_points?.toFixed(1) || '0.0'}
                  </td>
                        </>
                      )}
                      {selectedSeason !== 'current' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {team.beach_mixed_points || 0}
                  </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <ActionButtonGroup
                          onView={() => window.open(`/teams/${team.team_id}`, '_blank')}
                          onEdit={() => window.open(`/admin/teams/${team.team_id}/edit`, '_blank')}
                          viewTooltip="Ver equipo"
                          editTooltip="Editar equipo"
                          entityId={team.team_id}
                        />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          ) : (
            <div className="p-8 text-center">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay datos disponibles</h3>
              <p className="text-gray-500">
                No se encontraron equipos con puntos en esta modalidad y temporada.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RankingAdminPage