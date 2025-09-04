import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import {
  MapPin,
  Users,
  TrendingUp,
  Trophy,
  BarChart3,
  Calendar,
  Award,
  ChevronLeft,
  Target,
  Crown,
  Medal
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Region, Team } from '@/types'

// Mock data - reemplazar con llamadas a la API real
const mockRegionData: Region = {
  id: '1',
  name: 'Madrid',
  code: 'MAD',
  coefficient: 1.20,
  floor: 0.8,
  ceiling: 1.5,
  increment: 0.1,
}

// Mock data para equipos de la región
const mockRegionTeams: Team[] = [
  {
    id: '1',
    name: 'Madrid Ultimate Club',
    club: 'MUC',
    regionId: '1',
    email: 'info@muc.es',
    region: { id: '1', name: 'Madrid', code: 'MAD', coefficient: 1.2, floor: 0.8, ceiling: 1.5, increment: 0.1 },
    positions: []
  },
  {
    id: '2',
    name: 'Madrid Frisbee Masters',
    club: 'MFM',
    regionId: '1',
    email: 'contact@mfm.es',
    region: { id: '1', name: 'Madrid', code: 'MAD', coefficient: 1.2, floor: 0.8, ceiling: 1.5, increment: 0.1 },
    positions: []
  },
  {
    id: '3',
    name: 'Ultimate Madrid',
    club: 'UM',
    regionId: '1',
    email: 'info@ultimatemadrid.com',
    region: { id: '1', name: 'Madrid', code: 'MAD', coefficient: 1.2, floor: 0.8, ceiling: 1.5, increment: 0.1 },
    positions: []
  },
  {
    id: '4',
    name: 'Madrid Disc Sports',
    club: 'MDS',
    regionId: '1',
    email: 'contact@mds.es',
    region: { id: '1', name: 'Madrid', coefficient: 1.2 },
    positions: []
  }
]

// Mock data para evolución del coeficiente
const coefficientEvolution = [
  { year: '2021', coefficient: 1.05, points: 2100 },
  { year: '2022', coefficient: 1.12, points: 2350 },
  { year: '2023', coefficient: 1.18, points: 2680 },
  { year: '2024', coefficient: 1.20, points: 2750 }
]

// Mock data para distribución de puntos
const pointsDistribution = [
  { name: 'CE 1ª División', value: 45, color: '#fbbf24' },
  { name: 'CE 2ª División', value: 30, color: '#6b7280' },
  { name: 'Regionales', value: 25, color: '#3b82f6' }
]

