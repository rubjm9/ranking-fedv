import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Trophy, Medal, TrendingUp, Users, Calendar, Filter, RefreshCw, History, BarChart3, GitCompare } from 'lucide-react'
import rankingService from '@/services/rankingService'
import TeamLogo from '@/components/ui/TeamLogo'
import RankingHistory from '@/components/ranking/RankingHistory'
import RankingEvolution from '@/components/ranking/RankingEvolution'
import SeasonComparison from '@/components/ranking/SeasonComparison'

const RankingPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('beach_mixed')
  const [selectedSeason, setSelectedSeason] = useState<string>('current')
  const [activeTab, setActiveTab] = useState<'ranking' | 'history' | 'evolution' | 'comparison'>('ranking')
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')

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

  // Query para obtener ranking
  const { data: rankingResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['ranking', selectedCategory],
    queryFn: () => rankingService.getRanking(selectedCategory),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const rankingData = rankingResponse?.data || []
  const rankingSummary = rankingResponse?.summary

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
              <h1 className="text-3xl font-bold text-gray-900">Ranking FEDV</h1>
              <p className="text-gray-600 mt-2">Clasificación oficial de equipos por modalidad</p>
          </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>Actualizado: {new Date().toLocaleDateString('es-ES')}</span>
          </div>
          </div>
          </div>
        </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pestañas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('ranking')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'ranking'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Trophy className="h-4 w-4" />
                  <span>Ranking Actual</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <History className="h-4 w-4" />
                  <span>Historial</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('evolution')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'evolution'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Evolución</span>
                </div>
              </button>
                  <button
                onClick={() => setActiveTab('comparison')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'comparison'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <GitCompare className="h-4 w-4" />
                  <span>Comparación</span>
                </div>
                  </button>
            </nav>
          </div>

          {/* Filtros */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
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
        </div>

        {/* Estadísticas */}
        {rankingSummary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Equipos</p>
                  <p className="text-2xl font-bold text-gray-900">{rankingSummary.total_teams}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Trophy className="h-8 w-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Con Puntos</p>
                  <p className="text-2xl font-bold text-gray-900">{rankingSummary.teams_with_points}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Max Puntos</p>
                  <p className="text-2xl font-bold text-gray-900">{rankingSummary.max_points}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center">
                <Calendar className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Promedio</p>
                  <p className="text-2xl font-bold text-gray-900">{rankingSummary.average_points}</p>
                </div>
              </div>
            </div>
                      </div>
        )}

        {/* Contenido de las pestañas */}
        {activeTab === 'ranking' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Ranking Actual - {categories.find(c => c.value === selectedCategory)?.label}
                </h2>
                <button
                  onClick={() => refetch()}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Actualizar</span>
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-4">Cargando ranking...</p>
              </div>
            ) : rankingData && rankingData.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {rankingData.map((entry: any, index: number) => (
                  <div
                    key={entry.team_id}
                    className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer ${getPositionColor(entry.ranking_position || index + 1)}`}
                    onClick={() => {
                      setSelectedTeamId(entry.team_id)
                      setActiveTab('evolution')
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Posición */}
                        <div className="flex-shrink-0">
                          {getPositionIcon(entry.ranking_position || index + 1)}
                        </div>

                        {/* Logo del equipo */}
                        <div className="flex-shrink-0">
                          <TeamLogo
                            name={entry.team_name || 'Equipo desconocido'}
                            size="md"
                          />
                        </div>

                        {/* Información del equipo */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {entry.team_name || 'Equipo desconocido'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {entry.ranking_category?.replace('_', ' ').toUpperCase() || 'Sin categoría'}
                          </p>
                        </div>
                      </div>

                      {/* Puntos */}
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Puntos totales</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {entry.total_points?.toFixed(1) || '0.0'}
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Esta temporada</p>
                          <p className="text-xl font-semibold text-blue-600">
                            {entry.current_season_points || 0}
                          </p>
                        </div>

                        {entry.previous_season_points > 0 && (
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Temporada anterior</p>
                            <p className="text-lg font-medium text-gray-600">
                              {entry.previous_season_points}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
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
        )}

        {/* Pestaña de Historial */}
        {activeTab === 'history' && (
          <RankingHistory 
            category={selectedCategory}
            limit={20}
          />
        )}

        {/* Pestaña de Evolución */}
        {activeTab === 'evolution' && (
          <RankingEvolution 
            teamId={selectedTeamId}
            category={selectedCategory}
          />
        )}

        {/* Pestaña de Comparación */}
        {activeTab === 'comparison' && (
          <SeasonComparison 
            category={selectedCategory}
          />
        )}
      </div>
    </div>
  )
}

export default RankingPage