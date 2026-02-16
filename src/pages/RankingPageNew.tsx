import React, { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { Trophy, Medal, TrendingUp, TrendingDown, Users, Calendar, RefreshCw, BarChart3, LineChart, Star, MapPin, ChevronRight, Info } from 'lucide-react'
import hybridRankingService from '@/services/hybridRankingService'
import { supabase } from '@/services/supabaseService'
import TeamLogo from '@/components/ui/TeamLogo'
import GeneralRankingChart from '@/components/charts/GeneralRankingChart'
import dynamicRankingService from '@/services/dynamicRankingService'
import teamSeasonRankingsService from '@/services/teamSeasonRankingsService'
import { useMostRecentSeasons } from '@/hooks/useMostRecentSeasons'

interface SimpleChartProps {
  data: any[]
  type: 'points' | 'positions'
  hoveredPoint: { team: any, point: any, x: number, y: number } | null
  setHoveredPoint: (point: { team: any, point: any, x: number, y: number } | null) => void
}

const SimpleChart: React.FC<SimpleChartProps> = ({ data, type, hoveredPoint, setHoveredPoint }) => {
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

const VALID_CATEGORY_TABS = ['beach_mixed', 'beach_open', 'beach_women', 'grass_mixed', 'grass_open', 'grass_women'] as const

const RankingPageNew: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<'summary' | 'general' | 'beach_mixed' | 'beach_open' | 'beach_women' | 'grass_mixed' | 'grass_open' | 'grass_women'>('summary')
  // Nota: selectedSurface almacena superficies (beach_mixed, etc.)
  const [selectedSurface, setSelectedSurface] = useState<string>('beach_mixed')
  // highlightStats ahora viene de una query cacheada más abajo
  const [selectedRankingType, setSelectedRankingType] = useState<string>('current')
  const [showAllResults, setShowAllResults] = useState<boolean>(false)
  // Durante la animación de colapsar mantenemos todas las filas renderizadas para que se vea la transición
  const [isCollapsing, setIsCollapsing] = useState<boolean>(false)
  const [selectedTeamsForAnalysis, setSelectedTeamsForAnalysis] = useState<string[]>([])
  const [analysisView, setAnalysisView] = useState<'points' | 'positions'>('points')
  const [hoveredPoint, setHoveredPoint] = useState<{team: any, point: any, x: number, y: number} | null>(null)
  const [teamSearchTerm, setTeamSearchTerm] = useState<string>('')
  const [showAllTeams, setShowAllTeams] = useState<boolean>(false)
  const [detailedViewMode, setDetailedViewMode] = useState<'ranking' | 'historical' | 'clubs' | 'analysis' | 'advanced'>('ranking')
  const [selectedSeasonForDetailedView, setSelectedSeasonForDetailedView] = useState<string | null>(null)
  // categoryHighlightStats ahora viene de una query cacheada más abajo

  // Al cargar o al cambiar la URL, si viene ?category=... desde la homepage, abrir esa pestaña
  useEffect(() => {
    const category = searchParams.get('category')
    if (category && VALID_CATEGORY_TABS.includes(category as typeof VALID_CATEGORY_TABS[number])) {
      setActiveTab(category as typeof activeTab)
      setSelectedSurface(category)
      setDetailedViewMode('ranking')
    }
  }, [searchParams])

  // Obtener la temporada más reciente dinámicamente (para ranking general)
  const { data: referenceSeason, isLoading: isLoadingSeason } = useQuery({
    queryKey: ['most-recent-season'],
    queryFn: () => hybridRankingService.getMostRecentSeason(),
    staleTime: 10 * 60 * 1000, // 10 minutos
    retry: 2
  })

  // Obtener todas las temporadas más recientes con una sola query (optimizado)
  const { 
    seasons: mostRecentSeasons, 
    isLoading: isLoadingSeasons,
    getSeasonForCategory 
  } = useMostRecentSeasons()
  
  // Extraer temporadas individuales del hook consolidado
  const beachMixedSeason = mostRecentSeasons.beach_mixed
  const beachOpenSeason = mostRecentSeasons.beach_open
  const beachWomenSeason = mostRecentSeasons.beach_women
  const grassMixedSeason = mostRecentSeasons.grass_mixed
  const grassOpenSeason = mostRecentSeasons.grass_open
  const grassWomenSeason = mostRecentSeasons.grass_women

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

  // Configuración de las pestañas: Mixto, Women, Open (primero playa, luego césped)
  const tabs = [
    { id: 'summary', label: 'Resumen', icon: BarChart3 },
    { id: 'general', label: 'Ranking General', icon: LineChart },
    { id: 'beach_mixed', label: 'Playa Mixto', icon: IconBeach },
    { id: 'beach_women', label: 'Playa Women', icon: IconBeach },
    { id: 'beach_open', label: 'Playa Open', icon: IconBeach },
    { id: 'grass_mixed', label: 'Césped Mixto', icon: IconGrass },
    { id: 'grass_women', label: 'Césped Women', icon: IconGrass },
    { id: 'grass_open', label: 'Césped Open', icon: IconGrass }
  ]

  // Función auxiliar para determinar la subtemporada más reciente disponible para una temporada
  const getMostRecentSubupdate = async (season: string): Promise<number> => {
    try {
      if (!supabase) return 4 // Por defecto, usar subupdate 4 (final de temporada)

      // Verificar qué subtemporadas tienen datos, empezando por la más reciente (4)
      for (let subupdate = 4; subupdate >= 1; subupdate--) {
        const { data, error } = await supabase
          .from('team_season_rankings')
          .select('team_id')
          .eq('season', season)
          .not(`subupdate_${subupdate}_global_rank`, 'is', null)
          .limit(1)

        if (!error && data && data.length > 0) {
          return subupdate
        }
      }

      return 4 // Si no hay datos, usar subupdate 4 por defecto
    } catch (error) {
      console.error('Error determinando subtemporada más reciente:', error)
      return 4
    }
  }

  // Query optimizada para ranking general (usa datos pre-calculados con position_change)
  const { data: generalRankingData, isLoading: isLoadingGeneral } = useQuery({
    queryKey: ['general-ranking-optimized', referenceSeason],
    queryFn: async () => {
      if (!referenceSeason) {
        throw new Error('Temporada de referencia no disponible')
      }

      try {
        // Usar servicio optimizado que incluye position_change pre-calculado
        const optimizedData = await teamSeasonRankingsService.getGlobalRankingWithPositionChanges(referenceSeason)
        
        if (optimizedData && optimizedData.length > 0) {
          // Obtener TODAS las temporadas disponibles para estos equipos (no solo las últimas 4)
          // Esto permite que el ranking histórico muestre todas las temporadas registradas
          const surfaces = ['beach_mixed', 'beach_open', 'beach_women', 'grass_mixed', 'grass_open', 'grass_women']
          const { data: seasonPointsData } = await supabase
            .from('team_season_points')
            .select(`team_id, season, ${surfaces.map(s => `${s}_points`).join(', ')}`)
            .in('team_id', optimizedData.map(d => d.team_id))
            .order('season', { ascending: false })

          // Construir season_breakdown para cada equipo (suma de todas las categorías)
          // Obtener temporadas de referencia para calcular coeficientes
          const referenceYear = parseInt(referenceSeason.split('-')[0])
          const referenceSeasons = [
            referenceSeason,
            `${referenceYear - 1}-${String(referenceYear).slice(-2)}`,
            `${referenceYear - 2}-${String(referenceYear - 1).slice(-2)}`,
            `${referenceYear - 3}-${String(referenceYear - 2).slice(-2)}`
          ]
          
          const seasonBreakdownMap: { [teamId: string]: { [season: string]: { base_points: number, weighted_points: number, coefficient: number } } } = {}
          
          seasonPointsData?.forEach((row: any) => {
            const teamId = row.team_id
            const season = row.season
            
            // Sumar puntos de todas las categorías
            let totalBasePoints = 0
            surfaces.forEach(surface => {
              totalBasePoints += row[`${surface}_points`] || 0
            })
            
            if (totalBasePoints <= 0) return
            
            if (!seasonBreakdownMap[teamId]) {
              seasonBreakdownMap[teamId] = {}
            }
            
            // Calcular coeficiente solo si la temporada está en las últimas 4 de referencia
            // Para temporadas más antiguas, el coeficiente será 0 (no se aplica en ranking actual)
            const refIndex = referenceSeasons.indexOf(season)
            const coefficient = refIndex >= 0 ? [1.0, 0.8, 0.5, 0.2][refIndex] : 0
            const weightedPoints = totalBasePoints * coefficient
            
            seasonBreakdownMap[teamId][season] = {
              base_points: totalBasePoints,
              weighted_points: weightedPoints,
              coefficient
            }
          })
          
          // Transformar al formato esperado
          return optimizedData.map(item => ({
            team_id: item.team_id,
            team_name: item.team_name,
            region_name: item.region_name,
            logo: item.logo,
            total_points: item.points,
            ranking_position: item.rank,
            position_change: item.position_change,
            points_change: item.points_change,
            season_breakdown: seasonBreakdownMap[item.team_id] || {}
          }))
        }
      } catch (error) {
        console.warn('Error obteniendo datos optimizados del ranking general, usando fallback:', error)
      }
      
      // Fallback: usar método anterior que incluye season_breakdown completo
      const fallbackData = await hybridRankingService.getCombinedRanking(
        ['beach_mixed', 'beach_open', 'beach_women', 'grass_mixed', 'grass_open', 'grass_women'],
        referenceSeason
      )
      const withChanges = await calculatePositionChange(fallbackData, undefined, referenceSeason)
      return await enrichRankingDataWithLogos(withChanges)
    },
    staleTime: 10 * 60 * 1000, // 10 minutos - datos pre-calculados
    enabled: activeTab === 'general' && !!referenceSeason && !isLoadingSeason
  })

  // Obtener temporada más reciente para la categoría seleccionada (usa el hook consolidado)
  const selectedCategorySeason = useMemo(() => {
    if (!selectedSurface || activeTab === 'summary' || activeTab === 'general') {
      return null
    }
    return getSeasonForCategory(selectedSurface)
  }, [selectedSurface, activeTab, mostRecentSeasons])

  // Determinar qué temporada usar: la seleccionada manualmente o la más reciente por defecto
  const seasonToUse = useMemo(() => {
    // Si hay una temporada seleccionada manualmente en la vista detallada, usarla
    // Esto solo aplica cuando estamos en la vista detallada (no en summary o general)
    if (activeTab !== 'summary' && activeTab !== 'general' && selectedSeasonForDetailedView) {
      return selectedSeasonForDetailedView
    }
    // Si no, usar la temporada más reciente para la categoría
    return selectedCategorySeason
  }, [selectedSeasonForDetailedView, selectedCategorySeason, activeTab])

  // Query para obtener datos de ranking por categoría
  // Query optimizada: usa datos pre-calculados con position_change incluido
  const { data: rankingData, isLoading, error } = useQuery({
    queryKey: ['ranking-optimized', selectedSurface, seasonToUse],
    queryFn: async () => {
      if (!seasonToUse || !selectedSurface) {
        throw new Error('Temporada o categoría no disponible')
      }
      
      try {
        // Intentar usar datos pre-calculados (incluye position_change y logo)
        // Usar la temporada seleccionada (puede ser la más reciente o una anterior)
        const optimizedData = await teamSeasonRankingsService.getRankingWithPositionChanges(
          seasonToUse,
          selectedSurface as any
        )
        
        // Si hay datos optimizados, necesitamos obtener el season_breakdown desde team_season_points
        if (optimizedData && optimizedData.length > 0) {
          // Obtener TODAS las temporadas disponibles para estos equipos (no solo las últimas 4)
          // Esto permite que el ranking histórico muestre todas las temporadas registradas
          const { data: seasonPointsData } = await supabase
            .from('team_season_points')
            .select(`team_id, season, ${selectedSurface}_points`)
            .in('team_id', optimizedData.map(d => d.team_id))
            .gt(`${selectedSurface}_points`, 0)
            .order('season', { ascending: false })

          // Construir season_breakdown para cada equipo
          // Primero, obtener todas las temporadas únicas ordenadas (más reciente primero)
          const allSeasonsSet = new Set<string>()
          seasonPointsData?.forEach((row: any) => {
            allSeasonsSet.add(row.season)
          })
          const allSeasonsSorted = Array.from(allSeasonsSet).sort((a, b) => {
            const yearA = parseInt(a.split('-')[0])
            const yearB = parseInt(b.split('-')[0])
            return yearB - yearA // Más reciente primero
          })
          
          // Obtener la temporada de referencia para calcular coeficientes
          // Usar la temporada seleccionada (puede ser la más reciente o una anterior)
          const referenceYear = parseInt(seasonToUse.split('-')[0])
          const referenceSeasons = [
            seasonToUse,
            `${referenceYear - 1}-${String(referenceYear).slice(-2)}`,
            `${referenceYear - 2}-${String(referenceYear - 1).slice(-2)}`,
            `${referenceYear - 3}-${String(referenceYear - 2).slice(-2)}`
          ]
          
          const seasonBreakdownMap: { [teamId: string]: { [season: string]: { base_points: number, weighted_points: number, coefficient: number } } } = {}
          
          seasonPointsData?.forEach((row: any) => {
            const teamId = row.team_id
            const season = row.season
            const basePoints = row[`${selectedSurface}_points`] || 0
            
            if (basePoints <= 0) return
            
            if (!seasonBreakdownMap[teamId]) {
              seasonBreakdownMap[teamId] = {}
            }
            
            // Calcular coeficiente solo si la temporada está en las últimas 4 de referencia
            // Para temporadas más antiguas, el coeficiente será 0 (no se aplica en ranking actual)
            const refIndex = referenceSeasons.indexOf(season)
            const coefficient = refIndex >= 0 ? [1.0, 0.8, 0.5, 0.2][refIndex] : 0
            const weightedPoints = basePoints * coefficient
            
            seasonBreakdownMap[teamId][season] = {
              base_points: basePoints,
              weighted_points: weightedPoints,
              coefficient
            }
          })
          
          // Transformar al formato esperado por el componente
          return optimizedData.map(item => ({
            team_id: item.team_id,
            team_name: item.team_name,
            region_name: item.region_name,
            logo: item.logo,
            total_points: item.points,
            ranking_position: item.rank,
            position_change: item.position_change,
            points_change: item.points_change,
            season_breakdown: seasonBreakdownMap[item.team_id] || {}
          }))
        }
      } catch (error) {
        console.warn('Error obteniendo datos optimizados, usando fallback:', error)
      }
      
      // Fallback: usar método anterior que incluye season_breakdown completo
      const fallbackData = await hybridRankingService.getRankingFromSeasonPoints(
        selectedSurface as any,
        seasonToUse
      )
      
      // Enriquecer con logos y calcular position_change
      const enrichedData = await enrichRankingDataWithLogos(fallbackData)
      const withChanges = await calculatePositionChange(enrichedData, selectedSurface as any, seasonToUse)
      
      return withChanges
    },
    staleTime: 10 * 60 * 1000, // 10 minutos - datos pre-calculados cambian poco
    enabled: !!selectedSurface && !!seasonToUse && activeTab !== 'summary' && activeTab !== 'general'
  })

  // Función helper para enriquecer datos con logos
  const enrichRankingDataWithLogos = async (rankingData: any[]) => {
    if (!rankingData || rankingData.length === 0) return rankingData
    if (!supabase) return rankingData
    
    const teamIds = rankingData.map(team => team.team_id)
    
    const { data: teamsData } = await supabase
      .from('teams')
      .select('id, logo')
      .in('id', teamIds)
    
    const logoMap = new Map(teamsData?.map(team => [team.id, team.logo]) || [])
    
    return rankingData.map(team => ({
      ...team,
      logo: logoMap.get(team.team_id) || null
    }))
  }

  // Helper para transformar datos pre-calculados al formato del componente
  const transformRankingData = (data: any[]) => data.map(item => ({
    team_id: item.team_id,
    team_name: item.team_name,
    region_name: item.region_name,
    logo: item.logo,
    total_points: item.points,
    ranking_position: item.rank,
    position_change: item.position_change,
    points_change: item.points_change
  }))

  // Queries optimizadas para el resumen (datos pre-calculados)
  const { data: beachMixedData } = useQuery({
    queryKey: ['ranking-optimized-summary', 'beach_mixed', beachMixedSeason],
    queryFn: async () => {
      if (!beachMixedSeason) throw new Error('Temporada no disponible')
      const data = await teamSeasonRankingsService.getRankingWithPositionChanges(beachMixedSeason, 'beach_mixed')
      return transformRankingData(data)
    },
    staleTime: 10 * 60 * 1000,
    enabled: activeTab === 'summary' && !!beachMixedSeason
  })

  const { data: beachOpenData } = useQuery({
    queryKey: ['ranking-optimized-summary', 'beach_open', beachOpenSeason],
    queryFn: async () => {
      if (!beachOpenSeason) throw new Error('Temporada no disponible')
      const data = await teamSeasonRankingsService.getRankingWithPositionChanges(beachOpenSeason, 'beach_open')
      return transformRankingData(data)
    },
    staleTime: 10 * 60 * 1000,
    enabled: activeTab === 'summary' && !!beachOpenSeason
  })

  const { data: beachWomenData } = useQuery({
    queryKey: ['ranking-optimized-summary', 'beach_women', beachWomenSeason],
    queryFn: async () => {
      if (!beachWomenSeason) throw new Error('Temporada no disponible')
      const data = await teamSeasonRankingsService.getRankingWithPositionChanges(beachWomenSeason, 'beach_women')
      return transformRankingData(data)
    },
    staleTime: 10 * 60 * 1000,
    enabled: activeTab === 'summary' && !!beachWomenSeason
  })

  const { data: grassMixedData } = useQuery({
    queryKey: ['ranking-optimized-summary', 'grass_mixed', grassMixedSeason],
    queryFn: async () => {
      if (!grassMixedSeason) throw new Error('Temporada no disponible')
      const data = await teamSeasonRankingsService.getRankingWithPositionChanges(grassMixedSeason, 'grass_mixed')
      return transformRankingData(data)
    },
    staleTime: 10 * 60 * 1000,
    enabled: activeTab === 'summary' && !!grassMixedSeason
  })

  const { data: grassOpenData } = useQuery({
    queryKey: ['ranking-optimized-summary', 'grass_open', grassOpenSeason],
    queryFn: async () => {
      if (!grassOpenSeason) throw new Error('Temporada no disponible')
      const data = await teamSeasonRankingsService.getRankingWithPositionChanges(grassOpenSeason, 'grass_open')
      return transformRankingData(data)
    },
    staleTime: 10 * 60 * 1000,
    enabled: activeTab === 'summary' && !!grassOpenSeason
  })

  const { data: grassWomenData } = useQuery({
    queryKey: ['ranking-optimized-summary', 'grass_women', grassWomenSeason],
    queryFn: async () => {
      if (!grassWomenSeason) throw new Error('Temporada no disponible')
      const data = await teamSeasonRankingsService.getRankingWithPositionChanges(grassWomenSeason, 'grass_women')
      return transformRankingData(data)
    },
    staleTime: 10 * 60 * 1000,
    enabled: activeTab === 'summary' && !!grassWomenSeason
  })

  // Query para estadísticas generales (usa temporadas más recientes por categoría)
  const { data: allRankingsData } = useQuery({
    queryKey: ['all-rankings-stats', beachMixedSeason, beachOpenSeason, beachWomenSeason, grassMixedSeason, grassOpenSeason, grassWomenSeason],
    queryFn: async () => {
      if (!beachMixedSeason || !beachOpenSeason || !beachWomenSeason || !grassMixedSeason || !grassOpenSeason || !grassWomenSeason) {
        throw new Error('Temporadas no disponibles')
      }
      const categories = ['beach_mixed', 'beach_open', 'beach_women', 'grass_mixed', 'grass_open', 'grass_women']
      const seasons = [beachMixedSeason, beachOpenSeason, beachWomenSeason, grassMixedSeason, grassOpenSeason, grassWomenSeason]
      const allData = await Promise.all(
        categories.map((cat, index) => hybridRankingService.getRankingFromSeasonPoints(cat as any, seasons[index]))
      )
      return allData.flat()
    },
    enabled: activeTab === 'summary' && !!referenceSeason && !isLoadingSeason
  })

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId as any)
    if (tabId !== 'summary') {
      if (tabId !== 'general') {
      setSelectedSurface(tabId)
      }
      setDetailedViewMode('ranking') // Resetear a vista de ranking al cambiar de pestaña
    }
  }

  // Query cacheada para estadísticas destacadas del resumen
  const { data: highlightStatsQuery } = useQuery({
    queryKey: ['highlight-stats-summary', referenceSeason, beachMixedSeason, beachOpenSeason, beachWomenSeason, grassMixedSeason, grassOpenSeason, grassWomenSeason],
    queryFn: () => getHighlightStats(),
    staleTime: 15 * 60 * 1000, // 15 minutos - estadísticas cambian poco
    enabled: activeTab === 'summary' && !!allRankingsData && !!referenceSeason
  })
  
  // Usar datos de la query o null
  const highlightStats = highlightStatsQuery || null

  // Estado para estadísticas destacadas del ranking general
  const [generalHighlightStats, setGeneralHighlightStats] = useState<any>(null)

  // Estados para datos con position_change calculado (para histórico y clubes)
  const [generalRankingWithChanges, setGeneralRankingWithChanges] = useState<any[] | null>(null)
  const [categoryRankingWithChanges, setCategoryRankingWithChanges] = useState<any[] | null>(null)

  // Query cacheada para estadísticas de categoría
  const { data: categoryHighlightStatsQuery } = useQuery({
    queryKey: ['highlight-stats-category', activeTab, selectedCategorySeason],
    queryFn: () => getCategoryHighlightStats(activeTab, rankingData!, selectedCategorySeason!),
    staleTime: 15 * 60 * 1000, // 15 minutos
    enabled: activeTab !== 'summary' && activeTab !== 'general' && !!rankingData && !!selectedCategorySeason
  })
  
  const categoryHighlightStats = categoryHighlightStatsQuery || null

  // Calcular estadísticas destacadas del ranking general
  useEffect(() => {
    if (activeTab === 'general' && generalRankingData) {
      getGeneralHighlightStats(generalRankingData).then(setGeneralHighlightStats)
    } else {
      setGeneralHighlightStats(null)
    }
  }, [activeTab, generalRankingData, referenceSeason])

  // Calcular position_change para ranking general cuando es histórico o clubes
  useEffect(() => {
    if (activeTab === 'general' && generalRankingData) {
      const rankingTypeToUse = detailedViewMode === 'historical' ? 'historical' : 
                               detailedViewMode === 'clubs' ? 'clubs' : 'current'
      
      if (rankingTypeToUse === 'current') {
        setGeneralRankingWithChanges(null) // No necesario, los datos ya tienen position_change
      } else {
        const baseRankingData = getRankingByType(generalRankingData, rankingTypeToUse)
        if (baseRankingData.length > 0 && referenceSeason) {
          const calculateChanges = rankingTypeToUse === 'historical' 
            ? calculateHistoricalPositionChange(baseRankingData, referenceSeason)
            : calculateClubsPositionChange(baseRankingData, referenceSeason)
          
          calculateChanges.then(result => {
            setGeneralRankingWithChanges(result)
          }).catch(() => {
            setGeneralRankingWithChanges(null)
          })
        } else {
          setGeneralRankingWithChanges(null)
        }
      }
    } else {
      setGeneralRankingWithChanges(null)
    }
  }, [activeTab, generalRankingData, detailedViewMode, referenceSeason])

  // Calcular position_change para ranking de categoría cuando es histórico o clubes
  useEffect(() => {
    if (activeTab !== 'summary' && activeTab !== 'general' && rankingData) {
      const rankingTypeToUse = detailedViewMode === 'historical' ? 'historical' : 
                               detailedViewMode === 'clubs' ? 'clubs' : 'current'
      
      if (rankingTypeToUse === 'current') {
        setCategoryRankingWithChanges(null) // No necesario, los datos ya tienen position_change
      } else {
        const baseRankingData = getRankingByType(rankingData, rankingTypeToUse)
        const allSeasons = getAllAvailableSeasons(rankingData)
        const currentReferenceSeason = selectedSeasonForDetailedView || referenceSeason || allSeasons[0]
        
        if (baseRankingData.length > 0 && currentReferenceSeason) {
          const calculateChanges = rankingTypeToUse === 'historical' 
            ? calculateHistoricalPositionChange(baseRankingData, currentReferenceSeason, selectedSurface)
            : calculateClubsPositionChange(baseRankingData, currentReferenceSeason, selectedSurface)
          
          calculateChanges.then(result => {
            setCategoryRankingWithChanges(result)
          }).catch(() => {
            setCategoryRankingWithChanges(null)
          })
        } else {
          setCategoryRankingWithChanges(null)
        }
      }
    } else {
      setCategoryRankingWithChanges(null)
    }
  }, [activeTab, rankingData, detailedViewMode, selectedSeasonForDetailedView, referenceSeason, selectedSurface])

  const getRankIcon = (position: number) => {
    if (position === 1) return <Trophy className="w-6 h-6 text-yellow-500" />
    if (position === 2) return <Medal className="w-6 h-6 text-gray-400" />
    if (position === 3) return <Medal className="w-6 h-6 text-orange-500" />
    return <span className="text-sm font-semibold text-gray-500">#{position}</span>
  }

  // Obtener las últimas 4 temporadas ordenadas (más reciente primero)
  // Si se proporciona referenceSeason, devuelve esa temporada y las 3 anteriores (más antiguas)
  const getLastFourSeasons = (data: any[], referenceSeason?: string | null) => {
    if (!data || data.length === 0) return []
    
    // Obtener todas las temporadas únicas de todos los equipos
    const seasonsSet = new Set<string>()
    data.forEach(team => {
      Object.keys(team?.season_breakdown || {}).forEach(season => {
        seasonsSet.add(season)
      })
    })
    
    const sortedSeasons = Array.from(seasonsSet)
      .sort((a, b) => {
        const yearA = parseInt(a.split('-')[0])
        const yearB = parseInt(b.split('-')[0])
        return yearB - yearA // Más reciente primero
      })
    
    // Si hay una temporada de referencia, usar esa y las 3 anteriores (más antiguas)
    // Las temporadas están ordenadas de más reciente a más antigua
    // Si seleccionamos 2023-24 (índice 1), queremos: [2023-24, 2022-23, 2021-22, 2020-21]
    // Eso es slice(1, 5) = índices [1, 2, 3, 4]
    if (referenceSeason && sortedSeasons.includes(referenceSeason)) {
      const refIndex = sortedSeasons.indexOf(referenceSeason)
      // Tomar desde refIndex hasta refIndex + 4 (hasta 4 temporadas incluyendo la seleccionada)
      // Esto nos da la temporada seleccionada y las 3 siguientes (más antiguas)
      return sortedSeasons.slice(refIndex, refIndex + 4)
    }
    
    // Si no hay referencia, usar las últimas 4
    return sortedSeasons.slice(0, 4)
  }
  
  // Obtener todas las temporadas disponibles de los datos
  const getAllAvailableSeasons = (data: any[]) => {
    if (!data || data.length === 0) return []
    
    const seasonsSet = new Set<string>()
    data.forEach(team => {
      Object.keys(team?.season_breakdown || {}).forEach(season => {
        seasonsSet.add(season)
      })
    })
    
    return Array.from(seasonsSet)
      .sort((a, b) => {
        const yearA = parseInt(a.split('-')[0])
        const yearB = parseInt(b.split('-')[0])
        return yearB - yearA // Más reciente primero
      })
  }

  // Función para calcular el cambio de posición usando team_season_rankings
  const calculatePositionChange = async (data: any[], category?: string, referenceSeason?: string) => {
    if (!data || data.length === 0) return []
    if (!referenceSeason) return data // Si no hay temporada de referencia, no calculamos cambios
    
    // Calcular ranking actual (con las últimas 4 temporadas)
    const currentRanking = [...data].sort((a, b) => b.total_points - a.total_points)
    
    // Obtener ranking de la temporada anterior desde team_season_rankings
    let previousRanking: any[] = []
    
    if (category) {
      // Para rankings por categoría
      previousRanking = await getPreviousSeasonCategoryRanking(category, referenceSeason) || []
    } else {
      // Para ranking general
      previousRanking = await getPreviousSeasonGlobalRanking(referenceSeason) || []
    }
    
    // Si no hay datos de la temporada anterior, retornar datos sin cambios
    if (!previousRanking || previousRanking.length === 0) {
      return currentRanking.map(team => ({
        ...team,
        position_change: 0,
        logo: team.logo || null
      }))
    }
    
    // Crear un mapa de posiciones anteriores
    const previousPositionsMap = new Map(
      previousRanking.map((team, index) => [team.team_id, team.ranking_position || index + 1])
    )
    
    // Agregar cambio de posición a cada equipo
    return currentRanking.map((team, index) => {
      const currentPosition = index + 1
      const previousPosition = previousPositionsMap.get(team.team_id)
      
      // Si el equipo no estaba en la temporada anterior, no hay cambio
      const positionChange = previousPosition !== undefined 
        ? previousPosition - currentPosition // Positivo si subió, negativo si bajó
        : 0
      
      return {
        ...team,
        position_change: positionChange,
        logo: team.logo || null // Preservar logo
      }
    })
  }

  // Función para calcular ranking histórico (suma total sin coeficientes)
  // Memoizar cálculos de rankings para evitar recálculos innecesarios
  const historicalRankingCache = useMemo(() => {
    if (!rankingData) return null
    return rankingData.map(team => {
      let totalHistorical = 0
      
      // Sumar todos los puntos de todas las temporadas sin coeficientes
      Object.values(team.season_breakdown || {}).forEach((season: any) => {
        totalHistorical += season.base_points || 0
      })
      
      return {
        ...team,
        total_points: totalHistorical,
        position_change: 0, // No calculamos diferencia para histórico
        logo: team.logo || null
      }
    }).sort((a, b) => b.total_points - a.total_points)
  }, [rankingData])

  // Función auxiliar para calcular position_change en ranking histórico
  const calculateHistoricalPositionChange = async (currentHistoricalData: any[], referenceSeason: string, category?: string) => {
    if (!currentHistoricalData || currentHistoricalData.length === 0) return currentHistoricalData
    if (!referenceSeason) return currentHistoricalData

    try {
      // Obtener datos de la temporada anterior
      let previousSeasonData: any[] = []
      
      if (category) {
        previousSeasonData = await getPreviousSeasonCategoryRanking(category, referenceSeason) || []
      } else {
        previousSeasonData = await getPreviousSeasonGlobalRanking(referenceSeason) || []
      }

      if (!previousSeasonData || previousSeasonData.length === 0) {
        return currentHistoricalData.map(team => ({
          ...team,
          position_change: 0
        }))
      }

      // Calcular ranking histórico de la temporada anterior (suma de todos los puntos hasta esa temporada)
      // Necesitamos obtener los datos completos con season_breakdown para calcular el histórico
      // Por ahora, usamos los datos de team_season_rankings que ya tienen el histórico calculado
      // O calculamos sumando todos los puntos base de season_breakdown si está disponible
      const previousHistoricalRanking = previousSeasonData.map(team => {
        let totalHistorical = 0
        // Si tiene season_breakdown, sumar todos los base_points
        if (team.season_breakdown) {
          Object.values(team.season_breakdown).forEach((season: any) => {
            totalHistorical += season.base_points || 0
          })
        } else {
          // Si no, usar total_points como aproximación (aunque incluye coeficientes)
          totalHistorical = team.total_points || 0
        }
        return {
          ...team,
          total_points: totalHistorical
        }
      }).sort((a, b) => b.total_points - a.total_points)

      // Crear mapa de posiciones anteriores
      const previousPositionsMap = new Map(
        previousHistoricalRanking.map((team, index) => [team.team_id, index + 1])
      )

      // Calcular position_change
      return currentHistoricalData.map((team, index) => {
        const currentPosition = index + 1
        const previousPosition = previousPositionsMap.get(team.team_id)
        const positionChange = previousPosition !== undefined 
          ? previousPosition - currentPosition 
          : 0

        return {
          ...team,
          position_change: positionChange
        }
      })
    } catch (error) {
      console.error('Error calculando position_change histórico:', error)
      return currentHistoricalData.map(team => ({
        ...team,
        position_change: 0
      }))
    }
  }

  const calculateHistoricalRanking = (data: any[]) => {
    if (!data) return []
    
    // Si tenemos datos en cache y son los mismos, usar cache
    if (historicalRankingCache && data === rankingData) {
      return historicalRankingCache
    }
    
    // Calcular en tiempo real si no hay cache
    return data.map(team => {
      let totalHistorical = 0
      
      Object.values(team.season_breakdown || {}).forEach((season: any) => {
        totalHistorical += season.base_points || 0
      })
      
      return {
        ...team,
        total_points: totalHistorical,
        position_change: 0, // Se calculará después con calculateHistoricalPositionChange
        logo: team.logo || null
      }
    }).sort((a, b) => b.total_points - a.total_points)
  }

  // Cache para ranking de clubes
  const clubsRankingCache = useMemo(() => {
    if (!rankingData) return null
    
    const clubGroups: { [key: string]: any[] } = {}
    
    rankingData.forEach(team => {
      let clubKey = team.team_name
      if (team.team_name.match(/\s+[B-E]$/)) {
        clubKey = team.team_name.replace(/\s+[B-E]$/, '')
      }
      
      if (!clubGroups[clubKey]) {
        clubGroups[clubKey] = []
      }
      clubGroups[clubKey].push(team)
    })
    
    return Object.entries(clubGroups).map(([clubName, teams]) => {
      let totalClubPoints = 0
      let totalTournaments = 0
      let allSeasons: { [key: string]: number } = {}
      
      const sortedTeams = teams.sort((a, b) => {
        const aIsFilial = a.team_name.match(/\s+[B-E]$/)
        const bIsFilial = b.team_name.match(/\s+[B-E]$/)
        if (!aIsFilial && bIsFilial) return -1
        if (aIsFilial && !bIsFilial) return 1
        return 0
      })
      
      sortedTeams.forEach(team => {
        totalClubPoints += team.total_points || 0
        totalTournaments += team.tournaments_count || 0
        
        Object.entries(team.season_breakdown || {}).forEach(([season, seasonData]: [string, any]) => {
          allSeasons[season] = (allSeasons[season] || 0) + seasonData.base_points
        })
      })
      
      const mainTeam = sortedTeams[0]
      
      return {
        team_id: mainTeam.team_id,
        team_name: clubName,
        region_name: mainTeam.region_name,
        logo: mainTeam.logo || null,
        total_points: totalClubPoints,
        tournaments_count: totalTournaments,
        season_breakdown: allSeasons,
        is_club: true,
        teams_count: sortedTeams.length,
        position_change: 0
      }
    }).sort((a, b) => b.total_points - a.total_points)
  }, [rankingData])

  // Función auxiliar para calcular position_change en ranking de clubes
  const calculateClubsPositionChange = async (currentClubsData: any[], referenceSeason: string, category?: string) => {
    if (!currentClubsData || currentClubsData.length === 0) return currentClubsData
    if (!referenceSeason) return currentClubsData

    try {
      // Obtener datos de la temporada anterior
      let previousSeasonData: any[] = []
      
      if (category) {
        previousSeasonData = await getPreviousSeasonCategoryRanking(category, referenceSeason) || []
      } else {
        previousSeasonData = await getPreviousSeasonGlobalRanking(referenceSeason) || []
      }

      if (!previousSeasonData || previousSeasonData.length === 0) {
        return currentClubsData.map(club => ({
          ...club,
          position_change: 0
        }))
      }

      // Calcular ranking de clubes de la temporada anterior
      const previousClubGroups: { [key: string]: any[] } = {}
      
      previousSeasonData.forEach(team => {
        let clubKey = team.team_name
        if (team.team_name.match(/\s+[B-E]$/)) {
          clubKey = team.team_name.replace(/\s+[B-E]$/, '')
        }
        
        if (!previousClubGroups[clubKey]) {
          previousClubGroups[clubKey] = []
        }
        previousClubGroups[clubKey].push(team)
      })

      const previousClubsRanking = Object.entries(previousClubGroups).map(([clubName, teams]) => {
        let totalClubPoints = 0
        
        teams.forEach(team => {
          totalClubPoints += team.total_points || 0
        })
        
        return {
          team_id: teams[0]?.team_id,
          team_name: clubName,
          total_points: totalClubPoints
        }
      }).sort((a, b) => b.total_points - a.total_points)

      // Crear mapa de posiciones anteriores (usando team_name como clave para clubes)
      const previousPositionsMap = new Map(
        previousClubsRanking.map((club, index) => [club.team_name, index + 1])
      )

      // Calcular position_change
      return currentClubsData.map((club, index) => {
        const currentPosition = index + 1
        const previousPosition = previousPositionsMap.get(club.team_name)
        const positionChange = previousPosition !== undefined 
          ? previousPosition - currentPosition 
          : 0

        return {
          ...club,
          position_change: positionChange
        }
      })
    } catch (error) {
      console.error('Error calculando position_change de clubes:', error)
      return currentClubsData.map(club => ({
        ...club,
        position_change: 0
      }))
    }
  }

  // Función para calcular ranking de clubes (optimizada con cache)
  const calculateClubsRanking = (data: any[]) => {
    if (!data) return []
    
    // Si tenemos datos en cache y son los mismos, usar cache
    if (clubsRankingCache && data === rankingData) {
      return clubsRankingCache
    }
    
    // Calcular en tiempo real si no hay cache
    const clubGroups: { [key: string]: any[] } = {}
    
    data.forEach(team => {
      let clubKey = team.team_name
      if (team.team_name.match(/\s+[B-E]$/)) {
        clubKey = team.team_name.replace(/\s+[B-E]$/, '')
      }
      
      if (!clubGroups[clubKey]) {
        clubGroups[clubKey] = []
      }
      clubGroups[clubKey].push(team)
    })
    
    return Object.entries(clubGroups).map(([clubName, teams]) => {
      let totalClubPoints = 0
      let totalTournaments = 0
      let allSeasons: { [key: string]: number } = {}
      
      const sortedTeams = teams.sort((a, b) => {
        const aIsFilial = a.team_name.match(/\s+[B-E]$/)
        const bIsFilial = b.team_name.match(/\s+[B-E]$/)
        if (!aIsFilial && bIsFilial) return -1
        if (aIsFilial && !bIsFilial) return 1
        return 0
      })
      
      sortedTeams.forEach(team => {
        totalClubPoints += team.total_points || 0
        totalTournaments += team.tournaments_count || 0
        
        Object.entries(team.season_breakdown || {}).forEach(([season, seasonData]: [string, any]) => {
          allSeasons[season] = (allSeasons[season] || 0) + seasonData.base_points
        })
      })
      
      const mainTeam = sortedTeams[0]
      
      return {
        team_id: mainTeam.team_id,
        team_name: clubName,
        region_name: mainTeam.region_name,
        logo: mainTeam.logo || null,
        total_points: totalClubPoints,
        tournaments_count: totalTournaments,
        season_breakdown: allSeasons,
        is_club: true,
        teams_count: sortedTeams.length,
        position_change: 0 // Se calculará después con calculateClubsPositionChange
      }
    }).sort((a, b) => b.total_points - a.total_points)
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
        // Para 'current', los datos ya vienen con position_change calculado desde la query
        return data
    }
  }

  // Funciones para análisis de equipos
  const handleTeamSelection = (teamId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedTeamsForAnalysis(prev => [...prev, teamId])
    } else {
      setSelectedTeamsForAnalysis(prev => prev.filter(id => id !== teamId))
    }
  }

  // Query optimizada para datos de análisis (usa team_season_rankings)
  const { data: optimizedAnalysisData } = useQuery({
    queryKey: ['optimized-analysis-data', selectedSurface, selectedCategorySeason, selectedTeamsForAnalysis],
    queryFn: async () => {
      if (!selectedSurface || !selectedCategorySeason || selectedTeamsForAnalysis.length === 0) {
        return null
      }

      // Obtener historial de rankings para cada equipo seleccionado
      const historyPromises = selectedTeamsForAnalysis.map(async (teamId) => {
        const history = await teamSeasonRankingsService.getTeamRankingHistory(
          teamId,
          selectedSurface as any
        )
        return { teamId, history }
      })

      const histories = await Promise.all(historyPromises)

      // Obtener nombres de equipos
      const teamIds = selectedTeamsForAnalysis
      const { data: teamsData } = await supabase
        .from('teams')
        .select('id, name, region:regions(name)')
        .in('id', teamIds)

      const teamsMap = new Map(teamsData?.map(t => [t.id, t]) || [])

      return histories.map(({ teamId, history }) => {
        const team = teamsMap.get(teamId)
        return {
          team_id: teamId,
          team_name: team?.name || 'Equipo desconocido',
          region_name: team?.region?.name || 'Sin región',
          data: history.map(h => ({
            season: h.season,
            points: h.points,
            position: h.rank
          }))
        }
      })
    },
    enabled: !!selectedSurface && !!selectedCategorySeason && selectedTeamsForAnalysis.length > 0,
    staleTime: 10 * 60 * 1000
  })

  // Query optimizada para datos de análisis del ranking general
  const { data: optimizedGeneralAnalysisData } = useQuery({
    queryKey: ['optimized-general-analysis-data', referenceSeason, selectedTeamsForAnalysis],
    queryFn: async () => {
      if (!referenceSeason || selectedTeamsForAnalysis.length === 0) {
        return null
      }

      // Obtener historial de ranking global para cada equipo seleccionado
      const historyPromises = selectedTeamsForAnalysis.map(async (teamId) => {
        const history = await teamSeasonRankingsService.getTeamGlobalRankingHistory(teamId)
        return { teamId, history }
      })

      const histories = await Promise.all(historyPromises)

      // Obtener nombres de equipos
      const { data: teamsData } = await supabase
        .from('teams')
        .select('id, name, region:regions(name)')
        .in('id', selectedTeamsForAnalysis)

      const teamsMap = new Map(teamsData?.map(t => [t.id, t]) || [])

      return histories.map(({ teamId, history }) => {
        const team = teamsMap.get(teamId)
        return {
          team_id: teamId,
          team_name: team?.name || 'Equipo desconocido',
          region_name: team?.region?.name || 'Sin región',
          data: history.map(h => ({
            season: h.season,
            points: h.points,
            position: h.rank
          }))
        }
      })
    },
    enabled: !!referenceSeason && selectedTeamsForAnalysis.length > 0,
    staleTime: 10 * 60 * 1000
  })

  const getAnalysisData = () => {
    // Usar datos optimizados si están disponibles
    if (optimizedAnalysisData) {
      return optimizedAnalysisData.map(team => ({
        ...team,
        data: team.data.map((d: any) => ({
          season: d.season,
          points: d.points,
          weighted_points: d.points, // Ya incluye coeficientes
          coefficient: 1 // Ya aplicado
        }))
      }))
    }

    // Fallback al método anterior
    if (!rankingData || selectedTeamsForAnalysis.length === 0) return [];

    const selectedTeamsData = rankingData.filter(team => 
      selectedTeamsForAnalysis.includes(team.team_id)
    );

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

  // Funciones auxiliares para análisis del ranking general (optimizadas)
  const getAnalysisDataForGeneral = (dataSource: any[]) => {
    // Usar datos optimizados si están disponibles
    if (optimizedGeneralAnalysisData) {
      return optimizedGeneralAnalysisData.map(team => ({
        ...team,
        data: team.data.map((d: any) => ({
          season: d.season,
          points: d.points
        })).filter((d: any) => d.points > 0)
      }))
    }

    // Fallback al método anterior
    const selectedTeamsData = dataSource.filter(team => 
      selectedTeamsForAnalysis.includes(team.team_id)
    )

    const seasons = getLastFourSeasons(dataSource)
    const analysisData: { [season: string]: { [teamId: string]: number } } = {}

    seasons.forEach(season => {
      analysisData[season] = {}
      dataSource.forEach(team => {
        const points = team.season_breakdown?.[season]?.base_points || 0
        analysisData[season][team.team_id] = points
      })
    })

    return selectedTeamsData.map(team => {
      const data = seasons.map(season => ({
        season,
        points: analysisData[season]?.[team.team_id] || 0
      })).filter(item => item.points > 0)

      return {
        team_id: team.team_id,
        team_name: team.team_name,
        region_name: team.region_name,
        data
      }
    })
  }

  const getPositionAnalysisDataForGeneral = (dataSource: any[]) => {
    // Usar datos optimizados si están disponibles
    if (optimizedGeneralAnalysisData) {
      return optimizedGeneralAnalysisData.map(team => ({
        ...team,
        data: team.data.map((d: any) => ({
          season: d.season,
          position: d.position
        })).filter((d: any) => d.position !== null)
      }))
    }

    // Fallback al método anterior (calcula posiciones en tiempo real)
    const selectedTeamsData = dataSource.filter(team => 
      selectedTeamsForAnalysis.includes(team.team_id)
    )

    const seasons = getLastFourSeasons(dataSource)
    const positionData: { [season: string]: { [teamId: string]: number } } = {}

    seasons.forEach(season => {
      const seasonRanking = [...dataSource].sort((a, b) => {
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

  const getPositionAnalysisData = () => {
    // Usar datos optimizados si están disponibles
    if (optimizedAnalysisData) {
      return optimizedAnalysisData.map(team => ({
        ...team,
        data: team.data.map((d: any) => ({
          season: d.season,
          position: d.position
        })).filter((d: any) => d.position !== null)
      }))
    }

    // Fallback al método anterior (calcula posiciones en tiempo real)
    if (!rankingData || selectedTeamsForAnalysis.length === 0) return [];

    const selectedTeamsData = rankingData.filter(team => 
      selectedTeamsForAnalysis.includes(team.team_id)
    );

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

  // Query para estadísticas destacadas
  const { data: stats } = useQuery({
    queryKey: ['ranking-stats', selectedSurface, rankingData],
    queryFn: async () => {
      if (!rankingData) return null;
      
      const totalTeams = rankingData.length
      const avgPoints = rankingData.length > 0 
        ? rankingData.reduce((sum, team) => sum + team.total_points, 0) / rankingData.length 
        : 0

      // Equipos nuevos: equipos que solo tienen puntos en la temporada actual
      const newTeams = rankingData.filter(team => {
        const seasons = Object.keys(team.season_breakdown || {})
        return seasons.length === 1 && seasons.includes(referenceSeason || '')
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

      // Actividad: promedio de temporadas activas por equipo
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
    enabled: !!rankingData && activeTab !== 'summary' && activeTab !== 'general'
  })

  // Query para estadísticas del ranking general
  const { data: generalStats } = useQuery({
    queryKey: ['general-ranking-stats', generalRankingData],
    queryFn: async () => {
      if (!generalRankingData) return null;
      
      const rankingDataWithChanges = getRankingByType(generalRankingData || [], 'current')
      const totalTeams = rankingDataWithChanges.length
      const avgPoints = rankingDataWithChanges.length > 0 
        ? rankingDataWithChanges.reduce((sum, team) => sum + (team.total_points || 0), 0) / rankingDataWithChanges.length 
        : 0

      // Equipos nuevos: equipos que solo tienen puntos en la temporada actual
      const newTeams = rankingDataWithChanges.filter(team => {
        const seasons = Object.keys(team.season_breakdown || {})
        return seasons.length === 1 && seasons.includes(referenceSeason || '')
      }).length

      // Consistencia: equipos que han mantenido posiciones altas (top 10) en múltiples temporadas
      const consistentTeams = rankingDataWithChanges.filter(team => {
        const seasons = Object.keys(team.season_breakdown || {})
        if (seasons.length < 2) return false
        
        // Verificar si ha estado en top 10 en al menos 2 temporadas
        const top10Seasons = seasons.filter(season => {
          const seasonPoints = team.season_breakdown?.[season]?.base_points || 0
          // Calcular posición aproximada basada en puntos (simplificado)
          const teamsWithMorePoints = rankingDataWithChanges.filter(t => 
            (t.season_breakdown?.[season]?.base_points || 0) > seasonPoints
          ).length
          return teamsWithMorePoints < 10
        })
        return top10Seasons.length >= 2
      }).length

      // Actividad: promedio de temporadas activas por equipo
      const totalSeasons = rankingDataWithChanges.reduce((sum, team) => {
        return sum + Object.keys(team.season_breakdown || {}).length
      }, 0)
      const avgActivity = totalTeams > 0 ? totalSeasons / totalTeams : 0

      return {
        total_teams: totalTeams,
        avg_points: avgPoints,
        new_teams: newTeams,
        consistent_teams: consistentTeams,
        avg_activity: avgActivity
      }
    },
    enabled: !!generalRankingData && activeTab === 'general'
  })

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
      const biggestRise = await calculateBiggestRise(allCategoryData, referenceSeason)

      // 3. Más puntos conseguidos (comparativa interanual)
      const mostPointsGained = await calculateMostPointsGained(allCategoryData, referenceSeason)

      // 4. Total equipos únicos
      const uniqueTeams = allRankingsData.reduce((acc, team) => {
        if (!acc.find(t => t.team_id === team.team_id)) {
          acc.push(team)
        }
        return acc
      }, [] as any[])
      const totalTeams = uniqueTeams.length

      // 6. Mejor filial
      const bestFilial = await calculateBestFilial(allCategoryData)

      // 7. Mejor histórico (más puntos acumulados sin coeficientes)
      const bestHistorical = await calculateBestHistorical()

      // Obtener logos de los equipos destacados
      const teamIdsToFetch = [
        bestGlobalTeam?.team_id,
        biggestRise?.team_id,
        mostPointsGained?.team_id,
        bestFilial?.team_id,
        bestHistorical?.team_id
      ].filter(Boolean) as string[]

      let logosMap = new Map<string, string | null>()
      if (teamIdsToFetch.length > 0 && supabase) {
        const { data: teamsData } = await supabase
          .from('teams')
          .select('id, logo')
          .in('id', teamIdsToFetch)
        
        logosMap = new Map(teamsData?.map(team => [team.id, team.logo]) || [])
      }

      return {
        bestGlobalTeam: bestGlobalTeam ? {
          ...bestGlobalTeam,
          logo: logosMap.get(bestGlobalTeam.team_id) || null
        } : null,
        biggestRise: biggestRise ? {
          ...biggestRise,
          logo: logosMap.get(biggestRise.team_id) || null
        } : null,
        mostPointsGained: mostPointsGained ? {
          ...mostPointsGained,
          logo: logosMap.get(mostPointsGained.team_id) || null
        } : null,
        totalTeams,
        bestFilial: bestFilial ? {
          ...bestFilial,
          logo: logosMap.get(bestFilial.team_id) || null
        } : null,
        bestHistorical: bestHistorical ? {
          ...bestHistorical,
          logo: logosMap.get(bestHistorical.team_id) || null
        } : null
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
      .map((item, index) => ({
        ...item.team,
        global_points: item.totalPoints,
        global_position: index + 1
      }))
  }

  // Función auxiliar para obtener ranking global de la temporada anterior desde team_season_rankings
  const getPreviousSeasonGlobalRanking = async (referenceSeason: string) => {
    try {
      if (!supabase) return null

      const referenceYear = parseInt(referenceSeason.split('-')[0])
      const previousYear = referenceYear - 1
      const previousSeason = `${previousYear}-${(previousYear + 1).toString().slice(-2)}`

      // Determinar la subtemporada más reciente disponible para la temporada anterior
      const mostRecentSubupdate = await getMostRecentSubupdate(previousSeason)
      const rankColumn = `subupdate_${mostRecentSubupdate}_global_rank`
      const pointsColumn = `subupdate_${mostRecentSubupdate}_global_points`

      // Obtener rankings de la temporada anterior desde team_season_rankings
      // Usamos la subtemporada más reciente disponible
      const { data: rankingsData, error } = await supabase
        .from('team_season_rankings')
        .select(`
          team_id,
          ${rankColumn},
          ${pointsColumn},
          teams(name)
        `)
        .eq('season', previousSeason)
        .not(rankColumn, 'is', null)
        .order(rankColumn, { ascending: true })

      if (error) {
        console.error('Error obteniendo ranking global de temporada anterior:', error)
        return null
      }

      if (!rankingsData || rankingsData.length === 0) {
        return null
      }

      // Convertir a formato compatible con calculateGlobalRanking
      return rankingsData.map((row: any) => ({
        team_id: row.team_id,
        team_name: row.teams?.name || 'Equipo desconocido',
        total_points: parseFloat(row[pointsColumn] || 0),
        ranking_position: row[rankColumn]
      }))
    } catch (error) {
      console.error('Error obteniendo ranking de temporada anterior:', error)
      return null
    }
  }

  // Función auxiliar para obtener ranking de una categoría de la temporada anterior desde team_season_rankings
  const getPreviousSeasonCategoryRanking = async (category: string, referenceSeason: string) => {
    try {
      if (!supabase) return null

      const referenceYear = parseInt(referenceSeason.split('-')[0])
      const previousYear = referenceYear - 1
      const previousSeason = `${previousYear}-${(previousYear + 1).toString().slice(-2)}`

      // Mapear categoría a columna de la tabla
      const rankColumn = `${category}_rank`
      const pointsColumn = `${category}_points`

      // Obtener ranking de la categoría para la temporada anterior
      const { data: rankingsData, error } = await supabase
        .from('team_season_rankings')
        .select(`
          team_id,
          ${rankColumn},
          ${pointsColumn},
          teams(name)
        `)
        .eq('season', previousSeason)
        .not(rankColumn, 'is', null)
        .order(rankColumn, { ascending: true })

      if (error) {
        console.error('Error obteniendo ranking de categoría de temporada anterior:', error)
        return null
      }

      if (!rankingsData || rankingsData.length === 0) {
        return []
      }

      // Convertir a formato compatible
      return rankingsData.map((row: any) => ({
        team_id: row.team_id,
        team_name: row.teams?.name || 'Equipo desconocido',
        total_points: parseFloat(row[pointsColumn] || 0),
        ranking_position: row[rankColumn]
      }))
    } catch (error) {
      console.error('Error obteniendo ranking de categoría de temporada anterior:', error)
      return null
    }
  }

  // Función auxiliar para calcular mayor subida
  // Calcula qué equipo ha subido más posiciones comparando su posición actual
  // con su posición en la temporada anterior (datos reales)
  const calculateBiggestRise = async (allCategoryData: any[][], referenceSeason: string) => {
    const globalRanking = calculateGlobalRanking(allCategoryData)
    
    // Obtener ranking global de la temporada anterior
    const previousGlobalRanking = await getPreviousSeasonGlobalRanking(referenceSeason)
    
    // Si no hay datos de la temporada anterior, retornar null
    if (!previousGlobalRanking || previousGlobalRanking.length === 0) {
      console.warn('No hay datos de la temporada anterior para calcular mayor subida')
      return null
    }
    
    // Crear mapa de posiciones anteriores por team_id
    const previousPositionMap = new Map(
      previousGlobalRanking.map((team) => [team.team_id, team.ranking_position || 0])
    )
    
    let biggestRise = { team: null as any, positions: 0 }
    
    // Comparar posición actual con posición anterior
    globalRanking.forEach((team, currentPosition) => {
      const previousPosition = previousPositionMap.get(team.team_id)
      
      // Solo considerar equipos que estaban en la temporada anterior
      if (previousPosition !== undefined) {
        const positionsGained = previousPosition - (currentPosition + 1)
        if (positionsGained > biggestRise.positions) {
          biggestRise = { team, positions: positionsGained }
        }
      }
    })
    
    return biggestRise.team ? { ...biggestRise.team, positions_gained: biggestRise.positions } : null
  }

  // Función auxiliar para calcular más puntos conseguidos
  // Calcula qué equipo ha ganado más puntos comparando sus puntos actuales
  // con sus puntos de la temporada anterior (datos reales)
  const calculateMostPointsGained = async (allCategoryData: any[][], referenceSeason: string) => {
    const globalRanking = calculateGlobalRanking(allCategoryData)
    
    // Obtener ranking global de la temporada anterior
    const previousGlobalRanking = await getPreviousSeasonGlobalRanking(referenceSeason)
    
    // Si no hay datos de la temporada anterior, retornar null
    if (!previousGlobalRanking || previousGlobalRanking.length === 0) {
      console.warn('No hay datos de la temporada anterior para calcular más puntos ganados')
      return null
    }
    
    // Crear mapa de puntos anteriores por team_id
    const previousPointsMap = new Map(
      previousGlobalRanking.map(team => [team.team_id, team.total_points || 0])
    )
    
    let mostPointsGained = { team: null as any, points_gained: 0 }
    
    // Comparar puntos actuales con puntos anteriores
    globalRanking.forEach(team => {
      const previousPoints = previousPointsMap.get(team.team_id)
      
      // Solo considerar equipos que estaban en la temporada anterior
      if (previousPoints !== undefined) {
        const pointsGained = team.global_points - previousPoints
        if (pointsGained > mostPointsGained.points_gained) {
          mostPointsGained = { team, points_gained: pointsGained }
        }
      }
    })
    
    return mostPointsGained.team ? { ...mostPointsGained.team, points_gained: mostPointsGained.points_gained } : null
  }

  // Función auxiliar para calcular mejor histórico
  // Calcula el equipo con más puntos acumulados en TODAS las temporadas
  // SIN aplicar coeficientes de antigüedad (suma directa de todos los puntos)
  const calculateBestHistorical = async () => {
    try {
      if (!supabase) {
        console.warn('Supabase no disponible para calcular mejor histórico')
        return null
      }

      // Obtener todos los datos de team_season_points (todas las temporadas)
      const { data: allSeasonData, error } = await supabase
        .from('team_season_points')
        .select(`
          team_id,
          beach_mixed_points,
          beach_open_points,
          beach_women_points,
          grass_mixed_points,
          grass_open_points,
          grass_women_points
        `)

      if (error) {
        console.error('Error obteniendo datos históricos:', error)
        return null
      }

      if (!allSeasonData || allSeasonData.length === 0) {
        console.warn('No hay datos históricos disponibles')
        return null
      }

      // Sumar todos los puntos de todas las temporadas y categorías por equipo
      const teamTotalPoints: { [teamId: string]: number } = {}

      allSeasonData.forEach((row: any) => {
        const teamId = row.team_id
        const totalPoints = (row.beach_mixed_points || 0) +
                          (row.beach_open_points || 0) +
                          (row.beach_women_points || 0) +
                          (row.grass_mixed_points || 0) +
                          (row.grass_open_points || 0) +
                          (row.grass_women_points || 0)

        if (!teamTotalPoints[teamId]) {
          teamTotalPoints[teamId] = 0
        }
        teamTotalPoints[teamId] += totalPoints
      })

      // Encontrar el equipo con más puntos acumulados
      const sortedTeams = Object.entries(teamTotalPoints)
        .map(([team_id, total_points]) => ({ team_id, total_points }))
        .sort((a, b) => b.total_points - a.total_points)

      if (sortedTeams.length === 0) {
        return null
      }

      const bestHistoricalTeam = sortedTeams[0]

      // Obtener información del equipo (nombre)
      const { data: teamData } = await supabase
        .from('teams')
        .select('id, name')
        .eq('id', bestHistoricalTeam.team_id)
        .single()

      if (!teamData) {
        return null
      }

      return {
        team_id: bestHistoricalTeam.team_id,
        team_name: teamData.name,
        historical_points: bestHistoricalTeam.total_points
      }
    } catch (error) {
      console.error('Error calculando mejor histórico:', error)
      return null
    }
  }

  // Función auxiliar para calcular mejor filial
  // Busca el equipo filial (isFilial = true) con más puntos en el ranking global
  // Un filial es un equipo secundario que pertenece a un club principal
  const calculateBestFilial = async (allCategoryData: any[][]) => {
    const globalRanking = calculateGlobalRanking(allCategoryData)
    
    // Obtener información de isFilial de la tabla teams ya que no viene en el ranking
    if (!supabase) {
      console.warn('Supabase no disponible para obtener información de filiales')
      return null
    }
    
    const teamIds = globalRanking.map(team => team.team_id)
    const { data: teamsData, error } = await supabase
      .from('teams')
      .select('id, isFilial')
      .in('id', teamIds)
    
    if (error) {
      console.error('Error obteniendo información de filiales:', error)
      return null
    }
    
    // Crear mapa de isFilial por team_id
    const filialMap = new Map(teamsData?.map(team => [team.id, team.isFilial]) || [])
    
    // Enriquecer el ranking global con información de isFilial
    const enrichedRanking = globalRanking.map(team => ({
      ...team,
      isFilial: filialMap.get(team.team_id) || false
    }))
    
    // Buscar el primer equipo que sea filial en el ranking global (ordenado por puntos)
    const bestFilial = enrichedRanking.find(team => team.isFilial === true)
    
    return bestFilial || null
  }

  // Función para calcular estadísticas destacadas de una categoría específica
  const getCategoryHighlightStats = async (category: string, categoryData: any[], categorySeason: string) => {
    if (!categoryData || categoryData.length === 0) return null

    try {
      // 1. Líder actual (mejor equipo en la categoría)
      const categoryLeader = categoryData.length > 0 ? {
        team_id: categoryData[0].team_id,
        team_name: categoryData[0].team_name,
        logo: categoryData[0].logo,
        category_points: categoryData[0].total_points || 0
      } : null

      // 2. Equipo revelación (más puntos ganados comparando con temporada anterior)
      const categoryRevelation = await calculateCategoryMostPointsGained(category, categoryData, categorySeason)

      // 3. Subida en el ranking (mayor subida de posiciones)
      const categoryBiggestRise = await calculateCategoryBiggestRise(category, categoryData, categorySeason)

      // 4. Mejor filial en la categoría
      const categoryBestFilial = await calculateCategoryBestFilial(categoryData)

      // 5. Líder histórico (más puntos acumulados en esta categoría sin coeficientes)
      const categoryBestHistorical = await calculateCategoryBestHistorical(category)

      // 6. Equipos nuevos (equipos que solo tienen puntos en la temporada actual)
      const categoryNewTeamsList = categoryData.filter(team => {
        const seasons = Object.keys(team.season_breakdown || {})
        return seasons.length === 1 && seasons.includes(categorySeason)
      })
      const categoryNewTeams = categoryNewTeamsList.length
      const categoryNewTeamsNames = categoryNewTeamsList.map(team => team.team_name).slice(0, 5) // Limitar a 5 nombres para no saturar

      // Obtener logos de los equipos destacados
      const teamIdsToFetch = [
        categoryLeader?.team_id,
        categoryRevelation?.team_id,
        categoryBiggestRise?.team_id,
        categoryBestFilial?.team_id,
        categoryBestHistorical?.team_id
      ].filter(Boolean)

      if (teamIdsToFetch.length > 0 && supabase) {
        const { data: teamsData } = await supabase
          .from('teams')
          .select('id, logo')
          .in('id', teamIdsToFetch)

        const logoMap = new Map(teamsData?.map(team => [team.id, team.logo]) || [])

        if (categoryLeader) categoryLeader.logo = logoMap.get(categoryLeader.team_id) || categoryLeader.logo
        if (categoryRevelation) categoryRevelation.logo = logoMap.get(categoryRevelation.team_id) || categoryRevelation.logo
        if (categoryBiggestRise) categoryBiggestRise.logo = logoMap.get(categoryBiggestRise.team_id) || categoryBiggestRise.logo
        if (categoryBestFilial) categoryBestFilial.logo = logoMap.get(categoryBestFilial.team_id) || categoryBestFilial.logo
        if (categoryBestHistorical) categoryBestHistorical.logo = logoMap.get(categoryBestHistorical.team_id) || categoryBestHistorical.logo
      }

      return {
        categoryLeader,
        categoryRevelation,
        categoryBiggestRise,
        categoryBestFilial,
        categoryBestHistorical,
        categoryNewTeams,
        categoryNewTeamsNames
      }
    } catch (error) {
      console.error('Error calculando estadísticas destacadas de categoría:', error)
      return null
    }
  }

  // Función auxiliar para calcular mayor subida en una categoría
  const calculateCategoryBiggestRise = async (category: string, categoryData: any[], referenceSeason: string) => {
    if (!categoryData || categoryData.length === 0) return null

    // Obtener ranking de la categoría de la temporada anterior
    const previousCategoryRanking = await getPreviousSeasonCategoryRanking(category, referenceSeason)
    if (!previousCategoryRanking || previousCategoryRanking.length === 0) return null

    // Crear mapa de posiciones anteriores
    const previousPositionsMap = new Map(
      previousCategoryRanking.map((team) => [team.team_id, team.ranking_position || 0])
    )

    // Calcular cambios de posición
    const teamsWithRise = categoryData
      .map((team, index) => {
        const currentPosition = index + 1
        const previousPosition = previousPositionsMap.get(team.team_id)
        if (!previousPosition || previousPosition === 0) return null

        const positionsGained = previousPosition - currentPosition
        return {
          ...team,
          positions_gained: positionsGained
        }
      })
      .filter(Boolean)
      .filter((team: any) => team.positions_gained > 0)

    if (teamsWithRise.length === 0) return null

    // Encontrar el equipo con mayor subida
    const biggestRise = teamsWithRise.reduce((max, team) => 
      team.positions_gained > max.positions_gained ? team : max
    )

    return {
      team_id: biggestRise.team_id,
      team_name: biggestRise.team_name,
      logo: biggestRise.logo,
      positions_gained: biggestRise.positions_gained
    }
  }

  // Función auxiliar para calcular más puntos ganados en una categoría
  const calculateCategoryMostPointsGained = async (category: string, categoryData: any[], referenceSeason: string) => {
    if (!categoryData || categoryData.length === 0) return null

    // Obtener ranking de la categoría de la temporada anterior
    const previousCategoryRanking = await getPreviousSeasonCategoryRanking(category, referenceSeason)
    if (!previousCategoryRanking || previousCategoryRanking.length === 0) return null

    // Crear mapa de puntos anteriores
    const previousPointsMap = new Map(
      previousCategoryRanking.map(team => [team.team_id, team.total_points || 0])
    )

    // Calcular puntos ganados
    const teamsWithPointsGained = categoryData
      .map(team => {
        const currentPoints = team.total_points || 0
        const previousPoints = previousPointsMap.get(team.team_id) || 0
        const pointsGained = currentPoints - previousPoints

        return {
          ...team,
          points_gained: pointsGained
        }
      })
      .filter(team => team.points_gained > 0)

    if (teamsWithPointsGained.length === 0) return null

    // Encontrar el equipo con más puntos ganados
    const mostPointsGained = teamsWithPointsGained.reduce((max, team) => 
      team.points_gained > max.points_gained ? team : max
    )

    return {
      team_id: mostPointsGained.team_id,
      team_name: mostPointsGained.team_name,
      logo: mostPointsGained.logo,
      points_gained: mostPointsGained.points_gained
    }
  }

  // Función auxiliar para calcular mejor filial en una categoría
  const calculateCategoryBestFilial = async (categoryData: any[]) => {
    if (!categoryData || categoryData.length === 0) return null

    if (!supabase) {
      console.warn('Supabase no disponible para obtener información de filiales')
      return null
    }

    const teamIds = categoryData.map(team => team.team_id)
    const { data: teamsData, error } = await supabase
      .from('teams')
      .select('id, isFilial')
      .in('id', teamIds)

    if (error) {
      console.error('Error obteniendo información de filiales:', error)
      return null
    }

    // Crear mapa de isFilial por team_id
    const filialMap = new Map(teamsData?.map(team => [team.id, team.isFilial]) || [])

    // Buscar el primer equipo que sea filial en el ranking (ordenado por puntos)
    const bestFilial = categoryData.find(team => filialMap.get(team.team_id) === true)

    if (!bestFilial) return null

    return {
      team_id: bestFilial.team_id,
      team_name: bestFilial.team_name,
      logo: bestFilial.logo,
      category_points: bestFilial.total_points || 0
    }
  }

  // Función auxiliar para calcular mejor histórico en una categoría
  const calculateCategoryBestHistorical = async (category: string) => {
    try {
      if (!supabase) {
        console.warn('Supabase no disponible para calcular mejor histórico de categoría')
        return null
      }

      // Mapear categoría a columna en team_season_points
      const categoryColumnMap: { [key: string]: string } = {
        'beach_mixed': 'beach_mixed_points',
        'beach_open': 'beach_open_points',
        'beach_women': 'beach_women_points',
        'grass_mixed': 'grass_mixed_points',
        'grass_open': 'grass_open_points',
        'grass_women': 'grass_women_points'
      }

      const columnName = categoryColumnMap[category]
      if (!columnName) return null

      // Obtener todos los registros de team_season_points para esta categoría
      const { data: allSeasonPoints, error } = await supabase
        .from('team_season_points')
        .select(`team_id, ${columnName}`)
        .gt(columnName, 0)

      if (error) throw error

      if (!allSeasonPoints || allSeasonPoints.length === 0) {
        return null
      }

      // Sumar puntos históricos por equipo
      const teamHistoricalPoints: { [teamId: string]: number } = {}

      allSeasonPoints.forEach((row: any) => {
        const teamId = row.team_id
        const points = row[columnName] || 0

        if (!teamHistoricalPoints[teamId]) {
          teamHistoricalPoints[teamId] = 0
        }
        teamHistoricalPoints[teamId] += points
      })

      // Encontrar el equipo con más puntos históricos
      const bestHistoricalTeamId = Object.keys(teamHistoricalPoints).reduce((a, b) =>
        teamHistoricalPoints[a] > teamHistoricalPoints[b] ? a : b
      )

      const bestHistoricalPoints = teamHistoricalPoints[bestHistoricalTeamId]

      // Obtener el nombre y logo del equipo
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('id, name, logo')
        .eq('id', bestHistoricalTeamId)
        .single()

      if (teamError) throw teamError

      return {
        team_id: teamData.id,
        team_name: teamData.name,
        logo: teamData.logo,
        historical_points: bestHistoricalPoints
      }
    } catch (error) {
      console.error('Error calculando el mejor histórico de categoría:', error)
      return null
    }
  }

  // Función para calcular estadísticas destacadas del ranking general
  const getGeneralHighlightStats = async (generalData: any[]) => {
    if (!generalData || generalData.length === 0) return null

    try {
      const rankingDataWithChanges = getRankingByType(generalData, 'current')

      // 1. Líder actual (mejor equipo en el ranking general)
      const generalLeader = rankingDataWithChanges.length > 0 ? {
        team_id: rankingDataWithChanges[0].team_id,
        team_name: rankingDataWithChanges[0].team_name,
        logo: rankingDataWithChanges[0].logo,
        global_points: rankingDataWithChanges[0].total_points || 0
      } : null

      // 2. Equipo revelación (más puntos ganados comparando con temporada anterior)
      const generalRevelation = await calculateGeneralMostPointsGained(generalData, referenceSeason || '')

      // 3. Subida en el ranking (mayor subida de posiciones)
      const generalBiggestRise = await calculateGeneralBiggestRise(generalData, referenceSeason || '')

      // 4. Mejor filial en el ranking general
      const generalBestFilial = await calculateGeneralBestFilial(rankingDataWithChanges)

      // 5. Líder histórico (más puntos acumulados sin coeficientes)
      const generalBestHistorical = await calculateBestHistorical()

      // 6. Equipos nuevos (equipos que solo tienen puntos en la temporada actual)
      const generalNewTeamsList = rankingDataWithChanges.filter(team => {
        const seasons = Object.keys(team.season_breakdown || {})
        return seasons.length === 1 && seasons.includes(referenceSeason || '')
      })
      const generalNewTeams = generalNewTeamsList.length
      const generalNewTeamsNames = generalNewTeamsList.map(team => team.team_name).slice(0, 5)

      // Obtener logos de los equipos destacados
      const teamIdsToFetch = [
        generalLeader?.team_id,
        generalRevelation?.team_id,
        generalBiggestRise?.team_id,
        generalBestFilial?.team_id,
        generalBestHistorical?.team_id
      ].filter(Boolean)

      if (teamIdsToFetch.length > 0 && supabase) {
        const { data: teamsData } = await supabase
          .from('teams')
          .select('id, logo')
          .in('id', teamIdsToFetch)

        const logoMap = new Map(teamsData?.map(team => [team.id, team.logo]) || [])

        if (generalLeader) generalLeader.logo = logoMap.get(generalLeader.team_id) ?? generalLeader.logo
        if (generalRevelation) generalRevelation.logo = logoMap.get(generalRevelation.team_id) ?? generalRevelation.logo
        if (generalBiggestRise) generalBiggestRise.logo = logoMap.get(generalBiggestRise.team_id) ?? generalBiggestRise.logo
        if (generalBestFilial) generalBestFilial.logo = logoMap.get(generalBestFilial.team_id) ?? generalBestFilial.logo
        if (generalBestHistorical) generalBestHistorical.logo = logoMap.get(generalBestHistorical.team_id) ?? generalBestHistorical.logo
      }

      return {
        generalLeader,
        generalRevelation,
        generalBiggestRise,
        generalBestFilial,
        generalBestHistorical,
        generalNewTeams,
        generalNewTeamsNames
      }
    } catch (error) {
      console.error('Error calculando estadísticas destacadas del ranking general:', error)
      return null
    }
  }

  // Función auxiliar para calcular mayor subida en ranking general
  const calculateGeneralBiggestRise = async (generalData: any[], referenceSeason: string) => {
    if (!generalData || generalData.length === 0) return null

    const rankingDataWithChanges = getRankingByType(generalData, 'current')

    // Obtener ranking global de la temporada anterior
    const previousGlobalRanking = await getPreviousSeasonGlobalRanking(referenceSeason)
    if (!previousGlobalRanking || previousGlobalRanking.length === 0) return null

    // Crear mapa de posiciones anteriores
    const previousPositionsMap = new Map(
      previousGlobalRanking.map((team) => [team.team_id, team.ranking_position || 0])
    )

    // Calcular cambios de posición
    const teamsWithRise = rankingDataWithChanges
      .map((team, index) => {
        const currentPosition = index + 1
        const previousPosition = previousPositionsMap.get(team.team_id)
        if (!previousPosition || previousPosition === 0) return null

        const positionsGained = previousPosition - currentPosition
        return {
          ...team,
          positions_gained: positionsGained
        }
      })
      .filter(Boolean)
      .filter((team: any) => team.positions_gained > 0)

    if (teamsWithRise.length === 0) return null

    // Encontrar el equipo con mayor subida
    const biggestRise = teamsWithRise.reduce((max, team) => 
      team.positions_gained > max.positions_gained ? team : max
    )

    return {
      team_id: biggestRise.team_id,
      team_name: biggestRise.team_name,
      logo: biggestRise.logo,
      positions_gained: biggestRise.positions_gained
    }
  }

  // Función auxiliar para calcular más puntos ganados en ranking general
  const calculateGeneralMostPointsGained = async (generalData: any[], referenceSeason: string) => {
    if (!generalData || generalData.length === 0) return null

    const rankingDataWithChanges = getRankingByType(generalData, 'current')

    // Obtener ranking global de la temporada anterior
    const previousGlobalRanking = await getPreviousSeasonGlobalRanking(referenceSeason)
    if (!previousGlobalRanking || previousGlobalRanking.length === 0) return null

    // Crear mapa de puntos anteriores
    const previousPointsMap = new Map(
      previousGlobalRanking.map(team => [team.team_id, team.total_points || 0])
    )

    // Calcular puntos ganados
    const teamsWithPointsGained = rankingDataWithChanges
      .map(team => {
        const currentPoints = team.total_points || 0
        const previousPoints = previousPointsMap.get(team.team_id) || 0
        const pointsGained = currentPoints - previousPoints

        return {
          ...team,
          points_gained: pointsGained
        }
      })
      .filter(team => team.points_gained > 0)

    if (teamsWithPointsGained.length === 0) return null

    // Encontrar el equipo con más puntos ganados
    const mostPointsGained = teamsWithPointsGained.reduce((max, team) => 
      team.points_gained > max.points_gained ? team : max
    )

    return {
      team_id: mostPointsGained.team_id,
      team_name: mostPointsGained.team_name,
      logo: mostPointsGained.logo,
      points_gained: mostPointsGained.points_gained
    }
  }

  // Función auxiliar para calcular mejor filial en ranking general
  const calculateGeneralBestFilial = async (generalData: any[]) => {
    if (!generalData || generalData.length === 0) return null

    if (!supabase) {
      console.warn('Supabase no disponible para obtener información de filiales')
      return null
    }

    const teamIds = generalData.map(team => team.team_id)
    const { data: teamsData, error } = await supabase
      .from('teams')
      .select('id, isFilial')
      .in('id', teamIds)

    if (error) {
      console.error('Error obteniendo información de filiales:', error)
      return null
    }

    // Crear mapa de isFilial por team_id
    const filialMap = new Map(teamsData?.map(team => [team.id, team.isFilial]) || [])

    // Buscar el primer equipo que sea filial en el ranking (ordenado por puntos)
    const bestFilial = generalData.find(team => filialMap.get(team.team_id) === true)

    if (!bestFilial) return null

    return {
      team_id: bestFilial.team_id,
      team_name: bestFilial.team_name,
      logo: bestFilial.logo,
      global_points: bestFilial.total_points || 0
    }
  }

  // Función para obtener icono de cambio de posición (con flecha y número)
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

  // Función para obtener color del header según categoría
  const getCategoryHeaderColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'beach_mixed': 'from-yellow-500 to-yellow-600',
      'beach_women': 'from-amber-500 to-amber-600',
      'beach_open': 'from-orange-500 to-orange-600',
      'grass_mixed': 'from-green-500 to-green-600',
      'grass_women': 'from-emerald-500 to-emerald-600',
      'grass_open': 'from-teal-500 to-teal-600'
    }
    return colors[category] || 'from-gray-500 to-gray-600'
  }

  // Función para obtener emoji según categoría
  const getCategoryEmoji = (category: string) => {
    if (category.includes('beach')) return '🏖️'
    if (category.includes('grass')) return '🌱'
    return '🏆'
  }

  // Función para obtener nombre corto de categoría
  const getCategoryShortName = (category: string) => {
    const names: { [key: string]: string } = {
      'beach_mixed': 'Playa Mixto',
      'beach_women': 'Playa Women',
      'beach_open': 'Playa Open',
      'grass_mixed': 'Césped Mixto',
      'grass_women': 'Césped Women',
      'grass_open': 'Césped Open'
    }
    return names[category] || category
  }

  // Componente para tarjeta de resumen de ranking con estilo de HomePage
  const SummaryCard = ({ title, data, category }: { title: string, data: any[], category: string }) => {
    const top5 = data?.slice(0, 5) || []
    
    // Calcular cambios de posición usando position_change si está disponible
    const dataWithChanges = top5.map((team, index) => {
      const currentPosition = index + 1
      // Usar position_change del equipo si está disponible, sino calcular basándose en ranking_position
      const change = team.position_change !== undefined 
        ? team.position_change 
        : (team.ranking_position ? team.ranking_position - currentPosition : 0)
      
      return {
        ...team,
        change: change
      }
    })
    
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className={`px-4 py-3 bg-gradient-to-r ${getCategoryHeaderColor(category)}`}>
          <h3 className="text-white font-semibold text-sm">{getCategoryEmoji(category)} {getCategoryShortName(category)}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pos</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cambio</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Equipo</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pts</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dataWithChanges.map((team, index) => (
                <tr key={team.team_id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      {getRankIcon(index + 1)}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      {getChangeIcon(team.change)}
                      <span className={`ml-1 text-sm font-medium ${
                        team.change > 0 ? 'text-green-600' : 
                        team.change < 0 ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {getChangeText(team.change)}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <TeamLogo name={team.team_name} logo={team.logo} size="sm" />
                      <div className="ml-2">
                        <div className="text-sm font-medium text-gray-900">{team.team_name}</div>
                        <div className="text-xs text-gray-500">{team.region_name || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{team.total_points?.toFixed(1) || '0.0'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <button
            onClick={() => handleTabClick(category)}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
          >
            Ver ranking completo →
          </button>
        </div>
      </div>
    )
  }

  // Componente para bloques de estadísticas destacadas
  const StatsBlock = ({ title, value, subtitle, icon: Icon, color = "blue", logo, teamName, tooltip, useLogoAsBackground = false }: { 
    title: string, 
    value: string | number, 
    subtitle: string, 
    icon: React.FC<{ className?: string }>, 
    color?: string,
    logo?: string | null,
    teamName?: string,
    tooltip?: string,
    useLogoAsBackground?: boolean
  }) => {
    return (
      <div className="relative group h-full flex flex-col">
        <div 
          className="bg-white rounded-lg border border-gray-200 shadow-sm relative overflow-hidden h-full flex flex-col"
        >
          {/* Overlay con opacidad para el logo de fondo */}
          {useLogoAsBackground && logo && (
            <div 
              className="absolute inset-0 opacity-20 pointer-events-none rounded-lg overflow-hidden"
              style={{
                backgroundImage: `url(${logo})`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center center',
                backgroundSize: 'cover',
              }}
            />
          )}
           {/* Título con fondo traslúcido pegado al borde superior */}
           <div className="relative z-20 bg-white/60 backdrop-blur-md px-4 py-2 border-b border-gray-200/50 rounded-t-lg">
             <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wide">{title}</h3>
               {/* Icono de información en esquina superior derecha */}
               {tooltip && (
                 <div className="relative z-50">
                   <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors cursor-help">
                     <Info className="w-2.5 h-2.5 text-gray-600" />
          </div>
        </div>
               )}
             </div>
           </div>
          {/* Logo del equipo o icono en esquina superior derecha (solo si no es fondo) */}
          {!useLogoAsBackground && (
            <div className="absolute top-1/2 right-3 transform -translate-y-1/2 z-10">
              {logo && teamName ? (
                <TeamLogo name={teamName} logo={logo} size="md" />
              ) : (
                <Icon className="w-4 h-4 opacity-40" />
              )}
            </div>
          )}
          {/* Contenido principal */}
          <div className="relative z-10 p-4 pt-3 flex-1 flex flex-col justify-end">
            <p className="text-lg font-bold text-gray-900 break-words line-clamp-2 leading-tight" style={{ textShadow: '0 0 4px rgba(255, 255, 255, 0.9), 0 0 8px rgba(255, 255, 255, 0.7)' }}>{value}</p>
            <p className="text-[10px] text-gray-500 mt-1 leading-tight line-clamp-3 break-words" style={{ textShadow: '0 0 2px rgba(255, 255, 255, 0.8), 0 0 4px rgba(255, 255, 255, 0.6)' }}>{subtitle}</p>
          </div>
         </div>
        {/* Tooltip fuera del contenedor con overflow-hidden */}
        {tooltip && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[100]">
            {tooltip}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </div>
    )
  }

  // Renderizar vista de ranking general
  const renderGeneralView = () => {
    if (isLoadingGeneral) {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Cargando ranking general...</p>
          </div>
        </div>
      )
    }

    // Determinar qué tipo de ranking mostrar según detailedViewMode
    const rankingTypeToUse = detailedViewMode === 'historical' ? 'historical' : 
                             detailedViewMode === 'clubs' ? 'clubs' : 'current'
    
    const baseRankingData = getRankingByType(generalRankingData || [], rankingTypeToUse)
    
    // Usar datos con position_change calculado si están disponibles, sino usar baseRankingData
    const finalRankingData = (rankingTypeToUse !== 'current' && generalRankingWithChanges) 
      ? generalRankingWithChanges 
      : baseRankingData
    // Si es ranking histórico, mostrar TODAS las temporadas disponibles
    // Si no, mostrar solo las últimas 4
    const allGeneralSeasons = getAllAvailableSeasons(generalRankingData || [])
    const seasons = rankingTypeToUse === 'historical' 
      ? allGeneralSeasons 
      : getLastFourSeasons(generalRankingData || [])

    // Si está en modo análisis o avanzadas, mostrar esas vistas
    if (detailedViewMode === 'analysis') {
    return (
        <div className="space-y-6">
          {renderGeneralAnalysisTab()}
        </div>
      )
    }
    
    if (detailedViewMode === 'advanced') {
      return (
        <div className="space-y-6">
          {renderGeneralAdvancedTab()}
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Estadísticas destacadas del ranking general */}
        {generalHighlightStats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 items-stretch">
            <StatsBlock
              title="Líder Actual"
              value={generalHighlightStats.generalLeader?.team_name || 'N/A'}
              subtitle={`${generalHighlightStats.generalLeader?.global_points?.toFixed(1) || '0'} pts`}
              icon={Trophy}
              color="blue"
              logo={generalHighlightStats.generalLeader?.logo}
              teamName={generalHighlightStats.generalLeader?.team_name}
              tooltip="El equipo con más puntos en el ranking global actual, considerando todas las categorías y coeficientes de antigüedad."
              useLogoAsBackground={true}
            />
            <StatsBlock
              title="Equipo Revelación"
              value={generalHighlightStats.generalRevelation?.team_name || 'N/A'}
              subtitle={`+${generalHighlightStats.generalRevelation?.points_gained?.toFixed(1) || '0'} pts`}
              icon={BarChart3}
              color="yellow"
              logo={generalHighlightStats.generalRevelation?.logo}
              teamName={generalHighlightStats.generalRevelation?.team_name}
              tooltip="El equipo que ha ganado más puntos en el ranking global comparando la temporada actual con la anterior."
              useLogoAsBackground={true}
            />
            <StatsBlock
              title="Subida en el ranking"
              value={generalHighlightStats.generalBiggestRise?.team_name || 'N/A'}
              subtitle={`+${generalHighlightStats.generalBiggestRise?.positions_gained || 0} puestos`}
              icon={TrendingUp}
              color="green"
              logo={generalHighlightStats.generalBiggestRise?.logo}
              teamName={generalHighlightStats.generalBiggestRise?.team_name}
              tooltip="El equipo que ha subido más posiciones en el ranking global comparando la temporada actual con la anterior."
              useLogoAsBackground={true}
            />
            <StatsBlock
              title="Mejor Filial"
              value={generalHighlightStats.generalBestFilial?.team_name || 'Sin filiales'}
              subtitle={generalHighlightStats.generalBestFilial ? `${generalHighlightStats.generalBestFilial.global_points?.toFixed(1) || '0'} pts` : 'No hay filiales'}
              icon={Users}
              color="purple"
              logo={generalHighlightStats.generalBestFilial?.logo}
              teamName={generalHighlightStats.generalBestFilial?.team_name}
              tooltip="El equipo filial mejor clasificado en el ranking global actual."
              useLogoAsBackground={true}
            />
            <StatsBlock
              title="Líder histórico"
              value={generalHighlightStats.generalBestHistorical?.team_name || 'N/A'}
              subtitle={`${generalHighlightStats.generalBestHistorical?.historical_points?.toFixed(1) || '0'} pts`}
              icon={Star}
              color="orange"
              logo={generalHighlightStats.generalBestHistorical?.logo}
              teamName={generalHighlightStats.generalBestHistorical?.team_name}
              tooltip="El equipo con más puntos acumulados desde que se registran datos en el ranking, en todas las temporadas sin aplicar coeficientes."
              useLogoAsBackground={true}
            />
            <StatsBlock
              title="Equipos Nuevos"
              value={generalHighlightStats.generalNewTeams || 0}
              subtitle={generalHighlightStats.generalNewTeamsNames && generalHighlightStats.generalNewTeamsNames.length > 0
                ? generalHighlightStats.generalNewTeamsNames.join(', ')
                : 'En esta temporada'}
              icon={Users}
              color="red"
              tooltip="Equipos nuevos desde que se registran datos en el ranking (solo tienen puntos en la temporada actual del ranking global)."
          />
        </div>
        )}

        {/* Estadísticas destacadas con tooltips */}
        {generalStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
            <div className="bg-white rounded-lg shadow p-4 group relative">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Equipos</p>
                  <p className="text-2xl font-semibold text-gray-900">{generalStats.total_teams}</p>
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
                <TrendingUp className="w-8 h-8 text-green-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Equipos Nuevos</p>
                  <p className="text-2xl font-semibold text-gray-900">{generalStats.new_teams}</p>
                </div>
              </div>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                Equipos nuevos desde que se registran datos en el ranking{referenceSeason ? ` (solo tienen puntos en ${referenceSeason})` : ''}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4 group relative">
              <div className="flex items-center">
                <Trophy className="w-8 h-8 text-yellow-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Consistencia</p>
                  <p className="text-2xl font-semibold text-gray-900">{generalStats.consistent_teams}</p>
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
                  <p className="text-2xl font-semibold text-gray-900">{generalStats.avg_activity.toFixed(1)}</p>
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

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header con controles estilo UEFA */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <LineChart className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Ranking General - Temporada {referenceSeason}
                </h2>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>
                  {rankingTypeToUse === 'clubs' 
                    ? `${finalRankingData?.length || 0} clubes` 
                    : `${finalRankingData?.length || 0} equipos`
                  }
                </span>
                {rankingTypeToUse === 'historical' && (
                  <span className="text-xs text-gray-500">• Suma total histórica</span>
                )}
                {rankingTypeToUse === 'clubs' && (
                  <span className="text-xs text-gray-500">• Incluye filiales</span>
                )}
              </div>
            </div>
          
            {/* Controles de tabla estilo UEFA */}
            <div className="flex items-center justify-end">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Temporada:</label>
                <select className="text-sm border border-gray-300 rounded px-3 py-1 bg-white">
                  {seasons.map((season) => {
                    const year1 = season.split('-')[0]
                    const year2 = season.split('-')[1]
                    return (
                      <option key={season} value={season}>{year1}/{year2}</option>
                    )
                  })}
                </select>
              </div>
            </div>
          </div>

        {/* Tabla estilo UEFA - wrapper con animación expandir/colapsar */}
          <div
            className="overflow-hidden transition-[max-height] duration-500 ease-in-out"
            style={{ maxHeight: showAllResults ? '5000px' : '760px' }}
            onTransitionEnd={() => { if (isCollapsing) setIsCollapsing(false) }}
          >
            <div className="overflow-x-auto">
            <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posición</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cambio</th>
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
                        {rankingTypeToUse !== 'historical' && (
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
              {finalRankingData?.slice(0, (showAllResults || isCollapsing) ? undefined : 10).map((team, index) => {
                const isEvenRow = index % 2 === 1
                
                return (
                  <tr key={team.team_id} className={`hover:bg-gray-50 ${isEvenRow ? 'bg-gray-50' : 'bg-white'}`}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center">
                        {getRankIcon(index + 1)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
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
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <TeamLogo name={team.team_name} logo={team.logo} size="sm" />
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{team.team_name}</div>
                          {team.region_name && (
                            <div className="text-xs text-gray-500">{team.region_name}</div>
                          )}
                          {rankingTypeToUse === 'clubs' && team.teams_count && team.teams_count > 1 && (
                            <div className="text-xs text-blue-600">{team.teams_count} equipos</div>
                          )}
                        </div>
                      </div>
                    </td>
                      {seasons.map((season) => (
                        <td key={season} className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {team.season_breakdown?.[season]?.base_points?.toFixed(2) || '0.00'}
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
          </div>

        {/* Footer estilo UEFA */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  if (showAllResults) {
                    setIsCollapsing(true)
                    setShowAllResults(false)
                  } else {
                    setShowAllResults(true)
                  }
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                {showAllResults ? 'Ver solo top 10' : 'Ver ranking completo'} ✓
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Renderizar pestaña de Análisis para ranking general
  const renderGeneralAnalysisTab = () => {
    if (isLoadingGeneral || !generalRankingData) {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Cargando datos...</p>
          </div>
        </div>
      )
    }

    // Determinar qué tipo de ranking mostrar según detailedViewMode
    const rankingTypeToUse = detailedViewMode === 'historical' ? 'historical' : 
                             detailedViewMode === 'clubs' ? 'clubs' : 'current'
    const rankingDataWithChanges = getRankingByType(generalRankingData || [], rankingTypeToUse)
    const analysisData = getAnalysisDataForGeneral(rankingDataWithChanges)
    const positionData = getPositionAnalysisDataForGeneral(rankingDataWithChanges)

    return (
      <div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <LineChart className="w-5 h-5 mr-2" />
            Análisis de Equipos - Ranking General
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
                    ? 'bg-blue-100 text-blue-700 border border-gray-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                {showAllTeams ? 'Mostrar solo top 20' : 'Mostrar todos los equipos'}
              </button>
              <span className="text-sm text-gray-500">
                {rankingDataWithChanges?.length || 0} equipos disponibles
              </span>
          </div>

            {/* Lista de equipos */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {rankingDataWithChanges
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
                  <TeamLogo name={team.team_name} logo={team.logo} size="sm" />
                  <span className="truncate">{team.team_name}</span>
                </label>
              ))}
            </div>
            
            {/* Mensaje si no hay resultados */}
            {rankingDataWithChanges?.filter(team => 
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
                  const team = rankingDataWithChanges?.find(t => t.team_id === teamId)
                  return team ? (
                    <span key={teamId} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      <TeamLogo name={team.team_name} logo={team.logo} size="sm" />
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
                      ? 'bg-blue-100 text-blue-700 border border-gray-200'
                      : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  Evolución de Puntos
                </button>
                <button
                  onClick={() => setAnalysisView('positions')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    analysisView === 'positions'
                      ? 'bg-blue-100 text-blue-700 border border-gray-200'
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
                  hoveredPoint={hoveredPoint}
                  setHoveredPoint={setHoveredPoint}
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
                        <TeamLogo name={team.team_name} logo={rankingDataWithChanges?.find(t => t.team_id === team.team_id)?.logo} size="sm" />
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
                          <TeamLogo name={team.team_name} logo={rankingDataWithChanges?.find(t => t.team_id === team.team_id)?.logo} size="sm" />
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

  // Renderizar pestaña de Estadísticas Avanzadas para ranking general
  const renderGeneralAdvancedTab = () => {
    if (isLoadingGeneral || !generalRankingData) {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Cargando datos...</p>
          </div>
        </div>
      )
    }

    // Determinar qué tipo de ranking mostrar según detailedViewMode
    const rankingTypeToUse = detailedViewMode === 'historical' ? 'historical' : 
                             detailedViewMode === 'clubs' ? 'clubs' : 'current'
    const rankingDataWithChanges = getRankingByType(generalRankingData || [], rankingTypeToUse)

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Estadísticas Avanzadas - Ranking General
            </h3>
          <p className="text-gray-600 mb-6">
            Análisis detallado de la distribución geográfica y competitividad del ranking general.
          </p>
          
          {/* Estadísticas por región */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">Distribución por Región</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(
                rankingDataWithChanges?.reduce((acc: { [key: string]: number }, team) => {
                  const region = team.region_name || 'Sin región'
                  acc[region] = (acc[region] || 0) + 1
                  return acc
                }, {}) || {}
              ).map(([region, count]) => (
                <div key={region} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{region}</span>
                    <span className="text-lg font-semibold text-blue-600">{count as number}</span>
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
                  {rankingDataWithChanges && rankingDataWithChanges.length > 1 
                    ? (rankingDataWithChanges[0].total_points - rankingDataWithChanges[1].total_points).toFixed(1)
                    : '0.0'
                  }
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Equipos en Top 10</div>
                <div className="text-xl font-semibold text-gray-900">
                  {Math.min(10, rankingDataWithChanges?.length || 0)}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">Densidad Competitiva</div>
                <div className="text-xl font-semibold text-gray-900">
                  {rankingDataWithChanges && rankingDataWithChanges.length > 0
                    ? ((rankingDataWithChanges.slice(0, 10).reduce((sum, team) => sum + (team.total_points || 0), 0) / 10) / 
                       (rankingDataWithChanges[0].total_points || 1) * 100).toFixed(1) + '%'
                    : '0%'
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }


  const renderSummaryView = () => {
    return (
      <div className="space-y-8">
        {/* Bloques de estadísticas destacadas en una fila */}
        {highlightStats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 items-stretch">
            <StatsBlock
              title="Mejor Global"
              value={highlightStats.bestGlobalTeam?.team_name || 'N/A'}
              subtitle={`${highlightStats.bestGlobalTeam?.global_points?.toFixed(1) || '0'} pts`}
              icon={Trophy}
              color="blue"
              logo={highlightStats.bestGlobalTeam?.logo}
              teamName={highlightStats.bestGlobalTeam?.team_name}
              tooltip="Equipo con más puntos sumando todas las categorías con coeficientes de antigüedad aplicados."
              useLogoAsBackground={true}
            />
            <StatsBlock
              title="Equipo Revelación"
              value={highlightStats.mostPointsGained?.team_name || 'N/A'}
              subtitle={`+${highlightStats.mostPointsGained?.points_gained?.toFixed(1) || '0'} pts`}
              icon={BarChart3}
              color="yellow"
              logo={highlightStats.mostPointsGained?.logo}
              teamName={highlightStats.mostPointsGained?.team_name}
              tooltip="Equipo que ha ganado más puntos comparando la temporada actual con la anterior."
              useLogoAsBackground={true}
            />
            <StatsBlock
              title="Subida en el ranking"
              value={highlightStats.biggestRise?.team_name || 'N/A'}
              subtitle={`+${highlightStats.biggestRise?.positions_gained || 0} puestos`}
              icon={TrendingUp}
              color="green"
              logo={highlightStats.biggestRise?.logo}
              teamName={highlightStats.biggestRise?.team_name}
              tooltip="Equipo que ha subido más posiciones comparando la temporada actual con la anterior."
              useLogoAsBackground={true}
            />
            <StatsBlock
              title="Mejor Filial"
              value={highlightStats.bestFilial?.team_name || 'Sin filiales'}
              subtitle={highlightStats.bestFilial ? `${highlightStats.bestFilial.global_points?.toFixed(1) || '0'} pts` : 'No hay filiales'}
              icon={Users}
              color="purple"
              logo={highlightStats.bestFilial?.logo}
              teamName={highlightStats.bestFilial?.team_name}
              tooltip="Equipo filial (secundario de un club principal) con más puntos en el ranking."
              useLogoAsBackground={true}
            />
            <StatsBlock
              title="Líder histórico"
              value={highlightStats.bestHistorical?.team_name || 'N/A'}
              subtitle={`${highlightStats.bestHistorical?.historical_points?.toFixed(1) || '0'} pts`}
              icon={Star}
              color="orange"
              logo={highlightStats.bestHistorical?.logo}
              teamName={highlightStats.bestHistorical?.team_name}
              tooltip="Equipo con más puntos acumulados desde que se registran datos en el ranking, en todas las temporadas sin aplicar coeficientes."
              useLogoAsBackground={true}
            />
            <StatsBlock
              title="Total Equipos"
              value={highlightStats.totalTeams}
              subtitle="Con torneos disputados"
              icon={Users}
              color="red"
              tooltip="Número total de equipos únicos con puntos en el ranking actual."
            />
          </div>
        )}

        {/* Grid de rankings - Orden: Playa (Mixto, Women, Open) luego Césped (Mixto, Women, Open) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SummaryCard 
            title="Playa Mixto" 
            data={beachMixedData || []} 
            category="beach_mixed" 
          />
          <SummaryCard 
            title="Playa Women" 
            data={beachWomenData || []} 
            category="beach_women" 
          />
          <SummaryCard 
            title="Playa Open" 
            data={beachOpenData || []} 
            category="beach_open" 
          />
          <SummaryCard 
            title="Césped Mixto" 
            data={grassMixedData || []} 
            category="grass_mixed" 
          />
          <SummaryCard 
            title="Césped Women" 
            data={grassWomenData || []} 
            category="grass_women" 
          />
          <SummaryCard 
            title="Césped Open" 
            data={grassOpenData || []} 
            category="grass_open" 
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
    
    // Determinar qué tipo de ranking mostrar según detailedViewMode
    const rankingTypeToUse = detailedViewMode === 'historical' ? 'historical' : 
                             detailedViewMode === 'clubs' ? 'clubs' : 'current'

    // Si está en modo análisis o avanzadas, mostrar esas vistas
    if (detailedViewMode === 'analysis') {
      return (
        <div className="space-y-6">
          {renderAnalysisTab()}
        </div>
      )
    }
    
    if (detailedViewMode === 'advanced') {
      return (
        <div className="space-y-6">
          {renderAdvancedTab()}
        </div>
      )
    }
    
    // Obtener datos según el tipo de ranking seleccionado
    const baseRankingData = getRankingByType(rankingData || [], rankingTypeToUse)
    
    // Obtener todas las temporadas disponibles
    const allSeasons = getAllAvailableSeasons(rankingData || [])
    
    // Usar la temporada seleccionada o la más reciente por defecto
    const currentReferenceSeason = selectedSeasonForDetailedView || referenceSeason || allSeasons[0]
    
    // Usar datos con position_change calculado si están disponibles, sino usar baseRankingData
    const finalRankingData = (rankingTypeToUse !== 'current' && categoryRankingWithChanges) 
      ? categoryRankingWithChanges 
      : baseRankingData
    
    // Obtener temporadas para mostrar en columnas
    // Si es ranking histórico, mostrar TODAS las temporadas disponibles
    // Si no, mostrar solo las últimas 4 (la seleccionada y las 3 anteriores)
    const seasons = rankingTypeToUse === 'historical' 
      ? allSeasons 
      : getLastFourSeasons(rankingData || [], currentReferenceSeason)
    
    // Coeficientes para cada temporada (1.0, 0.8, 0.5, 0.2)
    const coefficients = [1.0, 0.8, 0.5, 0.2]
    
    // Función para obtener puntos de una temporada específica
    const getSeasonPoints = (team: any, season: string) => {
      if (rankingTypeToUse === 'clubs') {
        // Para ranking de clubes, los puntos ya están sumados en season_breakdown
        return team.season_breakdown?.[season] || 0
      } else {
        // Para otros rankings, usar base_points
        return team.season_breakdown?.[season]?.base_points || 0
      }
    }
    
    // Función para calcular puntos totales basados en las temporadas seleccionadas
    const calculateTotalPoints = (team: any) => {
      if (rankingTypeToUse === 'historical') {
        // Para ranking histórico, sumar todos los puntos sin coeficientes
        return Object.values(team.season_breakdown || {}).reduce((sum: number, seasonData: any) => {
          const points = typeof seasonData === 'number' ? seasonData : (seasonData?.base_points || 0)
          return sum + points
        }, 0)
      }
      
      // Para ranking actual o de clubes, usar las temporadas seleccionadas con coeficientes
      return seasons.reduce((total, season, index) => {
        const points = getSeasonPoints(team, season)
        const coefficient = coefficients[index] || 0
        return total + (points * coefficient)
      }, 0)
    }
    
    // Recalcular puntos totales para cada equipo basado en las temporadas seleccionadas
    const rankingDataWithRecalculatedPoints = finalRankingData?.map(team => ({
      ...team,
      total_points: calculateTotalPoints(team)
    })).sort((a, b) => (b.total_points || 0) - (a.total_points || 0))
    
    return (
      <div className="space-y-6">
        {/* Estadísticas destacadas de la categoría */}
        {categoryHighlightStats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 items-stretch">
            <StatsBlock
              title="Líder Actual"
              value={categoryHighlightStats.categoryLeader?.team_name || 'N/A'}
              subtitle={`${categoryHighlightStats.categoryLeader?.category_points?.toFixed(1) || '0'} pts`}
              icon={Trophy}
              color="blue"
              logo={categoryHighlightStats.categoryLeader?.logo}
              teamName={categoryHighlightStats.categoryLeader?.team_name}
              tooltip="El equipo con más puntos en el ranking actual de esta categoría."
              useLogoAsBackground={true}
            />
            <StatsBlock
              title="Equipo Revelación"
              value={categoryHighlightStats.categoryRevelation?.team_name || 'N/A'}
              subtitle={`+${categoryHighlightStats.categoryRevelation?.points_gained?.toFixed(1) || '0'} pts`}
              icon={BarChart3}
              color="yellow"
              logo={categoryHighlightStats.categoryRevelation?.logo}
              teamName={categoryHighlightStats.categoryRevelation?.team_name}
              tooltip="El equipo que ha ganado más puntos en esta categoría comparando la temporada actual con la anterior."
              useLogoAsBackground={true}
            />
            <StatsBlock
              title="Subida en el ranking"
              value={categoryHighlightStats.categoryBiggestRise?.team_name || 'N/A'}
              subtitle={`+${categoryHighlightStats.categoryBiggestRise?.positions_gained || 0} puestos`}
              icon={TrendingUp}
              color="green"
              logo={categoryHighlightStats.categoryBiggestRise?.logo}
              teamName={categoryHighlightStats.categoryBiggestRise?.team_name}
              tooltip="El equipo que ha subido más posiciones en esta categoría comparando la temporada actual con la anterior."
              useLogoAsBackground={true}
            />
            <StatsBlock
              title="Mejor Filial"
              value={categoryHighlightStats.categoryBestFilial?.team_name || 'Sin filiales'}
              subtitle={categoryHighlightStats.categoryBestFilial ? `${categoryHighlightStats.categoryBestFilial.category_points?.toFixed(1) || '0'} pts` : 'No hay filiales'}
              icon={Users}
              color="purple"
              logo={categoryHighlightStats.categoryBestFilial?.logo}
              teamName={categoryHighlightStats.categoryBestFilial?.team_name}
              tooltip="El equipo filial mejor clasificado en esta categoría."
              useLogoAsBackground={true}
            />
            <StatsBlock
              title="Líder histórico"
              value={categoryHighlightStats.categoryBestHistorical?.team_name || 'N/A'}
              subtitle={`${categoryHighlightStats.categoryBestHistorical?.historical_points?.toFixed(1) || '0'} pts`}
              icon={Star}
              color="orange"
              logo={categoryHighlightStats.categoryBestHistorical?.logo}
              teamName={categoryHighlightStats.categoryBestHistorical?.team_name}
              tooltip="El equipo con más puntos acumulados en esta categoría desde que se registran datos en el ranking, en todas las temporadas sin aplicar coeficientes."
              useLogoAsBackground={true}
            />
            <StatsBlock
              title="Equipos Nuevos"
              value={categoryHighlightStats.categoryNewTeams || 0}
              subtitle={categoryHighlightStats.categoryNewTeamsNames && categoryHighlightStats.categoryNewTeamsNames.length > 0
                ? categoryHighlightStats.categoryNewTeamsNames.join(', ')
                : 'En esta temporada'}
              icon={Users}
              color="red"
              tooltip="Equipos nuevos desde que se registran datos en el ranking (solo tienen puntos en la temporada actual de esta categoría)."
            />
          </div>
        )}

        {/* Estadísticas destacadas con tooltips */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
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
                <TrendingUp className="w-8 h-8 text-green-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Equipos Nuevos</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.new_teams}</p>
                </div>
              </div>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                Equipos nuevos desde que se registran datos en el ranking{referenceSeason ? ` (solo tienen puntos en ${referenceSeason})` : ''}
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

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header con controles estilo UEFA */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <currentTab.icon className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                {currentTab?.label} - Temporada {currentReferenceSeason || referenceSeason}
                </h2>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>
                  {rankingTypeToUse === 'clubs' 
                    ? `${finalRankingData?.length || 0} clubes` 
                    : `${finalRankingData?.length || 0} equipos`
                  }
                </span>
                {rankingTypeToUse === 'historical' && (
                  <span className="text-xs text-gray-500">• Suma total histórica</span>
                )}
                {rankingTypeToUse === 'clubs' && (
                  <span className="text-xs text-gray-500">• Incluye filiales</span>
                )}
              </div>
            </div>
          
            {/* Controles de tabla estilo UEFA */}
            <div className="flex items-center justify-end">
                <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Temporada:</label>
                  <select 
                value={selectedSeasonForDetailedView || referenceSeason || ''}
                onChange={(e) => setSelectedSeasonForDetailedView(e.target.value || null)}
                    className="text-sm border border-gray-300 rounded px-3 py-1 bg-white"
                  >
                {allSeasons.map((season) => {
                  const year1 = season.split('-')[0]
                  const year2 = season.split('-')[1]
                  return (
                    <option key={season} value={season}>{year1}/{year2}</option>
                  )
                })}
                </select>
              </div>
            </div>
          </div>

        {/* Tabla estilo UEFA - wrapper con animación expandir/colapsar */}
        <div
          className="overflow-hidden transition-[max-height] duration-500 ease-in-out"
          style={{ maxHeight: showAllResults ? '5000px' : '760px' }}
          onTransitionEnd={() => { if (isCollapsing) setIsCollapsing(false) }}
        >
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posición</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cambio</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipo</th>
                {seasons.map((season, index) => {
                  const year1 = season.split('-')[0]
                  const year2 = season.split('-')[1]
                  const coefficient = coefficients[index] || 0
                  
                  return (
                    <th key={season} className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex flex-col">
                        <span>{year1}/{year2}</span>
                        {rankingTypeToUse !== 'historical' && (
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
              {rankingDataWithRecalculatedPoints?.slice(0, (showAllResults || isCollapsing) ? undefined : 10).map((team, index) => {
                const isEvenRow = index % 2 === 1
                
                return (
                  <tr key={team.team_id} className={`hover:bg-gray-50 ${isEvenRow ? 'bg-gray-50' : 'bg-white'}`}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center">
                        {getRankIcon(index + 1)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
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
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <TeamLogo name={team.team_name} logo={team.logo} size="sm" />
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{team.team_name}</div>
                          {team.region_name && (
                            <div className="text-xs text-gray-500">{team.region_name}</div>
                          )}
                          {rankingTypeToUse === 'clubs' && team.teams_count && team.teams_count > 1 && (
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
        </div>

        {/* Footer estilo UEFA */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                if (showAllResults) {
                  setIsCollapsing(true)
                  setShowAllResults(false)
                } else {
                  setShowAllResults(true)
                }
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              {showAllResults ? 'Ver solo top 10' : 'Ver ranking completo'}
            </button>
            <div className="text-xs text-gray-500">
              Última actualización: {new Date().toLocaleDateString('es-ES')} {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
        </div>
      </div>
    )
  }


  // Renderizar pestaña de Análisis de Equipos
  const renderAnalysisTab = () => {
    if (isLoading) {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Cargando datos...</p>
          </div>
        </div>
      )
    }

    if (error || !rankingData) {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center text-red-500">
            <p>Error al cargar los datos del ranking</p>
          </div>
        </div>
      )
    }

    const analysisData = getAnalysisData();
    const positionData = getPositionAnalysisData();

    return (
      <div>
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
                    ? 'bg-blue-100 text-blue-700 border border-gray-200'
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
                  <TeamLogo name={team.team_name} logo={team.logo} size="sm" />
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
                      <TeamLogo name={team.team_name} logo={team.logo} size="sm" />
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
                      ? 'bg-blue-100 text-blue-700 border border-gray-200'
                      : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  Evolución de Puntos
                </button>
                <button
                  onClick={() => setAnalysisView('positions')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    analysisView === 'positions'
                      ? 'bg-blue-100 text-blue-700 border border-gray-200'
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
                  hoveredPoint={hoveredPoint}
                  setHoveredPoint={setHoveredPoint}
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
                        <TeamLogo name={team.team_name} logo={rankingData?.find(t => t.team_id === team.team_id)?.logo} size="sm" />
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
                          <TeamLogo name={team.team_name} logo={rankingData?.find(t => t.team_id === team.team_id)?.logo} size="sm" />
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

  // Renderizar pestaña de Estadísticas Avanzadas
  const renderAdvancedTab = () => {
    if (isLoading) {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Cargando datos...</p>
          </div>
        </div>
      )
    }

    if (error || !rankingData) {
      return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center text-red-500">
            <p>Error al cargar los datos del ranking</p>
          </div>
        </div>
      )
    }

    return (
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
                    <span className="text-lg font-semibold text-blue-600">{count as number}</span>
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
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header principal */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">Rankings FEDV</h1>
          <p className="text-gray-600">
            Clasificación oficial de equipos por superficie y temporada
          </p>
        </div>

        {/* Submenú horizontal */}
        <div className="mb-0">
          <nav className="flex space-x-8 border-b-2 border-gray-300 bg-white rounded-t-lg px-6 pt-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`py-4 px-2 border-b-3 font-semibold text-base transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                style={activeTab === tab.id ? { borderBottomWidth: '3px' } : {}}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
          
          {/* Sub-pestañas (solo para general y categorías) */}
          {activeTab !== 'summary' && (
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-2">
              <div className="flex items-center space-x-1">
                {(() => {
                  const subTabs = [
                    { id: 'ranking', label: 'Ranking', icon: BarChart3 },
                    { id: 'historical', label: 'Ranking histórico', icon: Star },
                    { id: 'clubs', label: 'Ranking de clubes', icon: Users },
                    { id: 'analysis', label: 'Gráficas de análisis', icon: LineChart },
                    { id: 'advanced', label: 'Estadísticas avanzadas', icon: MapPin }
                  ]
                  return subTabs.map((subTab) => (
                    <button
                      key={subTab.id}
                      onClick={() => setDetailedViewMode(subTab.id as 'ranking' | 'historical' | 'clubs' | 'analysis' | 'advanced')}
                      className={`px-4 py-2 text-sm font-medium flex items-center space-x-1.5 transition-colors rounded-md ${
                        detailedViewMode === subTab.id
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <subTab.icon className={`w-3.5 h-3.5 ${detailedViewMode === subTab.id ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span>{subTab.label}</span>
                    </button>
                  ))
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Contenido principal */}
        <div className="mt-6">
          {activeTab === 'summary' ? renderSummaryView() : 
           activeTab === 'general' ? renderGeneralView() : 
           renderDetailedView()}
        </div>
      </div>
    </div>
  )
}

export default RankingPageNew
