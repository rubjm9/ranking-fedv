import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Trophy, Medal, TrendingUp, TrendingDown, Users, Calendar, Filter, RefreshCw, History, BarChart3, GitCompare } from 'lucide-react'
import hybridRankingService from '@/services/hybridRankingService'
import TeamLogo from '@/components/ui/TeamLogo'
import RankingHistory from '@/components/ranking/RankingHistory'
import RankingEvolution from '@/components/ranking/RankingEvolution'
import SeasonComparison from '@/components/ranking/SeasonComparison'

const RankingPageHybrid: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('beach_mixed')
  const [selectedSeason, setSelectedSeason] = useState<string>('current')
  const [activeTab, setActiveTab] = useState<'ranking' | 'history' | 'evolution' | 'comparison'>('ranking')
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('total')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

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
  const { data: rankingData, isLoading, error, refetch } = useQuery({
    queryKey: ['hybrid-ranking', selectedCategory, referenceSeason],
    queryFn: () => hybridRankingService.getRankingFromSeasonPoints(
      selectedCategory as any,
      referenceSeason
    ),
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: !!selectedCategory && !!referenceSeason
  })

  // Query para estadísticas básicas
  const { data: stats } = useQuery({
    queryKey: ['ranking-stats', selectedCategory],
    queryFn: async () => {
      if (!rankingData) return null
      
      const totalTeams = rankingData.length
      const teamsWithPoints = rankingData.filter(team => team.total_points > 0).length
      const maxPoints = Math.max(...rankingData.map(team => team.total_points))
      const avgPoints = rankingData.length > 0 
        ? rankingData.reduce((sum, team) => sum + team.total_points, 0) / rankingData.length 
        : 0

      return {
        total_teams: totalTeams,
        teams_with_points: teamsWithPoints,
        max_points: maxPoints,
        avg_points: avgPoints
      }
    },
    enabled: !!rankingData
  })

  const handleRefresh = () => {
    refetch()
  }

  // Obtener las últimas 4 temporadas ordenadas (más reciente primero)
  const getLastFourSeasons = (data: any[]) => {
    if (!data || data.length === 0) return []
    
    const seasons = Object.keys(data[0]?.season_breakdown || {})
    return seasons
      .sort((a, b) => {
        const yearA = parseInt(a.split('-')[0])
        const yearB = parseInt(b.split('-')[0])
        return yearB - yearA // Más reciente primero
      })
      .slice(0, 4) // Solo las últimas 4
  }

  // Función para ordenar datos
  const sortData = (data: any[]) => {
    if (!data) return []
    
    // Primero calcular cambios de posición
    const dataWithChanges = calculatePositionChange(data)
    
    return [...dataWithChanges].sort((a, b) => {
      let valueA, valueB
      
      if (sortBy === 'total') {
        valueA = a.total_points || 0
        valueB = b.total_points || 0
      } else {
        // Ordenar por temporada específica
        const seasonDataA = a.season_breakdown?.[sortBy]?.weighted_points || 0
        const seasonDataB = b.season_breakdown?.[sortBy]?.weighted_points || 0
        valueA = seasonDataA
        valueB = seasonDataB
      }
      
      if (sortOrder === 'asc') {
        return valueA - valueB
      } else {
        return valueB - valueA
      }
    })
  }

  // Función para manejar clic en cabecera
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  // Función para calcular el cambio de posición
  const calculatePositionChange = (data: any[]) => {
    if (!data) return []
    
    // Calcular ranking actual (con las últimas 4 temporadas)
    const currentRanking = [...data].sort((a, b) => b.total_points - a.total_points)
    
    // Obtener las temporadas disponibles ordenadas
    const seasons = getLastFourSeasons(data)
    if (seasons.length < 2) return data // No hay suficientes temporadas para comparar
    
    // Calcular ranking de la temporada anterior (usando temporadas -1 a -4)
    const previousRanking = [...data].map(team => {
      let totalPrevious = 0
      
      // Para cada equipo, calcular puntos usando temporadas anteriores
      seasons.slice(1).forEach((season, index) => {
        const coefficient = [1.0, 0.8, 0.5, 0.2][index] || 0
        const points = team.season_breakdown?.[season]?.base_points || 0
        totalPrevious += points * coefficient
      })
      
      return {
        team_id: team.team_id,
        total_points: totalPrevious
      }
    }).sort((a, b) => b.total_points - a.total_points)
    
    // Crear un mapa de posiciones anteriores
    const previousPositionsMap = new Map(
      previousRanking.map((team, index) => [team.team_id, index + 1])
    )
    
    // Agregar cambio de posición a cada equipo
    return currentRanking.map((team, index) => {
      const currentPosition = index + 1
      const previousPosition = previousPositionsMap.get(team.team_id) || currentPosition
      const positionChange = previousPosition - currentPosition // Positivo si subió, negativo si bajó
      
      return {
        ...team,
        position_change: positionChange
      }
    })
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <BarChart3 className="h-4 w-4 text-gray-400" />
  }

  const getChangeText = (change: number) => {
    if (change > 0) return `+${change}`
    if (change < 0) return `${change}`
    return '='
  }

  const getRankIcon = (position: number) => {
    if (position === 1) return <Trophy className="w-6 h-6 text-yellow-500" />
    if (position === 2) return <Medal className="w-6 h-6 text-gray-400" />
    if (position === 3) return <Medal className="w-6 h-6 text-orange-500" />
    return <span className="text-sm font-semibold text-gray-500">#{position}</span>
  }

  const renderRankingTab = () => (
    <div className="space-y-6">
      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Equipos</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total_teams}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Con Puntos</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.teams_with_points}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Max Puntos</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.max_points.toFixed(1)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Promedio</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.avg_points.toFixed(1)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ranking */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Ranking Actual – {categories.find(c => c.value === selectedCategory)?.label}
            </h2>
            <button
              onClick={handleRefresh}
              className="flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-700"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Actualizar</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[70vh]">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Cargando ranking...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">
              <p>Error al cargar el ranking</p>
              <button
                onClick={handleRefresh}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-20 shadow-sm">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Posición
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cambio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Equipo
                    </th>
                    {getLastFourSeasons(rankingData || []).map(season => (
                      <th 
                        key={season} 
                        className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => handleSort(season)}
                      >
                        <div className="flex items-center justify-center space-x-1">
                          <span>{season}</span>
                          {sortBy === season && (
                            <span className="text-blue-500">
                              {sortOrder === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                    <th 
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('total')}
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <span>Total</span>
                        {sortBy === 'total' && (
                          <span className="text-blue-500">
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortData(rankingData || []).map((team, index) => (
                    <tr key={team.team_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getRankIcon(team.ranking_position)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getChangeIcon(team.position_change || 0)}
                          <span className={`ml-1 text-sm font-medium ${
                            (team.position_change || 0) > 0 ? 'text-green-600' : 
                            (team.position_change || 0) < 0 ? 'text-red-600' : 'text-gray-500'
                          }`}>
                            {getChangeText(team.position_change || 0)}
                          </span>
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
                              {team.region_name || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      {getLastFourSeasons(rankingData || []).map(season => (
                        <td key={season} className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-sm font-semibold text-gray-900">
                            {team.season_breakdown?.[season]?.weighted_points?.toFixed(1) || '0.0'}
                          </div>
                          <div className="text-xs text-gray-500">
                            (x{team.season_breakdown?.[season]?.coefficient?.toFixed(1) || '0.0'})
                          </div>
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-lg font-bold text-gray-900">
                          {team.total_points?.toFixed(1) || '0.0'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Ranking</h1>
          <p className="mt-2 text-gray-600">
            Clasificación oficial de equipos por modalidad y temporada
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filtros
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modalidad
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

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('ranking')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'ranking'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Trophy className="w-4 h-4 inline mr-2" />
                Ranking Actual
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <History className="w-4 h-4 inline mr-2" />
                Historial
              </button>
              <button
                onClick={() => setActiveTab('evolution')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'evolution'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <TrendingUp className="w-4 h-4 inline mr-2" />
                Evolución
              </button>
              <button
                onClick={() => setActiveTab('comparison')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'comparison'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <GitCompare className="w-4 h-4 inline mr-2" />
                Comparación
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'ranking' && renderRankingTab()}
            {activeTab === 'history' && (
              <RankingHistory 
                category={selectedCategory}
                season={referenceSeason}
                selectedTeamId={selectedTeamId}
                onTeamSelect={setSelectedTeamId}
              />
            )}
            {activeTab === 'evolution' && (
              <RankingEvolution 
                category={selectedCategory}
                selectedTeamId={selectedTeamId}
                onTeamSelect={setSelectedTeamId}
              />
            )}
            {activeTab === 'comparison' && (
              <SeasonComparison 
                category={selectedCategory}
                season1={referenceSeason}
                season2="2023-24"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RankingPageHybrid