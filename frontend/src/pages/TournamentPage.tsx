import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import {
  Trophy,
  Calendar,
  MapPin,
  Users,
  Award,
  ChevronLeft,
  Crown,
  Medal,
  Target,
  BarChart3,
  TrendingUp,
  Clock
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Tournament, Position, TournamentType, Surface, Modality } from '@/types'

// Mock data - reemplazar con llamadas a la API real
const mockTournamentData: Tournament = {
  id: '1',
  name: 'Campeonato de España 1ª División',
  type: TournamentType.CE1,
  year: 2024,
  surface: Surface.Grass,
  modality: Modality.Open,
  regionId: null,
  region: null,
  positions: []
}

// Mock data para posiciones del torneo
const mockPositions: Position[] = [
  {
    id: '1',
    tournamentId: '1',
    teamId: '1',
    position: 1,
    points: 1000,
    year: 2024,
    team: {
      id: '1',
      name: 'Madrid Ultimate Club',
      club: 'MUC',
      regionId: '1',
      email: 'info@muc.es',
      region: { id: '1', name: 'Madrid', coefficient: 1.2 }
    }
  },
  {
    id: '2',
    tournamentId: '1',
    teamId: '2',
    position: 2,
    points: 850,
    year: 2024,
    team: {
      id: '2',
      name: 'Barcelona Frisbee',
      club: 'BCN Frisbee',
      regionId: '2',
      email: 'contact@bcnfrisbee.cat',
      region: { id: '2', name: 'Cataluña', coefficient: 1.15 }
    }
  },
  {
    id: '3',
    tournamentId: '1',
    teamId: '3',
    position: 3,
    points: 725,
    year: 2024,
    team: {
      id: '3',
      name: 'Valencia Ultimate',
      club: 'VU',
      regionId: '3',
      email: 'info@valenciaultimate.com',
      region: { id: '3', name: 'Comunidad Valenciana', coefficient: 1.05 }
    }
  },
  {
    id: '4',
    tournamentId: '1',
    teamId: '4',
    position: 4,
    points: 625,
    year: 2024,
    team: {
      id: '4',
      name: 'Sevilla Disc Golf',
      club: 'SDG',
      regionId: '4',
      email: 'contact@sevilladisc.com',
      region: { id: '4', name: 'Andalucía', coefficient: 0.95 }
    }
  },
  {
    id: '5',
    tournamentId: '1',
    teamId: '5',
    position: 5,
    points: 520,
    year: 2024,
    team: {
      id: '5',
      name: 'Bilbao Ultimate',
      club: 'BU',
      regionId: '5',
      email: 'info@bilbaoultimate.com',
      region: { id: '5', name: 'País Vasco', coefficient: 0.90 }
    }
  }
]

// Mock data para estadísticas del torneo
const tournamentStats = {
  totalTeams: 12,
  totalPoints: 4500,
  averagePoints: 375,
  regionsRepresented: 8,
  duration: '3 días',
  location: 'Madrid, España'
}

// Tabla de puntos para CE1
const pointsTable = [
  { position: 1, points: 1000 },
  { position: 2, points: 850 },
  { position: 3, points: 725 },
  { position: 4, points: 625 },
  { position: 5, points: 520 },
  { position: 6, points: 450 },
  { position: 7, points: 380 },
  { position: 8, points: 320 },
  { position: 9, points: 270 },
  { position: 10, points: 230 },
  { position: 11, points: 195 },
  { position: 12, points: 165 }
]