const RegionPage = () => {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'statistics'>('overview')

  // Mock API calls - reemplazar con llamadas reales
  const { data: region, isLoading: regionLoading } = useQuery(
    ['region', id],
    async () => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return mockRegionData
    },
    {
      initialData: mockRegionData
    }
  )

  const { data: teams, isLoading: teamsLoading } = useQuery(
    ['region-teams', id],
    async () => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return mockRegionTeams
    },
    {
      initialData: mockRegionTeams
    }
  )

  if (regionLoading || teamsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!region) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Región no encontrada</h1>
          <p className="text-gray-600 mb-4">La región que buscas no existe o ha sido eliminada.</p>
          <Link to="/regions" className="btn-primary">
            Volver a regiones
          </Link>
        </div>
      </div>
    )
  }

  // Calcular estadísticas
  const totalTeams = teams?.length || 0
  const totalPoints = coefficientEvolution.reduce((sum, year) => sum + year.points, 0)
  const averagePoints = totalPoints / coefficientEvolution.length
  const topTeam = teams?.[0] // Simplificado para mock data

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header con navegación */}
      <div className="mb-6">
        <Link
          to="/regions"
          className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Volver a regiones
        </Link>

        {/* Información principal de la región */}
        <div className="card">
          <div className="flex items-start space-x-6">
            <div className="w-20 h-20 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <MapPin className="w-10 h-10 text-primary-600" />
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">{region.name}</h1>
                  <p className="text-lg text-gray-600">Región de España</p>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-primary-600">{region.coefficient}x</div>
                  <div className="text-sm text-gray-600">Coeficiente actual</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Equipos activos</div>
                    <div className="font-medium">{totalTeams}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Puntos totales</div>
                    <div className="font-medium">{totalPoints.toLocaleString()}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Puntos promedio</div>
                    <div className="font-medium">{Math.round(averagePoints).toLocaleString()}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Equipo destacado</div>
                    <div className="font-medium">{topTeam?.name.split(' ')[0]}...</div>
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
            { id: 'teams', label: 'Equipos', icon: Users },
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
          {/* Coeficiente regional detallado */}
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Coeficiente Regional</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Coeficiente actual:</span>
                    <span className="font-semibold text-primary-600 text-lg">{region.coefficient}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Suelo mínimo:</span>
                    <span className="font-medium">0.80x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Techo máximo:</span>
                    <span className="font-medium">1.20x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Incremento:</span>
                    <span className="font-medium">0.01 por cada 100 puntos</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-2">
                  <div className="flex justify-between text-sm">
                    <span>Coeficiente</span>
                    <span>{region.coefficient}x</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mt-1">
                    <div
                      className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, ((region.coefficient - 0.8) / 0.4) * 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0.80x</span>
                    <span>1.20x</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-primary-50 rounded-lg">
                  <p className="text-sm text-primary-800">
                    <strong>¿Cómo se calcula?</strong><br />
                    El coeficiente se basa en el rendimiento colectivo de todos los equipos
                    de la región en los Campeonatos de España de las últimas temporadas.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Evolución del coeficiente */}
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Evolución del Coeficiente</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={coefficientEvolution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis domain={[0.8, 1.2]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="coefficient"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ fill: '#2563eb', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Distribución de puntos */}
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Distribución de Puntos por Categoría</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pointsDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pointsDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-4">
                {pointsDistribution.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <span className="text-lg font-semibold">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'teams' && (
        <div className="space-y-6">
          {/* Lista de equipos de la región */}
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Equipos de {region.name} ({totalTeams})
            </h3>

            <div className="space-y-4">
              {teams?.map(team => (
                <Link
                  key={team.id}
                  to={`/teams/${team.id}`}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                        {team.name}
                      </h4>
                      {team.club && (
                        <p className="text-sm text-gray-600">{team.club}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Coeficiente regional</div>
                      <div className="font-semibold text-primary-600">{region.coefficient}x</div>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors transform rotate-180" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Estadísticas de equipos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card text-center">
              <Crown className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <h4 className="text-lg font-semibold text-gray-900 mb-1">Equipos Elite</h4>
              <p className="text-2xl font-bold text-primary-600">
                {teams?.filter(team => team.club?.includes('Club')).length || 0}
              </p>
              <p className="text-sm text-gray-600">clubes principales</p>
            </div>

            <div className="card text-center">
              <Medal className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <h4 className="text-lg font-semibold text-gray-900 mb-1">Equipos Activos</h4>
              <p className="text-2xl font-bold text-primary-600">{totalTeams}</p>
              <p className="text-sm text-gray-600">en competición</p>
            </div>

            <div className="card text-center">
              <Award className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h4 className="text-lg font-semibold text-gray-900 mb-1">Promedio Regional</h4>
              <p className="text-2xl font-bold text-primary-600">#{Math.floor(Math.random() * 10) + 1}</p>
              <p className="text-sm text-gray-600">posición media</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'statistics' && (
        <div className="space-y-6">
          {/* Estadísticas históricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Rendimiento por Año</h4>
              <div className="space-y-3">
                {coefficientEvolution.map(year => (
                  <div key={year.year} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{year.year}</div>
                      <div className="text-sm text-gray-600">{year.points.toLocaleString()} puntos</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-primary-600">{year.coefficient}x</div>
                      <div className="text-sm text-gray-600">coeficiente</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Métricas Clave</h4>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Puntos totales acumulados:</span>
                  <span className="font-semibold">{totalPoints.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Promedio anual:</span>
                  <span className="font-semibold">{Math.round(averagePoints).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mejor coeficiente:</span>
                  <span className="font-semibold text-green-600">
                    {Math.max(...coefficientEvolution.map(y => y.coefficient))}x
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Crecimiento último año:</span>
                  <span className="font-semibold text-blue-600">
                    +{(region.coefficient - coefficientEvolution[coefficientEvolution.length - 2].coefficient).toFixed(2)}x
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Información adicional */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sobre el Sistema Regional</h3>
            <div className="prose prose-sm max-w-none text-gray-600">
              <p>
                El sistema de coeficientes regionales está diseñado para fomentar el desarrollo del ultimate frisbee
                en todas las comunidades autónomas de España. Las regiones con mejor rendimiento colectivo reciben
                un coeficiente más alto, lo que beneficia a todos sus equipos en las competiciones regionales.
              </p>
              <p className="mt-2">
                Este sistema asegura una competición equilibrada y motiva a las federaciones regionales a
                invertir en el crecimiento del deporte en sus territorios.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RegionPage
