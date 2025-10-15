import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Trophy, Medal, TrendingUp, TrendingDown, Users, Calendar, RefreshCw, BarChart3, LineChart, Star, MapPin } from 'lucide-react'
import hybridRankingService from '@/services/hybridRankingService'
import TeamLogo from '@/components/ui/TeamLogo'

const RankingPageHybrid: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('beach_mixed')
  const [activeTab, setActiveTab] = useState<'ranking' | 'analysis' | 'performers' | 'advanced'>('ranking')
  const [sortBy, setSortBy] = useState<string>('total')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedRankingType, setSelectedRankingType] = useState<'specific' | 'general'>('specific')

  // Iconos minimalistas (inline SVGs) para garantizar disponibilidad y tamaño reducido
  const IconBeach: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M3 16c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M3 20c1.5 0 1.5-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1 1.5-1 3-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )
  const IconGrass: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M3 20h18" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M6 20v-4m3 4v-5m3 5v-4m3 4v-6m3 6v-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M6 15l-1-2m4 2l-1-2m4 2l-1-2m4 2l-1-2m4 2l-1-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
  const IconMixed: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="9" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="15" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )
  const IconOpen: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )
  const IconWomen: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M12 12v6m0 0h3m-3 0H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )

  type ButtonItem = { value: string; label: string; Icon: React.FC<{ className?: string }>; group?: 'beach' | 'grass' | 'mixed' | 'open' | 'women' | 'all' }

  // Campeonatos específicos con iconos
  const specificChampionships: ButtonItem[] = [
    { value: 'beach_mixed', label: 'Playa Mixto', Icon: IconBeach, group: 'beach' },
    { value: 'beach_open', label: 'Playa Open', Icon: IconBeach, group: 'open' },
    { value: 'beach_women', label: 'Playa Women', Icon: IconBeach, group: 'women' },
    { value: 'grass_mixed', label: 'Césped Mixto', Icon: IconGrass, group: 'mixed' },
    { value: 'grass_open', label: 'Césped Open', Icon: IconGrass, group: 'open' },
    { value: 'grass_women', label: 'Césped Women', Icon: IconGrass, group: 'women' }
  ]

  // Rankings combinados con iconos
  const generalRankings: ButtonItem[] = [
    { value: 'general_all', label: 'Ranking General', Icon: Trophy },
    { value: 'general_beach', label: 'Ranking Playa', Icon: IconBeach },
    { value: 'general_grass', label: 'Ranking Césped', Icon: IconGrass },
    { value: 'general_mixed', label: 'Ranking Mixto', Icon: IconMixed },
    { value: 'general_open', label: 'Ranking Open', Icon: IconOpen },
    { value: 'general_women', label: 'Ranking Women', Icon: IconWomen }
  ]

  // Determinar la temporada de referencia
  const referenceSeason = '2024-25'

  // Mapeo de rankings combinados a categorías
  const getCategoriesForCombinedRanking = (rankingValue: string) => {
    const categoriesMap: { [key: string]: string[] } = {
      'general_all': ['beach_mixed', 'beach_open', 'beach_women', 'grass_mixed', 'grass_open', 'grass_women'],
      'general_beach': ['beach_mixed', 'beach_open', 'beach_women'],
      'general_grass': ['grass_mixed', 'grass_open', 'grass_women'],
      'general_mixed': ['beach_mixed', 'grass_mixed'],
      'general_open': ['beach_open', 'grass_open'],
      'general_women': ['beach_women', 'grass_women']
    }
    return categoriesMap[rankingValue] || []
  }

  // Query optimizada usando el sistema híbrido
  const { data: rankingData, isLoading, error, refetch } = useQuery({
    queryKey: ['hybrid-ranking', selectedCategory, referenceSeason, selectedRankingType],
    queryFn: () => {
      if (selectedRankingType === 'general') {
        // Para rankings combinados, usar getCombinedRanking
        const categories = getCategoriesForCombinedRanking(selectedCategory)
        return hybridRankingService.getCombinedRanking(
          categories as any,
          referenceSeason
        )
      } else {
        return hybridRankingService.getRankingFromSeasonPoints(
          selectedCategory as any,
          referenceSeason
        )
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: !!selectedCategory && !!referenceSeason
  })

  // Query para estadísticas mejoradas
  const { data: stats } = useQuery({
    queryKey: ['ranking-stats', selectedCategory],
    queryFn: async () => {
      if (!rankingData) return null
      
      const totalTeams = rankingData.length
      const avgPoints = rankingData.length > 0 
        ? rankingData.reduce((sum, team) => sum + team.total_points, 0) / rankingData.length 
        : 0

      // Equipos nuevos: equipos que solo tienen puntos en la temporada actual
      const newTeams = rankingData.filter(team => {
        const seasons = Object.keys(team.season_breakdown || {})
        return seasons.length === 1 && seasons.includes(referenceSeason)
      }).length

      // Consistencia: equipos que han mantenido posiciones altas (top 10) en múltiples temporadas
      const consistentTeams = rankingData.filter(team => {
        const seasons = Object.keys(team.season_breakdown || {})
        if (seasons.length < 2) return false
        
        // Verificar si ha estado en top 10 en al menos 2 temporadas
        const top10Seasons = seasons.filter(season => {
          const seasonPoints = team.season_breakdown?.[season]?.base_points || 0
          // Calcular posición aproximada basada en puntos (simplificado)
          const teamsWithMorePoints = rankingData.filter(t => 
            (t.season_breakdown?.[season]?.base_points || 0) > seasonPoints
          ).length
          return teamsWithMorePoints < 10
        })
        return top10Seasons.length >= 2
      }).length

      // Actividad: promedio de torneos jugados por equipo
      const totalTournaments = rankingData.reduce((sum, team) => {
        return sum + Object.values(team.season_breakdown || {}).reduce((seasonSum) => {
          return seasonSum + 1 // Simplificado: contar temporadas como proxy de actividad
        }, 0)
      }, 0)
      const avgActivity = totalTournaments / totalTeams

      return {
        total_teams: totalTeams,
        avg_points: avgPoints,
        new_teams: newTeams,
        consistent_teams: consistentTeams,
        avg_activity: avgActivity
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

  const getRankingExplanation = (category: string, rankingType: 'specific' | 'general') => {
    if (rankingType === 'specific') {
      return {
        title: 'Ranking Específico',
        explanation: 'Este ranking muestra la clasificación de equipos en una modalidad específica (superficie + categoría). Los puntos se calculan sumando todos los torneos de esa modalidad en las últimas 4 temporadas, aplicando coeficientes de antigüedad: temporada actual (1.0x), año anterior (0.8x), dos años atrás (0.5x) y tres años atrás (0.2x). Además, se aplica un coeficiente regional que multiplica todos los puntos obtenidos en torneos regionales.'
      }
    } else {
      const explanations: Record<string, { title: string; explanation: string }> = {
        'general_all': {
          title: 'Ranking General',
          explanation: 'Suma de puntos de todas las modalidades (Playa Mixto + Playa Open + Playa Women + Césped Mixto + Césped Open + Césped Women). Representa el rendimiento global del equipo en todas las categorías.'
        },
        'general_beach': {
          title: 'Ranking Playa',
          explanation: 'Suma de puntos de todas las categorías de playa (Mixto + Open + Women). Refleja el rendimiento del equipo en torneos de superficie de arena.'
        },
        'general_grass': {
          title: 'Ranking Césped',
          explanation: 'Suma de puntos de todas las categorías de césped (Mixto + Open + Women). Refleja el rendimiento del equipo en torneos de superficie de césped.'
        },
        'general_mixed': {
          title: 'Ranking Mixto',
          explanation: 'Suma de puntos de todos los torneos mixtos (Playa Mixto + Césped Mixto). Refleja el rendimiento del equipo en competiciones con equipos mixtos.'
        },
        'general_open': {
          title: 'Ranking Open',
          explanation: 'Suma de puntos de todos los torneos open (Playa Open + Césped Open). Refleja el rendimiento del equipo en competiciones de categoría masculina.'
        },
        'general_women': {
          title: 'Ranking Women',
          explanation: 'Suma de puntos de todos los torneos women (Playa Women + Césped Women). Refleja el rendimiento del equipo en competiciones de categoría femenina.'
        }
      }
      return explanations[category] || { title: 'Ranking Combinado', explanation: 'Ranking que combina múltiples modalidades según criterios específicos.' }
    }
  }

  // Botón minimalista (compacto) con icono lineal
  const RankingButton = ({ item, isSelected, onClick }: { item: ButtonItem, isSelected: boolean, onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`group flex items-center gap-2 rounded-md border px-3 py-2 text-xs md:text-sm transition-colors ${
        isSelected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
      }`}
      title={item.label}
    >
      <item.Icon className={isSelected ? 'w-4 h-4 text-blue-600' : 'w-4 h-4 text-gray-600 group-hover:text-gray-800'} />
      <span className="truncate">{item.label}</span>
    </button>
  )

  const getRankIcon = (position: number) => {
    if (position === 1) return <Trophy className="w-6 h-6 text-yellow-500" />
    if (position === 2) return <Medal className="w-6 h-6 text-gray-400" />
    if (position === 3) return <Medal className="w-6 h-6 text-orange-500" />
    return <span className="text-sm font-semibold text-gray-500">#{position}</span>
  }

  const renderRankingTab = () => (
    <div className="space-y-6">
      {/* Estadísticas mejoradas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              <BarChart3 className="w-8 h-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Promedio</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.avg_points.toFixed(1)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Equipos Nuevos</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.new_teams}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Consistencia</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.consistent_teams}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-orange-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Actividad</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.avg_activity.toFixed(1)}</p>
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
              Ranking Actual – {
                selectedRankingType === 'specific' 
                  ? specificChampionships.find(c => c.value === selectedCategory)?.label
                  : generalRankings.find(c => c.value === selectedCategory)?.label
              }
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
                  {sortData(rankingData || []).map((team) => (
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

  // Renderizar pestaña de Análisis de Equipos
  const renderAnalysisTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <LineChart className="w-5 h-5 mr-2" />
          Análisis de Equipos
        </h3>
        <p className="text-gray-600 mb-6">
          Selecciona equipos para comparar su evolución de puntos y posiciones a lo largo del tiempo.
        </p>
        
        {/* Selector de equipos múltiple */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar equipos para análisis:
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
            {rankingData?.slice(0, 20).map((team) => (
              <label key={team.team_id} className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="truncate">{team.team_name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Placeholder para gráfica */}
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <LineChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Gráfica de evolución aparecerá aquí</p>
          <p className="text-sm text-gray-400 mt-2">Selecciona equipos para ver su comparación</p>
        </div>
      </div>
    </div>
  )

  // Renderizar pestaña de Top Performers
  const renderPerformersTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Star className="w-5 h-5 mr-2" />
          Top Performers
        </h3>
        <p className="text-gray-600 mb-6">
          Descubre los equipos más destacados por diferentes criterios de rendimiento.
        </p>
        
        {/* Tabs internos para diferentes tipos de performers */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button className="py-2 px-1 border-b-2 border-blue-500 text-blue-600 font-medium text-sm">
              Mejores por Temporada
            </button>
            <button className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm">
              Mayor Crecimiento
            </button>
            <button className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm">
              Más Consistentes
            </button>
          </nav>
        </div>

        {/* Placeholder para contenido */}
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Análisis de top performers aparecerá aquí</p>
          <p className="text-sm text-gray-400 mt-2">Rankings históricos y estadísticas destacadas</p>
        </div>
      </div>
    </div>
  )

  // Renderizar pestaña de Estadísticas Avanzadas
  const renderAdvancedTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MapPin className="w-5 h-5 mr-2" />
          Estadísticas Avanzadas
        </h3>
        <p className="text-gray-600 mb-6">
          Análisis detallado de la distribución geográfica y competitividad del ranking.
        </p>
        
        {/* Estadísticas por región */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">Distribución por Región</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rankingData?.reduce((acc: { [key: string]: number }, team) => {
              const region = team.region_name || 'Sin región'
              acc[region] = (acc[region] || 0) + 1
              return acc
            }, {}) && Object.entries(
              rankingData?.reduce((acc: { [key: string]: number }, team) => {
                const region = team.region_name || 'Sin región'
                acc[region] = (acc[region] || 0) + 1
                return acc
              }, {}) || {}
            ).map(([region, count]) => (
              <div key={region} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{region}</span>
                  <span className="text-lg font-semibold text-blue-600">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Competitividad */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">Análisis de Competitividad</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Diferencia 1º-2º</div>
              <div className="text-xl font-semibold text-gray-900">
                {rankingData && rankingData.length > 1 
                  ? (rankingData[0].total_points - rankingData[1].total_points).toFixed(1)
                  : '0.0'
                }
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Equipos en Top 10</div>
              <div className="text-xl font-semibold text-gray-900">
                {Math.min(10, rankingData?.length || 0)}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Densidad Competitiva</div>
              <div className="text-xl font-semibold text-gray-900">
                {rankingData && rankingData.length > 0
                  ? ((rankingData.slice(0, 10).reduce((sum, team) => sum + team.total_points, 0) / 10) / 
                     (rankingData[0].total_points || 1) * 100).toFixed(1) + '%'
                  : '0%'
                }
              </div>
            </div>
          </div>
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
            Clasificación oficial de equipos por modalidad y temporada. Selecciona una modalidad para ver el ranking específico, o alguno de los rankings combinados.
          </p>
        </div>

        {/* Selector de Rankings (compacto) */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          {/* Fila 1: Campeonatos Específicos */}
          <div className="flex flex-wrap items-center gap-2">
            {specificChampionships.map((championship) => (
              <RankingButton
                key={championship.value}
                item={championship}
                isSelected={selectedRankingType === 'specific' && selectedCategory === championship.value}
                onClick={() => {
                  setSelectedRankingType('specific')
                  setSelectedCategory(championship.value)
                }}
              />
            ))}
          </div>

          {/* Separador sutil */}
          <div className="my-3 h-px bg-gray-100" />

          {/* Fila 2: Rankings Combinados */}
          <div className="flex flex-wrap items-center gap-2">
            {generalRankings.map((ranking) => (
              <RankingButton
                key={ranking.value}
                item={ranking}
                isSelected={selectedRankingType === 'general' && selectedCategory === ranking.value}
                onClick={() => {
                  setSelectedRankingType('general')
                  setSelectedCategory(ranking.value)
                }}
              />
            ))}
          </div>
        </div>

        {/* Explicación del ranking seleccionado */}
        {selectedCategory && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Trophy className="w-5 h-5 text-blue-600 mt-0.5" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-900">
                  {getRankingExplanation(selectedCategory, selectedRankingType).title}
                </h3>
                <p className="mt-1 text-sm text-blue-700">
                  {getRankingExplanation(selectedCategory, selectedRankingType).explanation}
                </p>
              </div>
            </div>
          </div>
        )}

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
                onClick={() => setActiveTab('analysis')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'analysis'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <LineChart className="w-4 h-4 inline mr-2" />
                Análisis de Equipos
              </button>
              <button
                onClick={() => setActiveTab('performers')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'performers'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Star className="w-4 h-4 inline mr-2" />
                Top Performers
              </button>
              <button
                onClick={() => setActiveTab('advanced')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'advanced'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <MapPin className="w-4 h-4 inline mr-2" />
                Estadísticas Avanzadas
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'ranking' && renderRankingTab()}
            {activeTab === 'analysis' && renderAnalysisTab()}
            {activeTab === 'performers' && renderPerformersTab()}
            {activeTab === 'advanced' && renderAdvancedTab()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RankingPageHybrid