const TournamentPage = () => {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<'results' | 'teams' | 'statistics'>('results')

  // Mock API calls - reemplazar con llamadas reales
  const { data: tournament, isLoading: tournamentLoading } = useQuery(
    ['tournament', id],
    async () => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return mockTournamentData
    },
    {
      initialData: mockTournamentData
    }
  )

  const { data: positions, isLoading: positionsLoading } = useQuery(
    ['tournament-positions', id],
    async () => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return mockPositions
    },
    {
      initialData: mockPositions
    }
  )

  if (tournamentLoading || positionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Torneo no encontrado</h1>
          <p className="text-gray-600 mb-4">El torneo que buscas no existe o ha sido eliminado.</p>
          <Link to="/tournaments" className="btn-primary">
            Volver a torneos
          </Link>
        </div>
      </div>
    )
  }

  // Funciones helper
  const getTournamentIcon = (type: TournamentType) => {
    switch (type) {
      case TournamentType.CE1:
        return <Crown className="w-6 h-6 text-yellow-600" />
      case TournamentType.CE2:
        return <Medal className="w-6 h-6 text-gray-600" />
      case TournamentType.Regional:
        return <Award className="w-6 h-6 text-blue-600" />
      default:
        return <Trophy className="w-6 h-6 text-primary-600" />
    }
  }

  const getTypeLabel = (type: TournamentType) => {
    switch (type) {
      case TournamentType.CE1:
        return 'CE 1ª División'
      case TournamentType.CE2:
        return 'CE 2ª División'
      case TournamentType.Regional:
        return 'Regional'
      default:
        return type
    }
  }

  const getSurfaceLabel = (surface: Surface) => {
    switch (surface) {
      case Surface.Grass:
        return 'Césped'
      case Surface.Beach:
        return 'Playa'
      default:
        return surface
    }
  }

  const getModalityLabel = (modality: Modality) => {
    switch (modality) {
      case Modality.Open:
        return 'Open'
      case Modality.Women:
        return 'Women'
      case Modality.Mixed:
        return 'Mixed'
      default:
        return modality
    }
  }

  // Calcular estadísticas
  const totalPoints = positions?.reduce((sum, pos) => sum + pos.points, 0) || 0
  const averagePoints = positions?.length ? Math.round(totalPoints / positions.length) : 0
  const regionsCount = new Set(positions?.map(pos => pos.team?.region?.name)).size || 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header con navegación */}
      <div className="mb-6">
        <Link
          to="/tournaments"
          className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Volver a torneos
        </Link>

        {/* Información principal del torneo */}
        <div className="card">
          <div className="flex items-start space-x-6">
            <div className="w-20 h-20 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
              {getTournamentIcon(tournament.type)}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">{tournament.name}</h1>
                  <p className="text-lg text-gray-600">{tournament.year}</p>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-primary-600">{getTypeLabel(tournament.type)}</div>
                  <div className="text-sm text-gray-600">Categoría</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Año</div>
                    <div className="font-medium">{tournament.year}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Superficie</div>
                    <div className="font-medium">{getSurfaceLabel(tournament.surface)}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Modalidad</div>
                    <div className="font-medium">{getModalityLabel(tournament.modality)}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Ubicación</div>
                    <div className="font-medium">{tournamentStats.location}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="card text-center">
          <Users className="w-8 h-8 text-primary-600 mx-auto mb-2" />
          <h4 className="text-lg font-semibold text-gray-900 mb-1">Equipos</h4>
          <p className="text-2xl font-bold text-primary-600">{tournamentStats.totalTeams}</p>
          <p className="text-sm text-gray-600">participantes</p>
        </div>

        <div className="card text-center">
          <Trophy className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
          <h4 className="text-lg font-semibold text-gray-900 mb-1">Puntos totales</h4>
          <p className="text-2xl font-bold text-primary-600">{totalPoints.toLocaleString()}</p>
          <p className="text-sm text-gray-600">otorgados</p>
        </div>

        <div className="card text-center">
          <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <h4 className="text-lg font-semibold text-gray-900 mb-1">Regiones</h4>
          <p className="text-2xl font-bold text-primary-600">{regionsCount}</p>
          <p className="text-sm text-gray-600">representadas</p>
        </div>

        <div className="card text-center">
          <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <h4 className="text-lg font-semibold text-gray-900 mb-1">Duración</h4>
          <p className="text-2xl font-bold text-primary-600">{tournamentStats.duration}</p>
          <p className="text-sm text-gray-600">de competición</p>
        </div>
      </div>

      {/* Pestañas de navegación */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'results', label: 'Resultados', icon: Trophy },
            { id: 'teams', label: 'Equipos', icon: Users },
            { id: 'statistics', label: 'Estadísticas', icon: BarChart3 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-1 py-2 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Contenido de las pestañas */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          {/* Tabla de posiciones */}
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Clasificación Final</h3>

            <div className="space-y-3">
              {positions?.map((position, index) => (
                <div
                  key={position.id}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    index === 0
                      ? 'bg-yellow-50 border-2 border-yellow-200'
                      : index === 1
                      ? 'bg-gray-50 border-2 border-gray-200'
                      : index === 2
                      ? 'bg-orange-50 border-2 border-orange-200'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${
                      index === 0
                        ? 'bg-yellow-500 text-white'
                        : index === 1
                        ? 'bg-gray-400 text-white'
                        : index === 2
                        ? 'bg-orange-500 text-white'
                        : 'bg-primary-100 text-primary-600'
                    }`}>
                      #{position.position}
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <Link
                          to={`/teams/${position.team?.id}`}
                          className="font-semibold text-gray-900 hover:text-primary-600 transition-colors"
                        >
                          {position.team?.name}
                        </Link>
                        {position.team?.region && (
                          <p className="text-sm text-gray-600 flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {position.team.region.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-600">{position.points}</div>
                    <div className="text-sm text-gray-600">puntos</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabla de puntos del torneo */}
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Tabla de Puntos - {getTypeLabel(tournament.type)}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Posición</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Puntos</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Posición</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {pointsTable.reduce((rows: any[], point, index) => {
                    if (index % 2 === 0) {
                      rows.push([point, pointsTable[index + 1]].filter(Boolean))
                    }
                    return rows
                  }, []).map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-gray-100">
                      {row.map((point: any, colIndex: number) => (
                        <React.Fragment key={colIndex}>
                          <td className="py-3 px-4 text-gray-600">#{point.position}</td>
                          <td className="py-3 px-4 text-right font-semibold text-primary-600">
                            {point.points}
                          </td>
                        </React.Fragment>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'teams' && (
        <div className="space-y-6">
          {/* Lista de equipos participantes */}
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Equipos Participantes ({positions?.length || 0})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {positions?.map(position => (
                <Link
                  key={position.team?.id}
                  to={`/teams/${position.team?.id}`}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <span className="font-bold text-primary-600">#{position.position}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                        {position.team?.name}
                      </h4>
                      {position.team?.region && (
                        <p className="text-sm text-gray-600 flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {position.team.region.name} • Coeficiente: {position.team.region.coefficient}x
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-semibold text-primary-600">{position.points} pts</div>
                    <div className="text-sm text-gray-600">puntos</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Distribución por regiones */}
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Equipos por Región</h3>
            <div className="space-y-3">
              {Object.entries(
                positions?.reduce((acc: any, pos) => {
                  const regionName = pos.team?.region?.name || 'Sin región'
                  acc[regionName] = (acc[regionName] || 0) + 1
                  return acc
                }, {}) || {}
              ).map(([region, count]) => (
                <div key={region} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span className="font-medium">{region}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{count} equipos</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${(count as number / (positions?.length || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'statistics' && (
        <div className="space-y-6">
          {/* Gráfico de distribución de puntos */}
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Distribución de Puntos</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={positions?.map(pos => ({
                  position: pos.position,
                  points: pos.points,
                  team: pos.team?.name?.split(' ')[0]
                })) || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="position" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="points" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Estadísticas detalladas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Métricas del Torneo</h4>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Puntos totales otorgados:</span>
                  <span className="font-semibold">{totalPoints.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Puntos promedio por equipo:</span>
                  <span className="font-semibold">{averagePoints}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mayor puntuación:</span>
                  <span className="font-semibold text-green-600">
                    {Math.max(...(positions?.map(p => p.points) || [0]))} pts
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Menor puntuación:</span>
                  <span className="font-semibold text-red-600">
                    {Math.min(...(positions?.map(p => p.points) || [0]))} pts
                  </span>
                </div>
              </div>
            </div>

            <div className="card">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Información del Torneo</h4>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Categoría:</span>
                  <span className="font-semibold">{getTypeLabel(tournament.type)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Año:</span>
                  <span className="font-semibold">{tournament.year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Superficie:</span>
                  <span className="font-semibold">{getSurfaceLabel(tournament.surface)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Modalidad:</span>
                  <span className="font-semibold">{getModalityLabel(tournament.modality)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TournamentPage
