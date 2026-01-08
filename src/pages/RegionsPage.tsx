import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Users, TrendingUp, Trophy, ChevronRight, BarChart3, Loader2 } from 'lucide-react'
import { regionsService } from '@/services/apiService'
import hybridRankingService from '@/services/hybridRankingService'
import { supabase } from '@/services/supabaseService'

const RegionsPage = () => {
  const [sortBy, setSortBy] = useState<'name' | 'coefficient' | 'teams' | 'points'>('coefficient')
  const [regionStats, setRegionStats] = useState<{
    mostActive: { name: string; count: number } | null
    mostCompetitive: { name: string; avgPoints: number } | null
    bestRegion: { name: string; totalPoints: number } | null
  }>({
    mostActive: null,
    mostCompetitive: null,
    bestRegion: null
  })

  // Obtener regiones desde la API
  const { data: regionsData, isLoading, error } = useQuery({
    queryKey: ['regions'],
    queryFn: () => regionsService.getAll()
  })

  const regions = regionsData?.data || []

  // Calcular estadísticas de regiones
  useEffect(() => {
    const calculateRegionStats = async () => {
      try {
        // Obtener temporada más reciente
        const referenceSeason = await hybridRankingService.getMostRecentSeason()
        
        // Obtener datos de todas las categorías
        const categories = ['beach_mixed', 'beach_open', 'beach_women', 'grass_mixed', 'grass_open', 'grass_women']
        const allCategoryData = await Promise.all(
          categories.map(cat => hybridRankingService.getRankingFromSeasonPoints(cat as any, referenceSeason))
        )

        // Calcular ranking global sumando todas las categorías
        const teamGlobalPoints: { [key: string]: { team: any, totalPoints: number } } = {}
        
        allCategoryData.forEach(categoryData => {
          categoryData.forEach((team) => {
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

        const globalRanking = Object.values(teamGlobalPoints)
          .map(item => ({
            ...item.team,
            global_points: item.totalPoints
          }))

        // Obtener información de regiones de los equipos
        const teamIds = globalRanking.map(team => team.team_id)
        const { data: teamsData } = await supabase
          .from('teams')
          .select('id, regionId, regions:regionId(id, name)')
          .in('id', teamIds)

        // Crear mapa de regiones por equipo
        const teamRegionMap = new Map(
          teamsData?.map(team => [team.id, team.regions?.name || 'Sin región']) || []
        )

        // Calcular estadísticas por región
        const regionStatsMap: { [regionName: string]: { count: number, totalPoints: number, teams: any[] } } = {}

        globalRanking.forEach(team => {
          const regionName = teamRegionMap.get(team.team_id) || 'Sin región'
          if (!regionStatsMap[regionName]) {
            regionStatsMap[regionName] = { count: 0, totalPoints: 0, teams: [] }
          }
          regionStatsMap[regionName].count++
          regionStatsMap[regionName].totalPoints += team.global_points || 0
          regionStatsMap[regionName].teams.push(team)
        })

        // Región más activa (más equipos)
        const mostActive = Object.entries(regionStatsMap)
          .map(([name, data]) => ({ name, count: data.count }))
          .sort((a, b) => b.count - a.count)[0]

        // Región más competitiva (mayor promedio de puntos)
        const mostCompetitive = Object.entries(regionStatsMap)
          .map(([name, data]) => ({
            name,
            avgPoints: data.count > 0 ? data.totalPoints / data.count : 0
          }))
          .sort((a, b) => b.avgPoints - a.avgPoints)[0]

        // Mejor región (mayor suma total de puntos)
        const bestRegion = Object.entries(regionStatsMap)
          .map(([name, data]) => ({ name, totalPoints: data.totalPoints }))
          .sort((a, b) => b.totalPoints - a.totalPoints)[0]

        setRegionStats({
          mostActive: mostActive || null,
          mostCompetitive: mostCompetitive || null,
          bestRegion: bestRegion || null
        })
      } catch (error) {
        console.error('Error calculando estadísticas de regiones:', error)
      }
    }

    if (regions.length > 0) {
      calculateRegionStats()
    }
  }, [regions])

  // Ordenar regiones
  const sortedRegions = [...regions].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'coefficient':
        return b.coefficient - a.coefficient
      case 'teams':
        return (b.teams?.length || 0) - (a.teams?.length || 0)
      case 'points':
        return 0 // Por ahora no tenemos puntos totales por región
      default:
        return 0
    }
  })

  // Estadísticas globales
  const totalRegions = regions.length
  const totalTeams = regions.reduce((sum, region) => sum + (region.teams?.length || 0), 0)
  const averageCoefficient = regions.length ?
    (regions.reduce((sum, region) => sum + region.coefficient, 0) / regions.length).toFixed(2) : '0.00'

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-4">Error al cargar las regiones</div>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Regiones</h1>
        <p className="text-xl text-gray-600">
          Explora las regiones participantes en el Ranking FEDV
        </p>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Regiones</p>
              <p className="text-2xl font-bold text-gray-900">{totalRegions}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Equipos</p>
              <p className="text-2xl font-bold text-gray-900">{totalTeams}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Coef. Promedio</p>
              <p className="text-2xl font-bold text-gray-900">{averageCoefficient}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas destacadas de regiones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border-2 border-blue-200 bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Región Activa</h3>
              <p className="text-lg font-bold text-gray-900">{regionStats.mostActive?.name || 'N/A'}</p>
              <p className="text-xs text-gray-600 mt-1">{regionStats.mostActive?.count || 0} equipos</p>
            </div>
            <MapPin className="w-6 h-6 text-blue-600 opacity-60" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-2 border-green-200 bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Región Competitiva</h3>
              <p className="text-lg font-bold text-gray-900">{regionStats.mostCompetitive?.name || 'N/A'}</p>
              <p className="text-xs text-gray-600 mt-1">{regionStats.mostCompetitive?.avgPoints?.toFixed(1) || '0'} pts</p>
            </div>
            <Trophy className="w-6 h-6 text-green-600 opacity-60" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-2 border-yellow-200 bg-yellow-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Mejor Región</h3>
              <p className="text-lg font-bold text-gray-900">{regionStats.bestRegion?.name || 'N/A'}</p>
              <p className="text-xs text-gray-600 mt-1">{regionStats.bestRegion?.totalPoints?.toFixed(1) || '0'} pts</p>
            </div>
            <BarChart3 className="w-6 h-6 text-yellow-600 opacity-60" />
          </div>
        </div>
      </div>

      {/* Filtros de ordenación */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Ordenar por:</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('name')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                sortBy === 'name'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Nombre
            </button>
            <button
              onClick={() => setSortBy('coefficient')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                sortBy === 'coefficient'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Coeficiente
            </button>
            <button
              onClick={() => setSortBy('teams')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                sortBy === 'teams'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Equipos
            </button>
          </div>
        </div>
      </div>

      {/* Lista de regiones */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedRegions.map((region) => (
            <Link
              key={region.id}
              to={`/regions/${region.id}`}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 p-6 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {region.name}
                    </h3>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Coeficiente:</span>
                  <span className="text-sm font-medium text-blue-600">
                    {region.coefficient.toFixed(2)}x
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Equipos:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {region.teams?.length || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Torneos:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {region.tournaments?.length || 0}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default RegionsPage
