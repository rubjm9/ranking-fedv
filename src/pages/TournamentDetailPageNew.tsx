import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Calendar, MapPin, Trophy, Users, BarChart3, Award, Clock } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { tournamentsService } from '../services/apiService'
import { translateSurface, translateModality, translateTournamentType, getStatusLabel, getStatusColor } from '../utils/translations'

interface Tournament {
  id: string
  name: string
  year: number
  type: string
  surface: string
  modality: string
  regionId?: string
  region?: {
    id: string
    name: string
    coefficient: number
  }
  startDate?: string
  endDate?: string
  description?: string
  season?: string
  split?: string
  is_finished?: boolean
  regional_coefficient?: number
  positions?: Position[]
}

interface Position {
  id: string
  tournamentId: string
  teamId: string
  position: number
  points: number
  team?: {
    id: string
    name: string
    region?: {
      name: string
    }
  }
}

interface TeamPosition {
  id: string
  position: number
  team: {
    id: string
    name: string
    region: string
    logo: string
  }
  points: number
  coefficient: number
}

interface RegionStats {
  name: string
  teams: number
  percentage: number
  color: string
}

const TournamentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  
  // Obtener datos del torneo usando React Query
  const { data: tournamentData, isLoading: tournamentLoading, error: tournamentError } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => tournamentsService.getById(id!),
    enabled: !!id,
    retry: 1
  })

  const tournament = tournamentData?.data

  // Procesar posiciones reales del torneo
  const positions: TeamPosition[] = tournament?.positions?.map(pos => ({
    id: pos.id,
    position: pos.position,
    team: {
      id: pos.team?.id || '',
      name: pos.team?.name || 'Equipo desconocido',
      region: pos.team?.region?.name || 'Sin región',
      logo: 'https://via.placeholder.com/40'
    },
    points: pos.points,
    coefficient: tournament.regional_coefficient || 1.0
  })).sort((a, b) => a.position - b.position) || []

  // Calcular estadísticas de región basadas en datos reales
  const regionStats: RegionStats[] = React.useMemo(() => {
    const regionCounts: { [key: string]: number } = {}
    positions.forEach(pos => {
      const regionName = pos.team.region
      regionCounts[regionName] = (regionCounts[regionName] || 0) + 1
    })

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']
    return Object.entries(regionCounts).map(([name, teams], index) => ({
      name,
      teams,
      percentage: (teams / positions.length) * 100,
      color: colors[index % colors.length]
    }))
  }, [positions])

  // Calcular estadísticas del torneo
  const totalPoints = positions.reduce((sum, pos) => sum + pos.points, 0)
  const totalTeams = positions.length

  // Función para obtener el icono de posición
  const getPositionIcon = (position: number) => {
    if (position === 1) return <Award className="h-5 w-5 text-yellow-500" />
    if (position === 2) return <Award className="h-5 w-5 text-gray-400" />
    if (position === 3) return <Award className="h-5 w-5 text-orange-500" />
    return <Trophy className="h-4 w-4 text-gray-400" />
  }

  // Función para formatear fechas
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Sin fecha'
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (tournamentLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando torneo...</p>
        </div>
      </div>
    )
  }

  if (tournamentError || !tournament) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Torneo no encontrado</h1>
          <p className="text-gray-600 mb-6">El torneo que buscas no existe o ha sido eliminado.</p>
          <Link
            to="/tournaments"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a torneos
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <Link
            to="/tournaments"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver a torneos
          </Link>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{tournament.name}</h1>
            <p className="text-xl text-gray-600">{translateTournamentType(tournament.type)}</p>
          </div>
        </div>

        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-600 mb-1">Año</h3>
            <p className="text-2xl font-bold text-gray-900">{tournament.year}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <Users className="h-8 w-8 text-green-600 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-600 mb-1">Equipos</h3>
            <p className="text-2xl font-bold text-gray-900">{totalTeams}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-600 mb-1">Puntos Totales</h3>
            <p className="text-2xl font-bold text-gray-900">{totalPoints.toLocaleString()}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <Trophy className="h-8 w-8 text-orange-600 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-600 mb-1">Estado</h3>
            <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(tournament.is_finished)}`}>
              {getStatusLabel(tournament.is_finished)}
            </span>
          </div>
        </div>

        {/* Información del torneo */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Sobre el torneo</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                {tournament.description || 'El campeonato más importante de España para equipos de primera división. Celebrado en diferentes ciudades cada año con la participación de los mejores equipos del país.'}
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <Trophy className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-600">Tipo:</span>
                  <span className="ml-2 font-medium text-gray-900">{translateTournamentType(tournament.type)}</span>
                </div>
                
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-600">Superficie:</span>
                  <span className="ml-2 font-medium text-gray-900">{translateSurface(tournament.surface)}</span>
                </div>
                
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-600">Modalidad:</span>
                  <span className="ml-2 font-medium text-gray-900">{translateModality(tournament.modality)}</span>
                </div>
                
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-600">Región:</span>
                  <span className="ml-2 font-medium text-gray-900">{tournament.region?.name || 'Sin región'}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Fechas</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-600">Inicio:</span>
                  <span className="ml-2 font-medium text-gray-900">{formatDate(tournament.startDate)}</span>
                </div>
                
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-600">Fin:</span>
                  <span className="ml-2 font-medium text-gray-900">{formatDate(tournament.endDate)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Distribución por regiones */}
        {regionStats.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Distribución por regiones</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="flex justify-center">
                <ResponsiveContainer width={300} height={300}>
                  <PieChart>
                    <Pie
                      data={regionStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="teams"
                    >
                      {regionStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex flex-col justify-center">
                <div className="space-y-3">
                  {regionStats.map((region, index) => (
                    <div key={index} className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-3" 
                        style={{ backgroundColor: region.color }}
                      />
                      <span className="text-gray-900 font-medium">{region.name}</span>
                      <span className="ml-auto text-gray-600">{region.teams} equipos</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resultados finales */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Resultados finales</h2>
          
          {positions.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay resultados disponibles</h3>
              <p className="text-gray-600">Este torneo aún no tiene resultados registrados.</p>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Coeficiente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Puntos
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {positions.map((position) => (
                    <tr key={position.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getPositionIcon(position.position)}
                          <span className="ml-2 text-sm font-medium text-gray-900">
                            {position.position}°
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img
                              className="h-10 w-10 rounded-full"
                              src={position.team.logo}
                              alt={position.team.name}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {position.team.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{position.team.region}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{position.coefficient}x</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{position.points}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TournamentDetailPage


