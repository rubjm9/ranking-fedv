import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import {
  Trophy,
  MapPin,
  Mail,
  Calendar,
  TrendingUp,
  Award,
  Users,
  BarChart3,
  ChevronLeft,
  Crown,
  Medal
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { Team, Position } from '@/types'

// Mock data - reemplazar con llamadas a la API real
const mockTeamData: Team = {
  id: '1',
  name: 'Madrid Ultimate Club',
  club: 'MUC',
  regionId: '1',
  email: 'info@muc.es',
  logo: '/logos/muc.png',
  region: { id: '1', name: 'Madrid', coefficient: 1.2 },
  positions: []
}

// Mock data para posiciones históricas
const mockPositions: Position[] = [
  { id: '1', tournamentId: '1', teamId: '1', position: 3, points: 725, year: 2024 },
  { id: '2', tournamentId: '2', teamId: '1', position: 5, points: 520, year: 2024 },
  { id: '3', tournamentId: '3', teamId: '1', position: 1, points: 1000, year: 2023 },
  { id: '4', tournamentId: '4', teamId: '1', position: 2, points: 850, year: 2023 },
  { id: '5', tournamentId: '5', teamId: '1', position: 4, points: 625, year: 2022 },
  { id: '6', tournamentId: '6', teamId: '1', position: 3, points: 725, year: 2022 }
]

// Mock data para evolución de puntos
const evolutionData = [
  { year: '2021', points: 1200, position: 5 },
  { year: '2022', points: 1350, position: 4 },
  { year: '2023', points: 1850, position: 2 },
  { year: '2024', points: 1245, position: 3 }
]

const TeamPage = () => {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'statistics'>('overview')

  // Mock API calls - reemplazar con llamadas reales
  const { data: team, isLoading: teamLoading } = useQuery(
    ['team', id],
    async () => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return mockTeamData
    },
    {
      initialData: mockTeamData
    }
  )

  const { data: positions, isLoading: positionsLoading } = useQuery(
    ['team-positions', id],
    async () => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return mockPositions
    },
    {
      initialData: mockPositions
    }
  )

  if (teamLoading || positionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Equipo no encontrado</h1>
          <p className="text-gray-600 mb-4">El equipo que buscas no existe o ha sido eliminado.</p>
          <Link to="/teams" className="btn-primary">
            Volver a equipos
          </Link>
        </div>
      </div>
    )
  }

  // Calcular estadísticas
  const bestPosition = Math.min(...(positions?.map(p => p.position) || []))
  const averagePosition = positions?.length ?
    (positions.reduce((sum, p) => sum + p.position, 0) / positions.length).toFixed(1) : '0'
  const totalPoints = positions?.reduce((sum, p) => sum + p.points, 0) || 0
  const tournamentsPlayed = positions?.length || 0

  const ce1Positions = positions?.filter(p => p.points >= 625) || []
  const ce2Positions = positions?.filter(p => p.points >= 120 && p.points < 625) || []
  const regionalPositions = positions?.filter(p => p.points < 120) || []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header con navegación */}
      <div className="mb-6">
        <Link
          to="/teams"
          className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Volver a equipos
        </Link>

        {/* Información principal del equipo */}
        <div className="card">
          <div className="flex items-start space-x-6">
            <div className="w-20 h-20 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Trophy className="w-10 h-10 text-primary-600" />
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">{team.name}</h1>
                  {team.club && (
                    <p className="text-lg text-gray-600">{team.club}</p>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-primary-600">#{averagePosition}</div>
                  <div className="text-sm text-gray-600">Posición media</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Región</div>
                    <div className="font-medium">{team.region?.name}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Contacto</div>
                    <div className="font-medium">{team.email}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Torneos jugados</div>
                    <div className="font-medium">{tournamentsPlayed}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Mejor posición</div>
                    <div className="font-medium">#{bestPosition}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pestañas de navegación */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Resumen', icon: BarChart3 },
            { id: 'history', label: 'Historial', icon: Calendar },
            { id: 'statistics', label: 'Estadísticas', icon: TrendingUp }
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
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Gráfico de evolución */}
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Evolución de puntos acumulados</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="points"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card text-center">
              <Crown className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <h4 className="text-lg font-semibold text-gray-900 mb-1">CE 1ª División</h4>
              <p className="text-2xl font-bold text-primary-600">{ce1Positions.length}</p>
              <p className="text-sm text-gray-600">torneos jugados</p>
            </div>

            <div className="card text-center">
              <Medal className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <h4 className="text-lg font-semibold text-gray-900 mb-1">CE 2ª División</h4>
              <p className="text-2xl font-bold text-primary-600">{ce2Positions.length}</p>
              <p className="text-sm text-gray-600">torneos jugados</p>
            </div>

            <div className="card text-center">
              <Trophy className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h4 className="text-lg font-semibold text-gray-900 mb-1">Torneos Regionales</h4>
              <p className="text-2xl font-bold text-primary-600">{regionalPositions.length}</p>
              <p className="text-sm text-gray-600">torneos jugados</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Historial de posiciones por año */}
          {Object.entries(
            positions?.reduce((acc, pos) => {
              if (!acc[pos.year]) acc[pos.year] = []
              acc[pos.year].push(pos)
              return acc
            }, {} as Record<number, Position[]>) || {}
          ).map(([year, yearPositions]) => (
            <div key={year} className="card">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{year}</h3>
              <div className="space-y-3">
                {yearPositions.map(position => (
                  <div key={position.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-primary-600" />
                      </div>
                      <div>
                        <div className="font-medium">Torneo {position.tournamentId}</div>
                        <div className="text-sm text-gray-600">Posición #{position.position}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-primary-600">{position.points} pts</div>
                      <div className="text-sm text-gray-600">puntos</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'statistics' && (
        <div className="space-y-6">
          {/* Gráfico de posiciones por año */}
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Posiciones por año</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis reversed />
                  <Tooltip />
                  <Bar dataKey="position" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              * Escala invertida: posición 1 es la mejor
            </p>
          </div>

          {/* Estadísticas detalladas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Resumen de rendimiento</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total de puntos:</span>
                  <span className="font-semibold">{totalPoints}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Torneos jugados:</span>
                  <span className="font-semibold">{tournamentsPlayed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mejor posición:</span>
                  <span className="font-semibold">#{bestPosition}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Posición media:</span>
                  <span className="font-semibold">#{averagePosition}</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Coeficiente regional</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Región:</span>
                  <span className="font-semibold">{team.region?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Coeficiente:</span>
                  <span className="font-semibold text-primary-600">{team.region?.coefficient}x</span>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Coeficiente</span>
                    <span>{team.region?.coefficient}x</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, ((team.region?.coefficient || 0) / 1.2) * 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0.80x</span>
                    <span>1.20x</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeamPage
