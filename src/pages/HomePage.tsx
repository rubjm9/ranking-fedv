import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, Trophy, Users, MapPin, Calendar, TrendingUp, TrendingDown, BarChart3, Eye } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { homePageService, HomePageTeam, HomePageRegion, HomePageTournament, HomePageStats, RankingHistory } from '@/services/homePageService'
import TeamLogo from '@/components/ui/TeamLogo'

const HomePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [selectedYear, setSelectedYear] = useState('all')
  const [teams, setTeams] = useState<HomePageTeam[]>([])
  const [regions, setRegions] = useState<HomePageRegion[]>([])
  const [recentTournaments, setRecentTournaments] = useState<HomePageTournament[]>([])
  const [rankingHistory, setRankingHistory] = useState<RankingHistory[]>([])
  const [mainStats, setMainStats] = useState<HomePageStats>({
    totalTeams: 0,
    totalTournaments: 0,
    totalRegions: 0,
    averagePoints: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Cargar todos los datos en paralelo
      const [teamsData, regionsData, tournamentsData, statsData, historyData] = await Promise.all([
        homePageService.getTopTeams(10),
        homePageService.getRegions(),
        homePageService.getRecentTournaments(4),
        homePageService.getMainStats(),
        homePageService.getRankingHistory()
      ])

      setTeams(teamsData)
      setRegions(regionsData)
      setRecentTournaments(tournamentsData)
      setMainStats(statsData)
      setRankingHistory(historyData)
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrar equipos
  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRegion = selectedRegion === 'all' || team.regionCode === selectedRegion
    return matchesSearch && matchesRegion
  })

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <BarChart3 className="h-4 w-4 text-gray-400" />
  }

  const getChangeText = (change: number) => {
    if (change > 0) return `+${change}`
    if (change < 0) return `${change}`
    return '-'
  }

  const getTournamentTypeLabel = (type: string) => {
    switch (type) {
      case 'CE1': return 'CE1'
      case 'CE2': return 'CE2'
      case 'REGIONAL': return 'Regional'
      case 'INTERNATIONAL': return 'Internacional'
      default: return type
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800'
      case 'ongoing': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'upcoming': return 'Próximo'
      case 'ongoing': return 'En curso'
      case 'completed': return 'Completado'
      default: return status
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-600">Cargando datos...</span>
        </div>
      ) : (
        <>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Ranking FEDV
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              El ranking oficial de Ultimate Frisbee en España
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/ranking"
                className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Ver Ranking Completo
              </Link>
              <Link
                to="/teams"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors"
              >
                Explorar Equipos
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Equipos Activos</p>
                <p className="text-2xl font-bold text-gray-900">{mainStats.totalTeams}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Trophy className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Torneos 2024</p>
                <p className="text-2xl font-bold text-gray-900">{mainStats.totalTournaments}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MapPin className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Regiones</p>
                <p className="text-2xl font-bold text-gray-900">{mainStats.totalRegions}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Promedio Puntos</p>
                <p className="text-2xl font-bold text-gray-900">{mainStats.averagePoints.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ranking Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-12">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Ranking Actual</h2>
              <Link
                to="/ranking"
                className="text-primary-600 hover:text-primary-700 font-medium flex items-center"
              >
                Ver completo
                <Eye className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar equipos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">Todas las regiones</option>
                  {regions.map((region) => (
                    <option key={region.id} value={region.code}>
                      {region.name}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">Todos los años</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                </select>
              </div>
            </div>
          </div>

          {/* Ranking Table */}
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
                    Puntos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cambio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Torneos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTeams.slice(0, 10).map((team) => (
                  <tr key={team.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">{team.currentRank}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/teams/${team.id}`}
                        className="flex items-center text-sm font-medium text-gray-900 hover:text-primary-600"
                      >
                        <TeamLogo 
                          name={team.name} 
                          logo={team.logo} 
                          size="sm"
                        />
                        <div className="ml-3">
                          <div>{team.name}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {team.region || 'Sin región'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{team.points.toFixed(1)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{team.tournaments}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/teams/${team.id}`}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        Ver detalles
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts and Recent Tournaments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Ranking Evolution Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Evolución del Ranking</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={rankingHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="totalTeams" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Número total de equipos activos
            </p>
          </div>

          {/* Recent Tournaments */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Torneos Recientes</h3>
            <div className="space-y-4">
              {recentTournaments.map((tournament) => (
                <Link
                  key={tournament.id}
                  to={`/tournaments/${tournament.id}`}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
                      <Trophy className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{tournament.name}</h4>
                      <p className="text-sm text-gray-500">
                        {getTournamentTypeLabel(tournament.type)} • {tournament.teams} equipos
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(tournament.status)}`}>
                      {getStatusLabel(tournament.status)}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">{tournament.startDate}</p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Link
                to="/tournaments"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Ver todos los torneos
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/teams"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Equipos</h3>
                <p className="text-gray-600">Explora todos los equipos participantes</p>
              </div>
            </div>
          </Link>
          <Link
            to="/tournaments"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Trophy className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Torneos</h3>
                <p className="text-gray-600">Consulta resultados y calendario</p>
              </div>
            </div>
          </Link>
          <Link
            to="/regions"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MapPin className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Regiones</h3>
                <p className="text-gray-600">Descubre las regiones participantes</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
      )}
    </div>
  )
}

export default HomePage
