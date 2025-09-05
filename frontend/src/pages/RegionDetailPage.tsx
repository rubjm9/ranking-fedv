import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Users, Trophy, Calendar, BarChart3, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface Region {
  id: string
  name: string
  code: string
  coefficient: number
  description: string
  teams: number
  tournaments: number
  averagePoints: number
  totalPoints: number
  createdAt: string
}

interface Team {
  id: string
  name: string
  club: string
  logo: string
  currentRank: number
  points: number
  tournaments: number
}

interface Tournament {
  id: string
  name: string
  year: number
  type: string
  teams: number
  status: string
  startDate: string
}

interface RankingHistory {
  date: string
  averageRank: number
  totalPoints: number
}

const RegionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [isLoading, setIsLoading] = useState(false)
  const [region, setRegion] = useState<Region | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [rankingHistory, setRankingHistory] = useState<RankingHistory[]>([])

  // Mock data - en producción vendría de la API
  const mockRegion: Region = {
    id: '13',
    name: 'Madrid',
    code: 'MAD',
    coefficient: 1.2,
    description: 'Comunidad de Madrid - Región con mayor concentración de equipos de Ultimate Frisbee en España. Cuenta con una gran tradición en el deporte y numerosos clubes activos.',
    teams: 15,
    tournaments: 8,
    averagePoints: 1150.3,
    totalPoints: 17254.5,
    createdAt: '2024-01-15'
  }

  const mockTeams: Team[] = [
    { id: '1', name: 'Madrid Ultimate Club', club: 'MUC', logo: 'https://via.placeholder.com/40', currentRank: 1, points: 1250.5, tournaments: 8 },
    { id: '2', name: 'Madrid Frisbee', club: 'MF', logo: 'https://via.placeholder.com/40', currentRank: 3, points: 1100.2, tournaments: 6 },
    { id: '3', name: 'Alcalá Ultimate', club: 'AU', logo: 'https://via.placeholder.com/40', currentRank: 5, points: 980.7, tournaments: 5 },
    { id: '4', name: 'Getafe Disc Golf', club: 'GDG', logo: 'https://via.placeholder.com/40', currentRank: 8, points: 850.3, tournaments: 4 },
    { id: '5', name: 'Fuenlabrada Ultimate', club: 'FU', logo: 'https://via.placeholder.com/40', currentRank: 12, points: 720.1, tournaments: 3 }
  ]

  const mockTournaments: Tournament[] = [
    { id: '1', name: 'CE1 2024', year: 2024, type: 'CE1', teams: 24, status: 'completed', startDate: '2024-06-15' },
    { id: '2', name: 'Regional Madrid 2024', year: 2024, type: 'REGIONAL', teams: 12, status: 'completed', startDate: '2024-03-20' },
    { id: '3', name: 'CE2 2023', year: 2023, type: 'CE2', teams: 18, status: 'completed', startDate: '2023-06-10' },
    { id: '4', name: 'Regional Madrid 2023', year: 2023, type: 'REGIONAL', teams: 10, status: 'completed', startDate: '2023-03-15' }
  ]

  const mockRankingHistory: RankingHistory[] = [
    { date: '2024-01', averageRank: 4.2, totalPoints: 17254.5 },
    { date: '2023-12', averageRank: 5.1, totalPoints: 15890.2 },
    { date: '2023-11', averageRank: 6.3, totalPoints: 14200.7 },
    { date: '2023-10', averageRank: 7.8, totalPoints: 12850.3 },
    { date: '2023-09', averageRank: 8.5, totalPoints: 11520.1 },
    { date: '2023-08', averageRank: 9.2, totalPoints: 10250.8 }
  ]

  useEffect(() => {
    loadRegionData()
  }, [id])

  const loadRegionData = async () => {
    setIsLoading(true)
    try {
      // Mock API call - en producción sería una llamada real
      await new Promise(resolve => setTimeout(resolve, 500))
      setRegion(mockRegion)
      setTeams(mockTeams)
      setTournaments(mockTournaments)
      setRankingHistory(mockRankingHistory)
    } catch (error) {
      console.error('Error al cargar datos de la región:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getCoefficientColor = (coefficient: number) => {
    if (coefficient >= 1.5) return 'text-green-600'
    if (coefficient >= 1.0) return 'text-blue-600'
    if (coefficient >= 0.8) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getCoefficientLevel = (coefficient: number) => {
    if (coefficient >= 1.5) return 'Alto'
    if (coefficient >= 1.0) return 'Medio'
    if (coefficient >= 0.8) return 'Bajo'
    return 'Muy Bajo'
  }

  const getCoefficientLevelColor = (coefficient: number) => {
    if (coefficient >= 1.5) return 'bg-green-100 text-green-800'
    if (coefficient >= 1.0) return 'bg-blue-100 text-blue-800'
    if (coefficient >= 0.8) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getTournamentTypeLabel = (type: string) => {
    switch (type) {
      case 'CE1': return 'Campeonato España 1ª División'
      case 'CE2': return 'Campeonato España 2ª División'
      case 'REGIONAL': return 'Campeonato Regional'
      default: return type
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600">Cargando región...</span>
      </div>
    )
  }

  if (!region) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Región no encontrada</h2>
        <p className="text-gray-600 mt-2">La región que buscas no existe o ha sido eliminada.</p>
        <Link to="/" className="mt-4 inline-flex items-center text-primary-600 hover:text-primary-700">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al inicio
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center">
          <Link
            to="/"
            className="mr-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{region.name}</h1>
          </div>
        </div>
      </div>

      {/* Region Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Equipos</p>
              <p className="text-2xl font-bold text-gray-900">{region.teams}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Trophy className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Torneos</p>
              <p className="text-2xl font-bold text-gray-900">{region.tournaments}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Coeficiente</p>
              <p className={`text-2xl font-bold ${getCoefficientColor(region.coefficient)}`}>
                {region.coefficient.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Promedio Puntos</p>
              <p className="text-2xl font-bold text-gray-900">{region.averagePoints.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Region Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Region Description */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Sobre la Región</h3>
            <p className="text-gray-600 leading-relaxed mb-6">{region.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Estadísticas</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Total de puntos:</span>
                    <span className="font-medium">{region.totalPoints.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Promedio por equipo:</span>
                    <span className="font-medium">{region.averagePoints.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Equipos en top 10:</span>
                    <span className="font-medium">3</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Equipos en top 50:</span>
                    <span className="font-medium">12</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Coeficiente Regional</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Valor actual:</span>
                    <span className={`font-medium ${getCoefficientColor(region.coefficient)}`}>
                      {region.coefficient.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Nivel:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCoefficientLevelColor(region.coefficient)}`}>
                      {getCoefficientLevel(region.coefficient)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Última actualización:</span>
                    <span className="font-medium">2024-01-15</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coefficient Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Evolución del Coeficiente</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={rankingHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="averageRank" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Promedio de ranking de equipos de la región
          </p>
        </div>
      </div>

      {/* Teams */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Equipos de la Región</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Club
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ranking
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Puntos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Torneos
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teams.map((team) => (
                <tr key={team.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      to={`/teams/${team.id}`}
                      className="flex items-center text-sm font-medium text-gray-900 hover:text-primary-600"
                    >
                      {team.logo && (
                        <img
                          src={team.logo}
                          alt={`Logo de ${team.name}`}
                          className="w-8 h-8 rounded mr-3"
                        />
                      )}
                      {team.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{team.club}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">#{team.currentRank}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{team.points.toFixed(1)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{team.tournaments}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tournaments */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Torneos Organizados</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Torneo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Año
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tournaments.map((tournament) => (
                <tr key={tournament.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      to={`/tournaments/${tournament.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-primary-600"
                    >
                      {tournament.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{tournament.year}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{getTournamentTypeLabel(tournament.type)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{tournament.teams}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Completado
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{tournament.startDate}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default RegionDetailPage
