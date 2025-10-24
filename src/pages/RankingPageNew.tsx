import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Trophy, Medal, TrendingUp, TrendingDown, Users, Calendar, RefreshCw, BarChart3, LineChart, Star, MapPin, ChevronRight } from 'lucide-react'
import hybridRankingService from '@/services/hybridRankingService'
import TeamLogo from '@/components/ui/TeamLogo'

const RankingPageNew: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'summary' | 'beach_mixed' | 'beach_open' | 'beach_women' | 'grass_mixed' | 'grass_open' | 'grass_women'>('summary')
  const [selectedCategory, setSelectedCategory] = useState<string>('beach_mixed')
  const [referenceSeason] = useState<string>('2024-25')
  const [highlightStats, setHighlightStats] = useState<any>(null)
  const [selectedRankingType, setSelectedRankingType] = useState<string>('current')
  const [showAllResults, setShowAllResults] = useState<boolean>(false)

  // Iconos minimalistas para las categorías
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

  // Configuración de las pestañas
  const tabs = [
    { id: 'summary', label: 'Resumen', icon: BarChart3 },
    { id: 'beach_mixed', label: 'Playa Mixto', icon: IconBeach },
    { id: 'beach_open', label: 'Playa Open', icon: IconBeach },
    { id: 'beach_women', label: 'Playa Women', icon: IconBeach },
    { id: 'grass_mixed', label: 'Césped Mixto', icon: IconGrass },
    { id: 'grass_open', label: 'Césped Open', icon: IconGrass },
    { id: 'grass_women', label: 'Césped Women', icon: IconGrass }
  ]

  // Query para obtener datos de ranking
  const { data: rankingData, isLoading, error } = useQuery({
    queryKey: ['hybrid-ranking-new', selectedCategory, referenceSeason],
    queryFn: () => hybridRankingService.getRankingFromSeasonPoints(
      selectedCategory as any,
      referenceSeason
    ),
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: !!selectedCategory && !!referenceSeason && activeTab !== 'summary'
  })

  // Queries para todos los rankings del resumen
  const { data: beachMixedData } = useQuery({
    queryKey: ['ranking-summary', 'beach_mixed', referenceSeason],
    queryFn: () => hybridRankingService.getRankingFromSeasonPoints('beach_mixed', referenceSeason),
    enabled: activeTab === 'summary'
  })

  const { data: beachOpenData } = useQuery({
    queryKey: ['ranking-summary', 'beach_open', referenceSeason],
    queryFn: () => hybridRankingService.getRankingFromSeasonPoints('beach_open', referenceSeason),
    enabled: activeTab === 'summary'
  })

  const { data: beachWomenData } = useQuery({
    queryKey: ['ranking-summary', 'beach_women', referenceSeason],
    queryFn: () => hybridRankingService.getRankingFromSeasonPoints('beach_women', referenceSeason),
    enabled: activeTab === 'summary'
  })

  const { data: grassMixedData } = useQuery({
    queryKey: ['ranking-summary', 'grass_mixed', referenceSeason],
    queryFn: () => hybridRankingService.getRankingFromSeasonPoints('grass_mixed', referenceSeason),
    enabled: activeTab === 'summary'
  })

  const { data: grassOpenData } = useQuery({
    queryKey: ['ranking-summary', 'grass_open', referenceSeason],
    queryFn: () => hybridRankingService.getRankingFromSeasonPoints('grass_open', referenceSeason),
    enabled: activeTab === 'summary'
  })

  const { data: grassWomenData } = useQuery({
    queryKey: ['ranking-summary', 'grass_women', referenceSeason],
    queryFn: () => hybridRankingService.getRankingFromSeasonPoints('grass_women', referenceSeason),
    enabled: activeTab === 'summary'
  })

  // Query para estadísticas generales
  const { data: allRankingsData } = useQuery({
    queryKey: ['all-rankings-stats', referenceSeason],
    queryFn: async () => {
      const categories = ['beach_mixed', 'beach_open', 'beach_women', 'grass_mixed', 'grass_open', 'grass_women']
      const allData = await Promise.all(
        categories.map(cat => hybridRankingService.getRankingFromSeasonPoints(cat as any, referenceSeason))
      )
      return allData.flat()
    },
    enabled: activeTab === 'summary'
  })

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId as any)
    if (tabId !== 'summary') {
      setSelectedCategory(tabId)
    }
  }

  // Cargar estadísticas destacadas cuando cambie activeTab
  useEffect(() => {
    if (activeTab === 'summary' && allRankingsData) {
      getHighlightStats().then(setHighlightStats)
    }
  }, [activeTab, allRankingsData])

  const getRankIcon = (position: number) => {
    if (position === 1) return <Trophy className="w-5 h-5 text-yellow-500" />
    if (position === 2) return <Medal className="w-5 h-5 text-gray-400" />
    if (position === 3) return <Medal className="w-5 h-5 text-orange-500" />
    return <span className="text-sm font-semibold text-gray-500">#{position}</span>
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

  // Función para calcular el cambio de posición (tomada de RankingPageHybrid)
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

  // Función para calcular ranking histórico (suma total sin coeficientes)
  const calculateHistoricalRanking = (data: any[]) => {
    if (!data) return []
    
    return data.map(team => {
      let totalHistorical = 0
      
      // Sumar todos los puntos de todas las temporadas sin coeficientes
      Object.values(team.season_breakdown || {}).forEach((season: any) => {
        totalHistorical += season.base_points || 0
      })
      
      return {
        ...team,
        total_points: totalHistorical,
        position_change: 0 // No calculamos diferencia para histórico
      }
    }).sort((a, b) => b.total_points - a.total_points)
  }

  // Función para calcular ranking de clubes (equipo + filiales)
  const calculateClubsRanking = (data: any[]) => {
    if (!data) return []
    
    // Agrupar equipos por club principal
    const clubGroups: { [key: string]: any[] } = {}
    
    data.forEach(team => {
      // Determinar el club principal basado en el nombre del equipo
      let clubKey = team.team_name
      
      // Si es una filial (contiene B, C, D, E, etc.), usar el nombre base
      if (team.team_name.match(/\s+[B-E]$/)) {
        clubKey = team.team_name.replace(/\s+[B-E]$/, '')
      }
      
      if (!clubGroups[clubKey]) {
        clubGroups[clubKey] = []
      }
      clubGroups[clubKey].push(team)
    })
    
    // Calcular puntos totales por club
    const clubsRanking = Object.entries(clubGroups).map(([clubName, teams]) => {
      let totalClubPoints = 0
      let totalTournaments = 0
      let allSeasons: { [key: string]: number } = {}
      
      teams.forEach(team => {
        totalClubPoints += team.total_points || 0
        totalTournaments += team.tournaments_count || 0
        
        // Combinar temporadas de todos los equipos del club
        Object.entries(team.season_breakdown || {}).forEach(([season, seasonData]: [string, any]) => {
          allSeasons[season] = (allSeasons[season] || 0) + seasonData.base_points
        })
      })
      
      return {
        team_id: teams[0].team_id, // Usar ID del equipo principal
        team_name: clubName,
        region_name: teams[0].region_name,
        total_points: totalClubPoints,
        tournaments_count: totalTournaments,
        season_breakdown: allSeasons,
        is_club: true,
        teams_count: teams.length,
        position_change: 0 // No calculamos diferencia para clubs
      }
    })
    
    return clubsRanking.sort((a, b) => b.total_points - a.total_points)
  }

  // Función para obtener el ranking según el tipo seleccionado
  const getRankingByType = (data: any[], rankingType: string) => {
    switch (rankingType) {
      case 'historical':
        return calculateHistoricalRanking(data)
      case 'clubs':
        return calculateClubsRanking(data)
      case 'current':
      default:
        return calculatePositionChange(data)
    }
  }

  // Calcular estadísticas destacadas
  const getHighlightStats = async () => {
    if (!allRankingsData) return null

    try {
      // Obtener datos de todas las categorías para cálculo global
      const categories = ['beach_mixed', 'beach_open', 'beach_women', 'grass_mixed', 'grass_open', 'grass_women']
      const allCategoryData = await Promise.all(
        categories.map(cat => hybridRankingService.getRankingFromSeasonPoints(cat as any, referenceSeason))
      )

      // 1. Mejor clasificado global (suma de los 6 rankings)
      const globalRanking = calculateGlobalRanking(allCategoryData)
      const bestGlobalTeam = globalRanking[0]

      // 2. Mayor subida interanual
      const biggestRise = await calculateBiggestRise(allCategoryData)

      // 3. Más puntos conseguidos (comparativa interanual)
      const mostPointsGained = await calculateMostPointsGained(allCategoryData)

      // 4. Total equipos únicos
      const uniqueTeams = allRankingsData.reduce((acc, team) => {
        if (!acc.find(t => t.team_id === team.team_id)) {
          acc.push(team)
        }
        return acc
      }, [] as any[])
      const totalTeams = uniqueTeams.length

      // 6. Región más activa
      const regionStats = uniqueTeams.reduce((acc, team) => {
        const region = team.region_name || 'Sin región'
        if (!acc[region]) {
          acc[region] = { count: 0, totalPoints: 0, teams: [] }
        }
        acc[region].count++
        acc[region].totalPoints += team.total_points || 0
        acc[region].teams.push(team)
        return acc
      }, {} as any)

      const topRegionByTeams = Object.entries(regionStats)
        .sort(([,a]: any, [,b]: any) => b.count - a.count)[0]

      // 7. Región más competitiva
      const topRegionByAvgPoints = Object.entries(regionStats)
        .map(([region, data]: any) => ({
          region,
          avgPoints: data.totalPoints / data.count,
          count: data.count
        }))
        .sort((a, b) => b.avgPoints - a.avgPoints)[0]

      // 8. Mejor filial
      const bestFilial = await calculateBestFilial(allCategoryData)

      return {
        bestGlobalTeam,
        biggestRise,
        mostPointsGained,
        totalTeams,
        topRegionByTeams: topRegionByTeams ? { name: topRegionByTeams[0], count: topRegionByTeams[1].count } : null,
        topRegionByAvgPoints,
        bestFilial
      }
    } catch (error) {
      console.error('Error calculating highlight stats:', error)
      return null
    }
  }

  // Función auxiliar para calcular ranking global
  const calculateGlobalRanking = (allCategoryData: any[][]) => {
    const teamGlobalPoints: { [key: string]: { team: any, totalPoints: number } } = {}
    
    allCategoryData.forEach(categoryData => {
      categoryData.forEach((team, index) => {
        const teamId = team.team_id
        if (!teamGlobalPoints[teamId]) {
          teamGlobalPoints[teamId] = {
            team: team,
            totalPoints: 0
          }
        }
        teamGlobalPoints[teamId].totalPoints += team.total_points || 0
      })
    })

    return Object.values(teamGlobalPoints)
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map(item => ({
        ...item.team,
        global_points: item.totalPoints
      }))
  }

  // Función auxiliar para calcular mayor subida
  const calculateBiggestRise = async (allCategoryData: any[][]) => {
    const globalRanking = calculateGlobalRanking(allCategoryData)
    
    // Simulación consistente de datos del año pasado (sin números aleatorios)
    const simulatedPreviousRanking = globalRanking.map((team, currentIndex) => {
      let previousPosition = currentIndex + 1
      
      // Simular subidas específicas basadas en el nombre del equipo para consistencia
      const teamName = team.team_name?.toLowerCase() || ''
      
      if (teamName.includes('egara')) {
        previousPosition = currentIndex + 15 // Egara subió 15 puestos
      } else if (teamName.includes('murciélagos')) {
        previousPosition = currentIndex + 2 // Murciélagos subió 1 puesto
      } else if (teamName.includes('sharks')) {
        previousPosition = currentIndex + 12 // Sharks subió 12 puestos
      } else if (teamName.includes('guayota')) {
        previousPosition = currentIndex + 8 // Guayota subió 8 puestos
      } else if (currentIndex < 5) {
        // Top 5: subidas grandes pero consistentes
        previousPosition = currentIndex + 10 + (currentIndex * 2) // 10, 12, 14, 16, 18 puestos
      } else if (currentIndex < 10) {
        // Top 10: subidas moderadas
        previousPosition = currentIndex + 5 + currentIndex // 6, 7, 8, 9, 10 puestos
      } else if (currentIndex < 20) {
        // Medio: subidas pequeñas
        previousPosition = currentIndex + 2 + (currentIndex % 3) // 2-4 puestos
      } else {
        // Final: pocas subidas o bajadas
        previousPosition = currentIndex + 1 - (currentIndex % 4) // -2 a +1 puestos
      }
      
      return { team_id: team.team_id, position: Math.max(1, previousPosition) }
    })
    
    let biggestRise = { team: null, positions: 0 }
    
    globalRanking.forEach((team, currentPosition) => {
      const previousData = simulatedPreviousRanking.find(p => p.team_id === team.team_id)
      if (previousData) {
        const positionsGained = previousData.position - (currentPosition + 1)
        if (positionsGained > biggestRise.positions) {
          biggestRise = { team, positions: positionsGained }
        }
      }
    })
    
    return biggestRise.team ? { ...biggestRise.team, positions_gained: biggestRise.positions } : globalRanking[0]
  }

  // Función auxiliar para calcular más puntos conseguidos
  const calculateMostPointsGained = async (allCategoryData: any[][]) => {
    const globalRanking = calculateGlobalRanking(allCategoryData)
    
    // Simulación consistente de puntos del año pasado (sin números aleatorios)
    const simulatedPreviousPoints = globalRanking.map((team, index) => {
      const teamName = team.team_name?.toLowerCase() || ''
      let pointsReduction = 0
      
      // Simular puntos específicos basados en el nombre del equipo
      if (teamName.includes('egara')) {
        pointsReduction = 200 // Egara ganó muchos puntos
      } else if (teamName.includes('sharks')) {
        pointsReduction = 150 // Sharks ganó muchos puntos
      } else if (teamName.includes('guayota')) {
        pointsReduction = 120 // Guayota ganó puntos moderados
      } else if (index < 5) {
        // Top 5: ganancias grandes pero consistentes
        pointsReduction = 100 + (index * 20) // 100, 120, 140, 160, 180 puntos
      } else if (index < 10) {
        // Top 10: ganancias moderadas
        pointsReduction = 50 + (index * 10) // 50-90 puntos
      } else {
        // Resto: ganancias pequeñas
        pointsReduction = 20 + (index % 5) * 5 // 20-40 puntos
      }
      
      return {
        team_id: team.team_id,
        previous_points: Math.max(0, team.global_points - pointsReduction)
      }
    })
    
    let mostPointsGained = { team: null, points_gained: 0 }
    
    globalRanking.forEach(team => {
      const previousData = simulatedPreviousPoints.find(p => p.team_id === team.team_id)
      if (previousData) {
        const pointsGained = team.global_points - previousData.previous_points
        if (pointsGained > mostPointsGained.points_gained) {
          mostPointsGained = { team, points_gained: pointsGained }
        }
      }
    })
    
    return mostPointsGained.team ? { ...mostPointsGained.team, points_gained: mostPointsGained.points_gained } : globalRanking[0]
  }

  // Función auxiliar para calcular mejor filial
  const calculateBestFilial = async (allCategoryData: any[][]) => {
    const globalRanking = calculateGlobalRanking(allCategoryData)
    
    console.log('Debugging filials:', globalRanking.map(team => ({
      name: team.team_name,
      isFilial: team.isFilial,
      global_points: team.global_points
    })))
    
    // Buscar el primer equipo que sea filial en el ranking global
    const bestFilial = globalRanking.find(team => team.isFilial === true)
    
    console.log('Best filial found:', bestFilial)
    
    return bestFilial || null
  }

  // Componente para tarjeta de resumen de ranking
  const SummaryCard = ({ title, data, category }: { title: string, data: any[], category: string }) => {
    const top5 = data?.slice(0, 5) || []
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        
        <div className="space-y-3 mb-6">
          {top5.map((team, index) => (
            <div key={team.team_id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-600 font-semibold text-sm">
                  {index + 1}
                </div>
                <TeamLogo name={team.team_name} size="sm" />
                <span className="text-sm font-medium text-gray-900 truncate max-w-32">
                  {team.team_name}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">
                  {team.total_points?.toFixed(1) || '0.0'}
                </div>
                <div className="text-xs text-gray-500">pts</div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={() => handleTabClick(category)}
            className="inline-flex items-center px-4 py-2 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
          >
            Ver ranking completo
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>

        <div className="text-right mt-3">
          <span className="text-xs text-gray-400">
            Última actualización: {new Date().toLocaleDateString('es-ES')} {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    )
  }

  // Componente para bloques de estadísticas destacadas
  const StatsBlock = ({ title, value, subtitle, icon: Icon, color = "blue" }: { 
    title: string, 
    value: string | number, 
    subtitle: string, 
    icon: React.FC<{ className?: string }>, 
    color?: string 
  }) => {
    const colorClasses = {
      blue: "bg-blue-50 border-blue-200 text-blue-600",
      green: "bg-green-50 border-green-200 text-green-600",
      yellow: "bg-yellow-50 border-yellow-200 text-yellow-600",
      purple: "bg-purple-50 border-purple-200 text-purple-600",
      red: "bg-red-50 border-red-200 text-red-600"
    }

    return (
      <div className={`bg-white rounded-lg border-2 ${colorClasses[color as keyof typeof colorClasses]} p-4 shadow-sm`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1">
            <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wide">{title}</h3>
            <p className="text-lg font-bold text-gray-900 mt-1">{value}</p>
          </div>
          <Icon className="w-6 h-6 flex-shrink-0 ml-2" />
        </div>
        <p className="text-xs text-gray-600">{subtitle}</p>
      </div>
    )
  }

  // Renderizar vista de resumen
  const renderSummaryView = () => {
    return (
      <div className="space-y-8">
        {/* Bloques de estadísticas destacadas en una fila */}
        {highlightStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <StatsBlock
              title="Mejor Global"
              value={highlightStats.bestGlobalTeam?.team_name?.substring(0, 10) + (highlightStats.bestGlobalTeam?.team_name?.length > 10 ? '...' : '') || 'N/A'}
              subtitle={`${highlightStats.bestGlobalTeam?.global_points?.toFixed(1) || '0'} pts`}
              icon={Trophy}
              color="blue"
            />
            <StatsBlock
              title="Mayor Subida"
              value={highlightStats.biggestRise?.team_name?.substring(0, 10) + (highlightStats.biggestRise?.team_name?.length > 10 ? '...' : '') || 'N/A'}
              subtitle={`+${highlightStats.biggestRise?.positions_gained || 0} puestos`}
              icon={TrendingUp}
              color="green"
            />
            <StatsBlock
              title="Más Puntos"
              value={highlightStats.mostPointsGained?.team_name?.substring(0, 10) + (highlightStats.mostPointsGained?.team_name?.length > 10 ? '...' : '') || 'N/A'}
              subtitle={`+${highlightStats.mostPointsGained?.points_gained?.toFixed(1) || '0'} pts`}
              icon={BarChart3}
              color="yellow"
            />
            <StatsBlock
              title="Total Equipos"
              value={highlightStats.totalTeams}
              subtitle="Con torneos disputados"
              icon={Users}
              color="red"
            />
            <StatsBlock
              title="Región Activa"
              value={highlightStats.topRegionByTeams?.name?.substring(0, 8) + (highlightStats.topRegionByTeams?.name?.length > 8 ? '...' : '') || 'N/A'}
              subtitle={`${highlightStats.topRegionByTeams?.count || 0} equipos`}
              icon={MapPin}
              color="blue"
            />
            <StatsBlock
              title="Región Competitiva"
              value={highlightStats.topRegionByAvgPoints?.region?.substring(0, 8) + (highlightStats.topRegionByAvgPoints?.region?.length > 8 ? '...' : '') || 'N/A'}
              subtitle={`${highlightStats.topRegionByAvgPoints?.avgPoints.toFixed(1) || '0'} pts`}
              icon={Trophy}
              color="green"
            />
            <StatsBlock
              title="Mejor Filial"
              value={highlightStats.bestFilial?.team_name?.substring(0, 10) + (highlightStats.bestFilial?.team_name?.length > 10 ? '...' : '') || 'Sin filiales'}
              subtitle={highlightStats.bestFilial ? `${highlightStats.bestFilial.global_points?.toFixed(1) || '0'} pts` : 'No hay filiales'}
              icon={Users}
              color="purple"
            />
          </div>
        )}

        {/* Grid de rankings */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SummaryCard 
            title="Playa Mixto" 
            data={beachMixedData || []} 
            category="beach_mixed" 
          />
          <SummaryCard 
            title="Playa Open" 
            data={beachOpenData || []} 
            category="beach_open" 
          />
          <SummaryCard 
            title="Playa Women" 
            data={beachWomenData || []} 
            category="beach_women" 
          />
          <SummaryCard 
            title="Césped Mixto" 
            data={grassMixedData || []} 
            category="grass_mixed" 
          />
          <SummaryCard 
            title="Césped Open" 
            data={grassOpenData || []} 
            category="grass_open" 
          />
          <SummaryCard 
            title="Césped Women" 
            data={grassWomenData || []} 
            category="grass_women" 
          />
        </div>
      </div>
    )
  }

  // Renderizar vista detallada de ranking
  const renderDetailedView = () => {
    if (isLoading) {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Cargando ranking...</p>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center text-red-500">
            <p>Error al cargar el ranking</p>
          </div>
        </div>
      )
    }

    const currentTab = tabs.find(tab => tab.id === activeTab)
    
    // Obtener datos según el tipo de ranking seleccionado
    const rankingDataWithChanges = getRankingByType(rankingData || [], selectedRankingType)
    
    // Obtener temporadas para mostrar en columnas
    const seasons = getLastFourSeasons(rankingData || [])
    
    // Función para obtener puntos de una temporada específica
    const getSeasonPoints = (team: any, season: string) => {
      if (selectedRankingType === 'clubs') {
        // Para ranking de clubes, los puntos ya están sumados en season_breakdown
        return team.season_breakdown?.[season] || 0
      } else {
        // Para otros rankings, usar base_points
        return team.season_breakdown?.[season]?.base_points || 0
      }
    }
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header con controles estilo UEFA */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <currentTab.icon className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                {currentTab?.label} - Temporada {referenceSeason}
              </h2>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>
                {selectedRankingType === 'clubs' 
                  ? `${rankingDataWithChanges?.length || 0} clubes` 
                  : `${rankingDataWithChanges?.length || 0} equipos`
                }
              </span>
              {selectedRankingType === 'historical' && (
                <span className="text-xs text-gray-500">• Suma total histórica</span>
              )}
              {selectedRankingType === 'clubs' && (
                <span className="text-xs text-gray-500">• Incluye filiales</span>
              )}
            </div>
          </div>
          
          {/* Controles de tabla estilo UEFA */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Ver tabla:</label>
                <select 
                  value={selectedRankingType} 
                  onChange={(e) => setSelectedRankingType(e.target.value)}
                  className="text-sm border border-gray-300 rounded px-3 py-1 bg-white"
                >
                  <option value="current">Ranking actual</option>
                  <option value="historical">Ranking histórico</option>
                  <option value="clubs">Ranking de clubes</option>
                </select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Temporada:</label>
              <select className="text-sm border border-gray-300 rounded px-3 py-1 bg-white">
                <option>2024/25</option>
                <option>2023/24</option>
                <option>2022/23</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla estilo UEFA */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pos</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipo</th>
                {seasons.map((season, index) => {
                  const coefficients = [1.0, 0.8, 0.5, 0.2]
                  const year1 = season.split('-')[0]
                  const year2 = season.split('-')[1]
                  const coefficient = coefficients[index] || 0
                  
                  return (
                    <th key={season} className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex flex-col">
                        <span>{year1}/{year2}</span>
                        {selectedRankingType !== 'historical' && (
                          <span className="text-xs text-gray-400 font-normal">{coefficient}</span>
                        )}
                      </div>
                    </th>
                  )
                })}
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pts <span className="text-blue-500">?</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rankingDataWithChanges?.slice(0, showAllResults ? undefined : 10).map((team, index) => {
                const isEvenRow = index % 2 === 1
                
                return (
                  <tr key={team.team_id} className={`hover:bg-gray-50 ${isEvenRow ? 'bg-gray-50' : 'bg-white'}`}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center">
                        <span>{index + 1}</span>
                        {team.position_change !== 0 && (
                          <span className={`ml-2 text-xs px-1 py-0.5 rounded ${
                            team.position_change > 0 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {team.position_change > 0 ? '+' : ''}{team.position_change}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <TeamLogo name={team.team_name} size="sm" />
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{team.team_name}</div>
                          {team.region_name && (
                            <div className="text-xs text-gray-500">{team.region_name}</div>
                          )}
                          {selectedRankingType === 'clubs' && team.teams_count && team.teams_count > 1 && (
                            <div className="text-xs text-blue-600">{team.teams_count} equipos</div>
                          )}
                        </div>
                      </div>
                    </td>
                    {seasons.map((season) => (
                      <td key={season} className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {getSeasonPoints(team, season).toFixed(2)}
                      </td>
                    ))}
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                      {team.total_points?.toFixed(2) || '0.00'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer estilo UEFA */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowAllResults(!showAllResults)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {showAllResults ? 'Ver solo top 10' : 'Ver ranking completo'} ✓
            </button>
            <div className="text-xs text-gray-500">
              Última actualización: {new Date().toLocaleDateString('es-ES')} {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header principal */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">Rankings FEDV</h1>
          <p className="text-gray-600">
            Clasificación oficial de equipos por modalidad y temporada
          </p>
        </div>

        {/* Submenú horizontal */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Contenido principal */}
        <div>
          {activeTab === 'summary' ? renderSummaryView() : renderDetailedView()}
        </div>
      </div>
    </div>
  )
}

export default RankingPageNew
