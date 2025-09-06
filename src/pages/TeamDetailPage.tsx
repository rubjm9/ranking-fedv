import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Users, MapPin, Trophy, Calendar, TrendingUp, BarChart3, Mail, ExternalLink } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { teamsService } from '@/services/apiService'
import TeamLogo from '@/components/ui/TeamLogo'

interface Team {
  id: string
  name: string
  regionId: string
  location?: string
  email?: string
  logo?: string
  isFilial: boolean
  parentTeamId?: string
  hasDifferentNames: boolean
  nameOpen?: string
  nameWomen?: string
  nameMixed?: string
  createdAt: string
  updatedAt: string
  region?: {
    name: string
    coefficient: number
  }
  parentTeam?: {
    name: string
  }
  positions?: Position[]
}

interface Position {
  id: string
  position: number
  points: number
  tournaments: {
    name: string
    year: number
    type: string
    startDate?: string
    endDate?: string
  }
}

interface TournamentResult {
  id: string
  name: string
  year: number
  type: string
  position: number
  points: number
  date: string
}

interface RankingHistory {
  date: string
  rank: number
  points: number
}

const TeamDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [isLoading, setIsLoading] = useState(false)
  const [team, setTeam] = useState<Team | null>(null)
  const [tournamentResults, setTournamentResults] = useState<TournamentResult[]>([])
  const [rankingHistory, setRankingHistory] = useState<RankingHistory[]>([])

  // Mock data - en producción vendría de la API
  const mockTeam: Team = {
    id: '1',
    name: 'Madrid Ultimate Club',
    club: 'Madrid Ultimate Club',
    region: 'Madrid',
    regionCode: 'MAD',
    email: 'info@madridultimate.com',
    logo: 'https://via.placeholder.com/80',
    currentRank: 1,
    previousRank: 2,
    points: 1250.5,
    tournaments: 8,
    createdAt: '2024-01-15',
    description: 'Club pionero en Ultimate Frisbee en Madrid, fundado en 2024. Comprometido con el desarrollo del deporte y la formación de nuevos jugadores.'
  }

  const mockTournamentResults: TournamentResult[] = [
    { id: '1', name: 'CE1 2024', year: 2024, type: 'CE1', position: 1, points: 200, date: '2024-06-15' },
    { id: '2', name: 'CE2 2023', year: 2023, type: 'CE2', position: 2, points: 150, date: '2023-06-10' },
    { id: '3', name: 'Regional Madrid 2024', year: 2024, type: 'REGIONAL', position: 1, points: 100, date: '2024-03-20' },
    { id: '4', name: 'CE1 2023', year: 2023, type: 'CE1', position: 3, points: 120, date: '2023-06-12' },
    { id: '5', name: 'Regional Madrid 2023', year: 2023, type: 'REGIONAL', position: 2, points: 80, date: '2023-03-15' }
  ]

  const mockRankingHistory: RankingHistory[] = [
    { date: '2024-01', rank: 1, points: 1250.5 },
    { date: '2023-12', rank: 2, points: 1100.2 },
    { date: '2023-11', rank: 3, points: 980.7 },
    { date: '2023-10', rank: 4, points: 850.3 },
    { date: '2023-09', rank: 5, points: 720.1 },
    { date: '2023-08', rank: 6, points: 650.8 }
  ]

  useEffect(() => {
    loadTeamData()
  }, [id])

  const loadTeamData = async () => {
    if (!id) return
    
    setIsLoading(true)
    try {
      const response = await teamsService.getTeamDetails(id)
      if (response.success) {
        setTeam(response.data)
        
        // Convertir posiciones a resultados de torneos
        const tournamentResults = response.data.positions?.map(position => ({
          id: position.id,
          name: position.tournaments.name,
          year: position.tournaments.year,
          type: position.tournaments.type,
          position: position.position,
          points: position.points,
          date: position.tournaments.startDate || position.tournaments.endDate || ''
        })) || []
        
        setTournamentResults(tournamentResults)
        
        // Generar historial de ranking basado en los resultados
        const rankingHistory = generateRankingHistory(tournamentResults)
        setRankingHistory(rankingHistory)
      } else {
        throw new Error('No se pudo cargar el equipo')
      }
    } catch (error) {
      console.error('Error al cargar datos del equipo:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateRankingHistory = (results: TournamentResult[]) => {
    // Ordenar resultados por fecha
    const sortedResults = results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    // Generar historial acumulativo de puntos
    let cumulativePoints = 0
    return sortedResults.map((result, index) => {
      cumulativePoints += result.points
      return {
        date: new Date(result.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'short' }),
        rank: index + 1, // Ranking basado en orden cronológico
        points: cumulativePoints
      }
    })
  }

  const getTotalPoints = () => {
    return tournamentResults.reduce((total, result) => total + result.points, 0)
  }

  const getBestPosition = () => {
    if (tournamentResults.length === 0) return null
    return Math.min(...tournamentResults.map(r => r.position))
  }

  const getWorstPosition = () => {
    if (tournamentResults.length === 0) return null
    return Math.max(...tournamentResults.map(r => r.position))
  }

  const getAveragePoints = () => {
    if (tournamentResults.length === 0) return 0
    return getTotalPoints() / tournamentResults.length
  }

  const getTournamentsWon = () => {
    return tournamentResults.filter(r => r.position === 1).length
  }

  const getPodiums = () => {
    return tournamentResults.filter(r => r.position <= 3).length
  }

  const getTournamentTypeLabel = (type: string) => {
    switch (type) {
      case 'CE1': return 'Campeonato España 1ª División'
      case 'CE2': return 'Campeonato España 2ª División'
      case 'REGIONAL': return 'Campeonato Regional'
      default: return type
    }
  }

  const getPositionColor = (position: number) => {
    if (position === 1) return 'bg-yellow-100 text-yellow-800'
    if (position === 2) return 'bg-gray-100 text-gray-800'
    if (position === 3) return 'bg-orange-100 text-orange-800'
    return 'bg-blue-100 text-blue-800'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600">Cargando equipo...</span>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Equipo no encontrado</h2>
        <p className="text-gray-600 mt-2">El equipo que buscas no existe o ha sido eliminado.</p>
        <Link to="/" className="mt-4 inline-flex items-center text-primary-600 hover:text-primary-700">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al ranking
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center">
          <Link
            to="/"
            className="mr-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center">
            <div className="mr-4">
              <TeamLogo 
                logo={team.logo} 
                name={team.name} 
                size="xl"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
              <p className="text-gray-600">
                {team.isFilial && team.parentTeam ? (
                  <>Equipo filial de <span className="font-medium">{team.parentTeam.name}</span></>
                ) : (
                  team.location || team.region?.name || 'Sin ubicación'
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Trophy className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Torneos Ganados</p>
              <p className="text-2xl font-bold text-gray-900">{getTournamentsWon()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Puntos Totales</p>
              <p className="text-2xl font-bold text-gray-900">{getTotalPoints().toFixed(1)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Torneos</p>
              <p className="text-2xl font-bold text-gray-900">{tournamentResults.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <MapPin className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Región</p>
              <p className="text-lg font-bold text-gray-900">{team.region?.name || 'Sin región'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Team Description */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Equipo</h3>
            
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
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Estadísticas Rápidas</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Mejor posición:</span>
              <span className="font-medium">
                {getBestPosition() ? `${getBestPosition()}º lugar` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Peor posición:</span>
              <span className="font-medium">
                {getWorstPosition() ? `${getWorstPosition()}º lugar` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Promedio puntos:</span>
              <span className="font-medium">{getAveragePoints().toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Torneos ganados:</span>
              <span className="font-medium">{getTournamentsWon()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Podios:</span>
              <span className="font-medium">{getPodiums()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Ranking History Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Evolución del Ranking</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={rankingHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="rank" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Points History Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Evolución de Puntos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={rankingHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="points" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tournament Results */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Resultados en Torneos</h3>
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
                    <div className="text-sm text-gray-500">{result.year}</div>
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
                    <div className="text-sm text-gray-500">{result.date}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Bottom spacing */}
      <div className="mb-8"></div>
    </div>
  )
}

export default TeamDetailPage
