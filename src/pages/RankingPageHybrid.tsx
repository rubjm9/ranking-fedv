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
  const [performersTab, setPerformersTab] = useState<'season' | 'growth' | 'consistent'>('season')
  const [selectedTeamsForAnalysis, setSelectedTeamsForAnalysis] = useState<string[]>([])
  const [analysisView, setAnalysisView] = useState<'points' | 'positions'>('points')
  const [hoveredPoint, setHoveredPoint] = useState<{team: any, point: any, x: number, y: number} | null>(null)
  const [teamSearchTerm, setTeamSearchTerm] = useState<string>('')
  const [showAllTeams, setShowAllTeams] = useState<boolean>(false)

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

  // Funciones para análisis de equipos
  const handleTeamSelection = (teamId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedTeamsForAnalysis(prev => [...prev, teamId])
    } else {
      setSelectedTeamsForAnalysis(prev => prev.filter(id => id !== teamId))
    }
  }

  const getAnalysisData = () => {
    if (!rankingData || selectedTeamsForAnalysis.length === 0) return []

    const selectedTeamsData = rankingData.filter(team => 
      selectedTeamsForAnalysis.includes(team.team_id)
    )

    return selectedTeamsData.map(team => {
      const seasons = Object.keys(team.season_breakdown || {}).sort()
      const data = seasons.map(season => ({
        season,
        points: team.season_breakdown?.[season]?.base_points || 0,
        weighted_points: team.season_breakdown?.[season]?.weighted_points || 0,
        coefficient: team.season_breakdown?.[season]?.coefficient || 0
      }))

      return {
        team_id: team.team_id,
        team_name: team.team_name,
        region_name: team.region_name,
        data
      }
    })
  }

  const getPositionAnalysisData = () => {
    if (!rankingData || selectedTeamsForAnalysis.length === 0) return []

    const selectedTeamsData = rankingData.filter(team => 
      selectedTeamsForAnalysis.includes(team.team_id)
    )

    // Calcular posiciones por temporada
    const seasons = getLastFourSeasons(rankingData)
    const positionData: { [season: string]: { [teamId: string]: number } } = {}

    seasons.forEach(season => {
      const seasonRanking = [...rankingData].sort((a, b) => {
        const pointsA = a.season_breakdown?.[season]?.base_points || 0
        const pointsB = b.season_breakdown?.[season]?.base_points || 0
        return pointsB - pointsA
      })

      positionData[season] = {}
      seasonRanking.forEach((team, index) => {
        positionData[season][team.team_id] = index + 1
      })
    })

    return selectedTeamsData.map(team => {
      const data = seasons.map(season => ({
        season,
        position: positionData[season]?.[team.team_id] || null
      })).filter(item => item.position !== null)

      return {
        team_id: team.team_id,
        team_name: team.team_name,
        region_name: team.region_name,
        data
      }
    })
  }

  // Funciones para calcular top performers
  const getTopPerformersBySeason = () => {
    if (!rankingData) return []
    
    // Mejores equipos por temporada individual
    const seasonPerformers: { [season: string]: any[] } = {}
    
    rankingData.forEach(team => {
      Object.entries(team.season_breakdown || {}).forEach(([season, data]) => {
        if (!seasonPerformers[season]) {
          seasonPerformers[season] = []
        }
        seasonPerformers[season].push({
          team_id: team.team_id,
          team_name: team.team_name,
          region_name: team.region_name,
          season,
          points: data.base_points,
          weighted_points: data.weighted_points
        })
      })
    })

    // Ordenar cada temporada y tomar top 3
    Object.keys(seasonPerformers).forEach(season => {
      seasonPerformers[season].sort((a, b) => b.points - a.points)
      seasonPerformers[season] = seasonPerformers[season].slice(0, 3)
    })

    return seasonPerformers
  }

  const getTopGrowthPerformers = () => {
    if (!rankingData) return []
    
    // Calcular crecimiento entre temporadas
    const growthPerformers = rankingData.map(team => {
      const seasons = Object.keys(team.season_breakdown || {}).sort()
      let totalGrowth = 0
      let growthSeasons = 0
      
      for (let i = 1; i < seasons.length; i++) {
        const currentSeason = team.season_breakdown?.[seasons[i]]?.base_points || 0
        const previousSeason = team.season_breakdown?.[seasons[i-1]]?.base_points || 0
        const growth = currentSeason - previousSeason
        totalGrowth += growth
        growthSeasons++
      }
      
      const avgGrowth = growthSeasons > 0 ? totalGrowth / growthSeasons : 0
      
      return {
        team_id: team.team_id,
        team_name: team.team_name,
        region_name: team.region_name,
        total_growth: totalGrowth,
        avg_growth: avgGrowth,
        seasons_compared: growthSeasons
      }
    }).filter(team => team.seasons_compared > 0)
    
    return growthPerformers.sort((a, b) => b.avg_growth - a.avg_growth).slice(0, 10)
  }

  const getMostConsistentPerformers = () => {
    if (!rankingData) return []
    
    // Calcular consistencia basada en variabilidad de puntos
    const consistentPerformers = rankingData.map(team => {
      const seasons = Object.values(team.season_breakdown || {})
      if (seasons.length < 2) return null
      
      const points = seasons.map(s => s.base_points)
      const avg = points.reduce((sum, p) => sum + p, 0) / points.length
      const variance = points.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / points.length
      const stdDev = Math.sqrt(variance)
      const coefficient = avg > 0 ? stdDev / avg : 0 // Coeficiente de variación
      
      return {
        team_id: team.team_id,
        team_name: team.team_name,
        region_name: team.region_name,
        avg_points: avg,
        std_deviation: stdDev,
        coefficient_variation: coefficient,
        seasons_count: seasons.length
      }
    }).filter(team => team !== null && team.seasons_count >= 2)
    
    return consistentPerformers.sort((a, b) => {
      if (!a || !b) return 0
      return a.coefficient_variation - b.coefficient_variation
    }).slice(0, 10)
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
      {/* Estadísticas mejoradas con tooltips */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-4 group relative">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Equipos</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total_teams}</p>
              </div>
            </div>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Número total de equipos registrados en este ranking
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 group relative">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Promedio</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.avg_points.toFixed(1)}</p>
              </div>
            </div>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Promedio de puntos por equipo en este ranking
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 group relative">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Equipos Nuevos</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.new_teams}</p>
              </div>
            </div>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Equipos que solo tienen puntos en la temporada actual (2024-25)
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 group relative">
            <div className="flex items-center">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Consistencia</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.consistent_teams}</p>
              </div>
            </div>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Equipos que han estado en top 10 en al menos 2 temporadas
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 group relative">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-orange-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Actividad</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.avg_activity.toFixed(1)}</p>
              </div>
            </div>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
              Promedio de temporadas activas por equipo
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
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

  // Componente de gráfica simple con SVG
  const SimpleChart = ({ data, type }: { data: any[], type: 'points' | 'positions' }) => {
    if (!data || data.length === 0) return null

    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899']
    const width = 800
    const height = 400
    const padding = 60

    // Obtener todas las temporadas únicas
    const allSeasons = Array.from(new Set(data.flatMap(team => team.data.map((d: any) => d.season)))).sort()
    
    // Calcular escalas
    let maxValue = 0
    let minValue = 0
    
    if (type === 'points') {
      maxValue = Math.max(...data.flatMap(team => team.data.map((d: any) => d.points)))
      minValue = Math.min(...data.flatMap(team => team.data.map((d: any) => d.points)))
    } else {
      maxValue = Math.max(...data.flatMap(team => team.data.map((d: any) => d.position)))
      minValue = Math.min(...data.flatMap(team => team.data.map((d: any) => d.position)))
    }

    const xScale = (index: number) => padding + (index * (width - 2 * padding)) / (allSeasons.length - 1)
    const yScale = (value: number) => {
      if (type === 'positions') {
        // Para posiciones: posición 1 arriba, últimas posiciones abajo
        return padding + ((value - minValue) / (maxValue - minValue)) * (height - 2 * padding)
      } else {
        // Para puntos: valores altos arriba, valores bajos abajo
        return padding + ((maxValue - value) / (maxValue - minValue)) * (height - 2 * padding)
      }
    }

    const handleMouseEnter = (team: any, point: any, x: number, y: number) => {
      setHoveredPoint({ team, point, x, y })
    }

    const handleMouseLeave = () => {
      setHoveredPoint(null)
    }

    return (
      <div className="w-full overflow-x-auto relative">
        <svg width={width} height={height} className="border border-gray-200 rounded-lg">
          {/* Ejes */}
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#E5E7EB" strokeWidth="2" />
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#E5E7EB" strokeWidth="2" />
          
          {/* Etiquetas del eje X */}
          {allSeasons.map((season, index) => (
            <text
              key={season}
              x={xScale(index)}
              y={height - padding + 20}
              textAnchor="middle"
              className="text-xs fill-gray-600"
            >
              {season}
            </text>
          ))}
          
          {/* Etiquetas del eje Y */}
          {type === 'positions' ? (
            // Para posiciones: mostrar de menor a mayor (1, 2, 3, etc.)
            [minValue, Math.round((maxValue + minValue) / 2), maxValue].map((value, index) => (
              <text
                key={index}
                x={padding - 10}
                y={yScale(value) + 4}
                textAnchor="end"
                className="text-xs fill-gray-600"
              >
                {value.toFixed(0)}
              </text>
            ))
          ) : (
            // Para puntos: mostrar de mayor a menor
            [maxValue, (maxValue + minValue) / 2, minValue].map((value, index) => (
              <text
                key={index}
                x={padding - 10}
                y={yScale(value) + 4}
                textAnchor="end"
                className="text-xs fill-gray-600"
              >
                {value.toFixed(0)}
              </text>
            ))
          )}
          
          {/* Líneas de equipos */}
          {data.map((team, teamIndex) => {
            const points = team.data.map((d: any) => ({
              x: xScale(allSeasons.indexOf(d.season)),
              y: yScale(type === 'points' ? d.points : d.position),
              season: d.season,
              value: type === 'points' ? d.points : d.position
            })).filter((p: any) => !isNaN(p.x) && !isNaN(p.y))

            if (points.length < 2) return null

            // Crear líneas suaves con curvas de Bézier
            let pathData = ''
            if (points.length > 0) {
              pathData = `M ${points[0].x} ${points[0].y}`
              for (let i = 1; i < points.length; i++) {
                const prevPoint = points[i - 1]
                const currentPoint = points[i]
                const controlPoint1X = prevPoint.x + (currentPoint.x - prevPoint.x) * 0.5
                const controlPoint1Y = prevPoint.y
                const controlPoint2X = prevPoint.x + (currentPoint.x - prevPoint.x) * 0.5
                const controlPoint2Y = currentPoint.y
                pathData += ` C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${currentPoint.x} ${currentPoint.y}`
              }
            }

            return (
              <g key={team.team_id}>
                <path
                  d={pathData}
                  stroke={colors[teamIndex % colors.length]}
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.1))' }}
                />
                {points.map((point: any, pointIndex: number) => (
                  <g key={pointIndex}>
                    {/* Área invisible más grande para facilitar el hover */}
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="12"
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => handleMouseEnter(team, point, point.x, point.y)}
                      onMouseLeave={handleMouseLeave}
                    />
                    {/* Punto visible */}
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill={colors[teamIndex % colors.length]}
                      stroke="white"
                      strokeWidth="2"
                      className="cursor-pointer"
                    />
                  </g>
                ))}
              </g>
            )
          })}
        </svg>
        
        {/* Tooltip flotante */}
        {hoveredPoint && (
          <div 
            className="absolute bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none z-10"
            style={{
              left: Math.max(10, Math.min(hoveredPoint.x - 60, width - 120)),
              top: Math.max(10, hoveredPoint.y - 50),
              transform: hoveredPoint.x < 60 ? 'none' : 'translateX(-50%)'
            }}
          >
            <div className="font-semibold">{hoveredPoint.team.team_name}</div>
            <div>{hoveredPoint.point.season}: {hoveredPoint.point.value.toFixed(type === 'points' ? 1 : 0)}{type === 'points' ? ' pts' : 'º'}</div>
          </div>
        )}
      </div>
    )
  }

  // Renderizar pestaña de Análisis de Equipos
  const renderAnalysisTab = () => {
    const analysisData = getAnalysisData()
    const positionData = getPositionAnalysisData()

    return (
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
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Seleccionar equipos para análisis:
              </label>
              <span className="text-sm text-gray-500">
                {selectedTeamsForAnalysis.length} equipos seleccionados
              </span>
            </div>
            
            {/* Barra de búsqueda */}
            <div className="mb-3">
              <input
                type="text"
                placeholder="Buscar equipos..."
                value={teamSearchTerm}
                onChange={(e) => setTeamSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Filtros de equipos */}
            <div className="mb-3 flex items-center space-x-4">
              <button
                onClick={() => setShowAllTeams(!showAllTeams)}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  showAllTeams
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                {showAllTeams ? 'Mostrar solo top 20' : 'Mostrar todos los equipos'}
              </button>
              <span className="text-sm text-gray-500">
                {rankingData?.length || 0} equipos disponibles
              </span>
            </div>
            
            {/* Lista de equipos */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {rankingData
                ?.filter(team => 
                  team.team_name.toLowerCase().includes(teamSearchTerm.toLowerCase()) ||
                  team.region_name?.toLowerCase().includes(teamSearchTerm.toLowerCase())
                )
                ?.slice(0, showAllTeams ? undefined : 20)
                ?.map((team) => (
                <label key={team.team_id} className="flex items-center space-x-2 text-sm hover:bg-gray-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={selectedTeamsForAnalysis.includes(team.team_id)}
                    onChange={(e) => handleTeamSelection(team.team_id, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <TeamLogo name={team.team_name} size="sm" />
                  <span className="truncate">{team.team_name}</span>
                </label>
              ))}
            </div>
            
            {/* Mensaje si no hay resultados */}
            {rankingData?.filter(team => 
              team.team_name.toLowerCase().includes(teamSearchTerm.toLowerCase()) ||
              team.region_name?.toLowerCase().includes(teamSearchTerm.toLowerCase())
            )?.length === 0 && teamSearchTerm && (
              <div className="text-center py-4 text-gray-500">
                No se encontraron equipos que coincidan con "{teamSearchTerm}"
              </div>
            )}
            {selectedTeamsForAnalysis.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedTeamsForAnalysis.map(teamId => {
                  const team = rankingData?.find(t => t.team_id === teamId)
                  return team ? (
                    <span key={teamId} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      <TeamLogo name={team.team_name} size="sm" />
                      <span className="ml-1">{team.team_name}</span>
                      <button
                        onClick={() => handleTeamSelection(teamId, false)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ) : null
                })}
              </div>
            )}
          </div>

          {/* Selector de vista */}
          {selectedTeamsForAnalysis.length > 0 && (
            <div className="mb-6">
              <div className="flex space-x-4">
                <button
                  onClick={() => setAnalysisView('points')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    analysisView === 'points'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  Evolución de Puntos
                </button>
                <button
                  onClick={() => setAnalysisView('positions')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    analysisView === 'positions'
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  Evolución de Posiciones
                </button>
              </div>
            </div>
          )}

          {/* Gráfica */}
          {selectedTeamsForAnalysis.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <LineChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Selecciona equipos para ver su comparación</p>
              <p className="text-sm text-gray-400 mt-2">Puedes seleccionar hasta 6 equipos para comparar</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Gráfica */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-900 mb-4">
                  {analysisView === 'points' ? 'Evolución de Puntos por Temporada' : 'Evolución de Posiciones por Temporada'}
                </h4>
                <SimpleChart 
                  data={analysisView === 'points' ? analysisData : positionData} 
                  type={analysisView} 
                />
              </div>

              {/* Leyenda */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-900 mb-3">Equipos seleccionados:</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {analysisData.map((team, index) => {
                    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899']
                    return (
                      <div key={team.team_id} className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: colors[index % colors.length] }}
                        />
                        <TeamLogo name={team.team_name} size="sm" />
                        <span className="text-sm text-gray-900">{team.team_name}</span>
                        <span className="text-xs text-gray-500">({team.region_name})</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Resumen estadístico */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-900 mb-3">Resumen estadístico:</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysisData.map(team => {
                    const totalPoints = team.data.reduce((sum, d) => sum + d.points, 0)
                    const avgPoints = totalPoints / team.data.length
                    const maxPoints = Math.max(...team.data.map(d => d.points))
                    const minPoints = Math.min(...team.data.map(d => d.points))
                    
                    return (
                      <div key={team.team_id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center mb-2">
                          <TeamLogo name={team.team_name} size="sm" />
                          <span className="ml-2 font-medium text-gray-900">{team.team_name}</span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Total: {totalPoints.toFixed(1)} pts</div>
                          <div>Promedio: {avgPoints.toFixed(1)} pts</div>
                          <div>Máximo: {maxPoints.toFixed(1)} pts</div>
                          <div>Mínimo: {minPoints.toFixed(1)} pts</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Renderizar pestaña de Top Performers
  const renderPerformersTab = () => {
    const seasonPerformers = getTopPerformersBySeason()
    const growthPerformers = getTopGrowthPerformers()
    const consistentPerformers = getMostConsistentPerformers()

    return (
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
              <button
                onClick={() => setPerformersTab('season')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  performersTab === 'season'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Mejores por Temporada
              </button>
              <button
                onClick={() => setPerformersTab('growth')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  performersTab === 'growth'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Mayor Crecimiento
              </button>
              <button
                onClick={() => setPerformersTab('consistent')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  performersTab === 'consistent'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Más Consistentes
              </button>
            </nav>
          </div>

          {/* Contenido según tab seleccionado */}
          {performersTab === 'season' && (
            <div className="space-y-6">
              <h4 className="text-md font-medium text-gray-900">Top 3 por Temporada</h4>
              {Object.entries(seasonPerformers).map(([season, performers]) => (
                <div key={season} className="bg-gray-50 rounded-lg p-4">
                  <h5 className="text-sm font-semibold text-gray-700 mb-3">{season}</h5>
                  <div className="space-y-2">
                    {performers.map((performer, index) => (
                      <div key={performer.team_id} className="flex items-center justify-between bg-white rounded-lg p-3">
                        <div className="flex items-center">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm mr-3">
                            {index + 1}
                          </div>
                          <TeamLogo name={performer.team_name} size="sm" />
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{performer.team_name}</div>
                            <div className="text-xs text-gray-500">{performer.region_name}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-gray-900">{performer.points.toFixed(1)} pts</div>
                          <div className="text-xs text-gray-500">({performer.weighted_points.toFixed(1)} ponderados)</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {performersTab === 'growth' && (
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">Top 10 Mayor Crecimiento Promedio</h4>
              <div className="space-y-2">
                {growthPerformers.map((performer, index) => (
                  <div key={performer.team_id} className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 font-semibold text-sm mr-3">
                        {index + 1}
                      </div>
                      <TeamLogo name={performer.team_name} size="sm" />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{performer.team_name}</div>
                        <div className="text-xs text-gray-500">{performer.region_name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-green-600">+{performer.avg_growth.toFixed(1)} pts/año</div>
                      <div className="text-xs text-gray-500">{performer.seasons_compared} temporadas</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {performersTab === 'consistent' && (
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">Top 10 Más Consistentes</h4>
              <p className="text-sm text-gray-600">Equipos con menor variabilidad en sus puntos (coeficiente de variación más bajo)</p>
              <div className="space-y-2">
                {consistentPerformers.map((performer, index) => {
                  if (!performer) return null
                  return (
                    <div key={performer.team_id} className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 font-semibold text-sm mr-3">
                          {index + 1}
                        </div>
                        <TeamLogo name={performer.team_name} size="sm" />
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{performer.team_name}</div>
                          <div className="text-xs text-gray-500">{performer.region_name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">{performer.avg_points.toFixed(1)} pts promedio</div>
                        <div className="text-xs text-gray-500">CV: {(performer.coefficient_variation * 100).toFixed(1)}%</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

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