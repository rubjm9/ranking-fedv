import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Users, MapPin, Trophy, Calendar, TrendingUp, BarChart3, Mail, ExternalLink, Star, Award, Target } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { teamDetailService, TeamDetailData, TournamentResult, RankingHistory, SeasonBreakdown } from '@/services/teamDetailService'
import TeamLogo from '@/components/ui/TeamLogo'
import GeneralRankingChart from '@/components/charts/GeneralRankingChart'

const TeamDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [isLoading, setIsLoading] = useState(false)
  const [teamData, setTeamData] = useState<TeamDetailData | null>(null)
  const [relatedTeams, setRelatedTeams] = useState<any[]>([])

  useEffect(() => {
    loadTeamData()
  }, [id])

  const loadTeamData = async () => {
    if (!id) return
    
    setIsLoading(true)
    try {
      // Cargar datos detallados del equipo
      const data = await teamDetailService.getTeamDetailData(id)
      setTeamData(data)
      
      // Cargar equipos relacionados
      const related = await teamDetailService.getRelatedTeams(id)
      setRelatedTeams(related)
    } catch (error) {
      console.error('Error al cargar datos del equipo:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      'beach_mixed': 'Playa Mixto',
      'beach_open': 'Playa Open',
      'beach_women': 'Playa Women',
      'grass_mixed': 'Césped Mixto',
      'grass_open': 'Césped Open',
      'grass_women': 'Césped Women'
    }
    return labels[category] || category
  }

  const getTournamentTypeLabel = (type: string) => {
    switch (type) {
      case 'CE1': return 'Campeonato España 1ª División'
      case 'CE2': return 'Campeonato España 2ª División'
      case 'REGIONAL': return 'Campeonato Regional'
      case 'INTERNATIONAL': return 'Torneo Internacional'
      default: return type
    }
  }

  const getPositionColor = (position: number) => {
    if (position === 1) return 'bg-yellow-100 text-yellow-800'
    if (position === 2) return 'bg-gray-100 text-gray-800'
    if (position === 3) return 'bg-orange-100 text-orange-800'
    return 'bg-blue-100 text-blue-800'
  }

  const getSurfaceIcon = (surface: string) => {
    return surface === 'BEACH' ? '🏖️' : '🌱'
  }

  const getModalityIcon = (modality: string) => {
    switch (modality) {
      case 'OPEN': return '👨‍👨‍👦'
      case 'WOMEN': return '👩‍👩‍👧'
      case 'MIXED': return '👨‍👩‍👧‍👦'
      default: return '👥'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600">Cargando equipo...</span>
      </div>
    )
  }

  if (!teamData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Equipo no encontrado</h2>
        <p className="text-gray-600 mt-2">El equipo que buscas no existe o ha sido eliminado.</p>
        <Link to="/ranking" className="mt-4 inline-flex items-center text-primary-600 hover:text-primary-700">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al ranking
        </Link>
      </div>
    )
  }

  const { team, currentRankings, tournamentResults, rankingHistory, seasonBreakdown, statistics } = teamData

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/ranking"
            className="flex items-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 p-2"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">Volver al ranking</span>
          </Link>
          
        </div>
        
        {/* Team Info and Rankings */}
        <div className="flex items-start justify-between">
          {/* Team Info - Left Side */}
          <div className="flex items-center">
            <div className="mr-8">
              <TeamLogo 
                logo={team.logo} 
                name={team.name} 
                size="xl"
                className="h-40 w-40"
              />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{team.name}</h1>
              <p className="text-lg text-gray-600 mb-1">
                {team.isFilial && team.parentTeam ? (
                  <>Equipo filial de <Link to={`/teams/${team.parentTeamId}`} className="font-medium text-primary-600 hover:text-primary-700 underline">{team.parentTeam.name}</Link></>
                ) : (
                  team.location || team.region?.name || 'Sin ubicación'
                )}
              </p>
              {team.region && (
                <p className="text-sm text-gray-500">
                  Región: {team.region.name}
                </p>
              )}
            </div>
          </div>

          {/* Estadísticas Detalladas - Right Side */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 w-80">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas Detalladas</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600 font-medium">Mejor posición global:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {statistics.bestPosition > 0 ? `#${statistics.bestPosition}` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600 font-medium">Peor posición global:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {statistics.worstPosition > 0 ? `#${statistics.worstPosition}` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600 font-medium">Acumulación histórica:</span>
                <span className="text-sm font-semibold text-gray-900">{statistics.totalPoints.toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600 font-medium">Temporadas activas:</span>
                <span className="text-sm font-semibold text-gray-900">{statistics.seasonsActive}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600 font-medium">Categorías jugadas:</span>
                <span className="text-sm font-semibold text-gray-900">{statistics.categoriesPlayed.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-xl">
              <Trophy className="h-7 w-7 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Torneos Ganados</p>
              <p className="text-3xl font-bold text-gray-900">{statistics.tournamentsWon}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Target className="h-7 w-7 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ranking global</p>
              <p className="text-3xl font-bold text-gray-900">
                {statistics.globalPosition ? `#${statistics.globalPosition}` : 'N/A'}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Calendar className="h-7 w-7 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Torneos</p>
              <p className="text-3xl font-bold text-gray-900">{statistics.totalTournaments}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-xl">
              <Award className="h-7 w-7 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Podios</p>
              <p className="text-3xl font-bold text-gray-900">{statistics.podiums}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content - All sections shown sequentially */}
      <div className="space-y-10">
        {/* Team Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">Información del Equipo</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <Users className="h-4 w-4 text-gray-400 mr-3" />
                <span className="text-gray-600">Tipo:</span>
                <span className="ml-2 font-medium">
                  {team.isFilial ? 'Equipo Filial' : 'Equipo Principal'}
                </span>
              </div>
              
              {team.location && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-gray-400 mr-3" />
                  <span className="text-gray-600">Ubicación:</span>
                  <span className="ml-2 font-medium">{team.location}</span>
                </div>
              )}
              
              {team.email && (
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-400 mr-3" />
                  <span className="text-gray-600">Email:</span>
                  <a href={`mailto:${team.email}`} className="ml-2 font-medium text-primary-600 hover:text-primary-700">
                    {team.email}
                  </a>
                </div>
              )}
              
              {team.hasDifferentNames && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Nombres por Modalidad:</h4>
                  <div className="space-y-1 text-sm">
                    {team.nameOpen && <div><span className="text-gray-600">Open:</span> {team.nameOpen}</div>}
                    {team.nameWomen && <div><span className="text-gray-600">Women:</span> {team.nameWomen}</div>}
                    {team.nameMixed && <div><span className="text-gray-600">Mixed:</span> {team.nameMixed}</div>}
                  </div>
                </div>
              )}
            </div>
          </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Rankings por Categoría</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoría
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Posición
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Puntos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cambio
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(currentRankings).map(([category, ranking]) => (
                      <tr key={category}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="mr-2">{getSurfaceIcon(category.split('_')[0])}</span>
                            <span className="mr-2">{getModalityIcon(category.split('_')[1])}</span>
                            <span className="text-sm font-medium text-gray-900">
                              {getCategoryLabel(category)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">#{ranking.position}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">{ranking.points.toFixed(1)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {ranking.change !== 0 ? (
                            <span className={`text-sm font-medium ${ranking.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {ranking.change > 0 ? '+' : ''}{ranking.change}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
        </div>

        {/* Related Teams */}
        {relatedTeams.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">Equipos Relacionados</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedTeams.map((relatedTeam) => (
                <Link
                  key={relatedTeam.id}
                  to={`/teams/${relatedTeam.id}`}
                  className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <TeamLogo name={relatedTeam.name} size="sm" />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">{relatedTeam.name}</div>
                    <div className="text-xs text-gray-500">
                      {relatedTeam.isFilial ? 'Filial' : 'Principal'}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Tournament Results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-2xl font-semibold text-gray-900">Resultados en Torneos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Torneo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Temporada
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Posición
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Puntos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tournamentResults.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{result.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{result.season}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="mr-1">{getSurfaceIcon(result.surface)}</span>
                        <span className="mr-1">{getModalityIcon(result.modality)}</span>
                        <span className="text-sm text-gray-500">
                          {getCategoryLabel(`${result.surface.toLowerCase()}_${result.modality.toLowerCase()}`)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{getTournamentTypeLabel(result.type)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPositionColor(result.position)}`}>
                        {result.position}º
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{result.points}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {result.date ? new Date(result.date).toLocaleDateString('es-ES') : 'N/A'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ranking History Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <GeneralRankingChart 
            data={rankingHistory} 
            teamName={team.name}
            height={300}
            showPoints={true}
          />
        </div>

        {/* Season Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6">Desglose por Temporadas</h3>
          <div className="space-y-4">
            {seasonBreakdown.map((season) => (
              <div key={season.season} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-md font-medium text-gray-900">{season.season}</h4>
                  <span className="text-sm font-medium text-gray-600">
                    {season.totalPoints.toFixed(1)} puntos totales
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(season.categories).map(([category, data]) => (
                    <div key={category} className="bg-gray-50 rounded p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {getCategoryLabel(category)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {getSurfaceIcon(category.split('_')[0])} {getModalityIcon(category.split('_')[1])}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>{data.points.toFixed(1)} puntos</div>
                        <div>{data.tournaments} torneos</div>
                        <div>Mejor: {data.bestPosition}º</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Bottom spacing */}
      <div className="mb-8"></div>
    </div>
  )
}

export default TeamDetailPage
