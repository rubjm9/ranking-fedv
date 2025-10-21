import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, Trophy, Users, MapPin, Calendar, TrendingUp, TrendingDown, BarChart3, Eye, Award, Target, Clock, Zap } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { homePageService, HomePageTeam, HomePageRegion, HomePageTournament, HomePageStats, RankingHistory } from '@/services/homePageService'
import TeamLogo from '@/components/ui/TeamLogo'

const HomePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [selectedYear, setSelectedYear] = useState('all')
  const [teams, setTeams] = useState<HomePageTeam[]>([])
  const [teamsByCategory, setTeamsByCategory] = useState<{[key: string]: HomePageTeam[]}>({})
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
      const [
        teamsData, 
        regionsData, 
        tournamentsData, 
        statsData, 
        historyData,
        beachMixedData,
        beachWomenData,
        beachOpenData,
        grassMixedData,
        grassWomenData,
        grassOpenData
      ] = await Promise.all([
        homePageService.getTopTeams(10),
        homePageService.getRegions(),
        homePageService.getRecentTournaments(4),
        homePageService.getMainStats(),
        homePageService.getRankingHistory(),
        homePageService.getTopTeamsByCategory('beach_mixed'),
        homePageService.getTopTeamsByCategory('beach_women'),
        homePageService.getTopTeamsByCategory('beach_open'),
        homePageService.getTopTeamsByCategory('grass_mixed'),
        homePageService.getTopTeamsByCategory('grass_women'),
        homePageService.getTopTeamsByCategory('grass_open')
      ])

      setTeams(teamsData)
      setTeamsByCategory({
        'beach_mixed': beachMixedData,
        'beach_women': beachWomenData,
        'beach_open': beachOpenData,
        'grass_mixed': grassMixedData,
        'grass_women': grassWomenData,
        'grass_open': grassOpenData
      })
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

        {/* Ranking Section - 6 Small Tables */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Ranking Actual</h2>
              <Link
                to="/ranking"
                className="text-primary-600 hover:text-primary-700 font-medium flex items-center"
              >
              Ver ranking completo
                <Eye className="h-4 w-4 ml-1" />
              </Link>
          </div>

          {/* 6 Small Ranking Tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Playa Mixto */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600">
                <h3 className="text-white font-semibold text-sm">🏖️ Playa Mixto</h3>
                </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pos</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Equipo</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teamsByCategory['beach_mixed']?.slice(0, 5).map((team, index) => (
                      <tr key={team.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900">{index + 1}</span>
                            {getChangeIcon(team.change)}
              </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <TeamLogo name={team.name} logo={team.logo} size="sm" />
                            <div className="ml-2">
                              <div className="text-sm font-medium text-gray-900">{team.name}</div>
                              <div className="text-xs text-gray-500">{team.region}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">{team.points.toFixed(1)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                <Link
                  to="/ranking?category=beach_mixed"
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Ver ranking completo →
              </Link>
            </div>
          </div>

            {/* Playa Women */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600">
                <h3 className="text-white font-semibold text-sm">🏖️ Playa Women</h3>
                </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pos</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Equipo</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pts</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                    {teamsByCategory['beach_women']?.slice(0, 5).map((team, index) => (
                  <tr key={team.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900">{index + 1}</span>
                            {getChangeIcon(team.change)}
              </div>
                    </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <TeamLogo name={team.name} logo={team.logo} size="sm" />
                            <div className="ml-2">
                              <div className="text-sm font-medium text-gray-900">{team.name}</div>
                              <div className="text-xs text-gray-500">{team.region}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">{team.points.toFixed(1)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                      <Link
                  to="/ranking?category=beach_women"
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Ver ranking completo →
                </Link>
                        </div>
            </div>

            {/* Playa Open */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600">
                <h3 className="text-white font-semibold text-sm">🏖️ Playa Open</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pos</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Equipo</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teamsByCategory['beach_open']?.slice(0, 5).map((team, index) => (
                      <tr key={team.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900">{index + 1}</span>
                            {getChangeIcon(team.change)}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <TeamLogo name={team.name} logo={team.logo} size="sm" />
                            <div className="ml-2">
                              <div className="text-sm font-medium text-gray-900">{team.name}</div>
                              <div className="text-xs text-gray-500">{team.region}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">{team.points.toFixed(1)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                <Link
                  to="/ranking?category=beach_open"
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Ver ranking completo →
                      </Link>
              </div>
            </div>

            {/* Césped Mixto */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-green-500 to-green-600">
                <h3 className="text-white font-semibold text-sm">🌱 Césped Mixto</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pos</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Equipo</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teamsByCategory['grass_mixed']?.slice(0, 5).map((team, index) => (
                      <tr key={team.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900">{index + 1}</span>
                            {getChangeIcon(team.change)}
                          </div>
                    </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <TeamLogo name={team.name} logo={team.logo} size="sm" />
                            <div className="ml-2">
                              <div className="text-sm font-medium text-gray-900">{team.name}</div>
                              <div className="text-xs text-gray-500">{team.region}</div>
                            </div>
                      </div>
                    </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">{team.points.toFixed(1)}</span>
                    </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                <Link
                  to="/ranking?category=grass_mixed"
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Ver ranking completo →
                </Link>
            </div>
          </div>

            {/* Césped Women */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600">
                <h3 className="text-white font-semibold text-sm">🌱 Césped Women</h3>
              </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pos</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Equipo</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pts</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                    {teamsByCategory['grass_women']?.slice(0, 5).map((team, index) => (
                  <tr key={team.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900">{index + 1}</span>
                            {getChangeIcon(team.change)}
                      </div>
                    </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <TeamLogo name={team.name} logo={team.logo} size="sm" />
                            <div className="ml-2">
                              <div className="text-sm font-medium text-gray-900">{team.name}</div>
                              <div className="text-xs text-gray-500">{team.region}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">{team.points.toFixed(1)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                      <Link
                  to="/ranking?category=grass_women"
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Ver ranking completo →
                </Link>
              </div>
            </div>

            {/* Césped Open */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-teal-500 to-teal-600">
                <h3 className="text-white font-semibold text-sm">🌱 Césped Open</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pos</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Equipo</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teamsByCategory['grass_open']?.slice(0, 5).map((team, index) => (
                      <tr key={team.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900">{index + 1}</span>
                            {getChangeIcon(team.change)}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <TeamLogo name={team.name} logo={team.logo} size="sm" />
                            <div className="ml-2">
                              <div className="text-sm font-medium text-gray-900">{team.name}</div>
                              <div className="text-xs text-gray-500">{team.region}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">{team.points.toFixed(1)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                <Link
                  to="/ranking?category=grass_open"
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Ver ranking completo →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* How Ranking Works Section */}
        <div className="mb-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">¿Cómo funciona el Ranking?</h2>
            <p className="text-lg text-gray-600">Sistema transparente y justo para clasificar equipos de Ultimate</p>
          </div>

          {/* Step 1: Tournament Participation */}
          <div className="py-12 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-1 text-center lg:text-left lg:w-2/3">
                <div className="flex items-center justify-center lg:justify-start mb-3">
                  <span className="bg-blue-500 text-white text-sm font-bold px-3 py-1 rounded-full mr-3">PASO 1</span>
                  <h3 className="text-2xl font-bold text-gray-900">Participación en Torneos</h3>
                </div>
                <p className="text-lg text-gray-700 mb-6">
                  Los equipos obtienen puntos en base a las posiciones obtenidas en los compiten en torneos oficiales de la FEDV: <strong>Campeonatos de España</strong> (1ª y 2ª División) y <strong>Campeonatos Regionales</strong> (en las modalidades en las que haya). Cada combinación de modalidad y superficie tiene su propio ranking independiente.
                </p>

                <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-8 shadow-lg border border-gray-100">
                  <div className="flex items-center justify-center mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">🏆</span>
                      </div>
                      <h4 className="text-xl font-bold text-gray-800">Rankings por Modalidad</h4>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Playa Section */}
                    <div className="relative">
                      <div className="absolute -top-2 -left-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">🏖️</span>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200 shadow-md">
                        <div className="flex items-center mb-4">
                          <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                          <h5 className="text-lg font-bold text-blue-800">Playa</h5>
                        </div>
                        <div className="space-y-3">
                          <div className="group p-4 bg-white rounded-lg border border-blue-200 hover:shadow-md transition-all duration-200 hover:border-blue-300">
            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                                <span className="font-medium text-gray-700">Mixto</span>
                              </div>
                              <div className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded-full">
                                MIXED
                              </div>
                            </div>
                          </div>
                          <div className="group p-4 bg-white rounded-lg border border-blue-200 hover:shadow-md transition-all duration-200 hover:border-blue-300">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                                <span className="font-medium text-gray-700">Open</span>
                              </div>
                              <div className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded-full">
                                OPEN
                              </div>
                            </div>
                          </div>
                          <div className="group p-4 bg-white rounded-lg border border-blue-200 hover:shadow-md transition-all duration-200 hover:border-blue-300">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                                <span className="font-medium text-gray-700">Women</span>
                              </div>
                              <div className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded-full">
                                WOMEN
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Césped Section */}
                    <div className="relative">
                      <div className="absolute -top-2 -left-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">🌱</span>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200 shadow-md">
                        <div className="flex items-center mb-4">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                          <h5 className="text-lg font-bold text-green-800">Césped</h5>
                        </div>
                        <div className="space-y-3">
                          <div className="group p-4 bg-white rounded-lg border border-green-200 hover:shadow-md transition-all duration-200 hover:border-green-300">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                                <span className="font-medium text-gray-700">Mixto</span>
                              </div>
                              <div className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-full">
                                MIXED
                              </div>
                            </div>
                          </div>
                          <div className="group p-4 bg-white rounded-lg border border-green-200 hover:shadow-md transition-all duration-200 hover:border-green-300">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                                <span className="font-medium text-gray-700">Open</span>
                              </div>
                              <div className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-full">
                                OPEN
                              </div>
                            </div>
                          </div>
                          <div className="group p-4 bg-white rounded-lg border border-green-200 hover:shadow-md transition-all duration-200 hover:border-green-300">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                                <span className="font-medium text-gray-700">Women</span>
                              </div>
                              <div className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-full">
                                WOMEN
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Footer info */}
                  <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <span className="font-semibold text-gray-700">6 rankings independientes</span> que se combinan para crear rankings generales
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Points Calculation */}
          <div className="py-12 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row-reverse items-center gap-8">
              <div className="flex-1 text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start mb-3">
                  <span className="bg-green-500 text-white text-sm font-bold px-3 py-1 rounded-full mr-3">PASO 2</span>
                  <h3 className="text-2xl font-bold text-gray-900">Cálculo de Puntos</h3>
                </div>
                <p className="text-lg text-gray-700 mb-4">
                  Los puntos se calculan aplicando tres factores: <strong>puntos base por posición</strong> en cada campeonato regional o nacional, <strong>peso por antigüedad de temporada</strong> (las 4 temporadas más recientes) y <strong>coeficiente regional</strong> aplicado a los campeonatos regionales.
                </p>
                
                <div className="bg-white rounded-lg p-6 shadow-sm mb-4">
                  <h4 className="font-semibold text-gray-900 mb-4">Tabla de Puntos por Posición</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                      <h5 className="font-medium text-gray-900 mb-2 text-center">🏆 1ª División</h5>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between p-2 bg-yellow-50 rounded">
                          <span>1º lugar</span>
                          <span className="font-mono font-semibold">1000 pts</span>
                        </div>
                        <div className="flex justify-between p-2 bg-gray-50 rounded">
                          <span>2º lugar</span>
                          <span className="font-mono font-semibold">850 pts</span>
                        </div>
                        <div className="flex justify-between p-2 bg-orange-50 rounded">
                          <span>3º lugar</span>
                          <span className="font-mono font-semibold">725 pts</span>
                        </div>
                        <div className="flex justify-between p-2 bg-gray-50 rounded">
                          <span>4º lugar</span>
                          <span className="font-mono font-semibold">625 pts</span>
                        </div>
                        <div className="flex justify-between p-2 bg-gray-50 rounded">
                          <span>5º lugar</span>
                          <span className="font-mono font-semibold">520 pts</span>
                        </div>
                        <div className="text-center text-gray-500 text-xs py-1">
                          ⋯
                        </div>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2 text-center">🥈 2ª División</h5>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between p-2 bg-yellow-50 rounded">
                          <span>1º lugar</span>
                          <span className="font-mono font-semibold">230 pts</span>
                        </div>
                        <div className="flex justify-between p-2 bg-gray-50 rounded">
                          <span>2º lugar</span>
                          <span className="font-mono font-semibold">195 pts</span>
                        </div>
                        <div className="flex justify-between p-2 bg-orange-50 rounded">
                          <span>3º lugar</span>
                          <span className="font-mono font-semibold">165 pts</span>
                        </div>
                        <div className="flex justify-between p-2 bg-gray-50 rounded">
                          <span>4º lugar</span>
                          <span className="font-mono font-semibold">140 pts</span>
                        </div>
                        <div className="flex justify-between p-2 bg-gray-50 rounded">
                          <span>5º lugar</span>
                          <span className="font-mono font-semibold">120 pts</span>
                        </div>
                        <div className="text-center text-gray-500 text-xs py-1">
                          ⋯
                        </div>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2 text-center">🏅 Regionales</h5>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between p-2 bg-yellow-50 rounded">
                          <span>1º lugar</span>
                          <div className="text-right">
                            <span className="font-mono font-semibold">140 pts</span>
                            <span className="text-xs text-gray-500 ml-1">x coef. regional</span>
                          </div>
                        </div>
                        <div className="flex justify-between p-2 bg-gray-50 rounded">
                          <span>2º lugar</span>
                          <div className="text-right">
                            <span className="font-mono font-semibold">120 pts</span>
                            <span className="text-xs text-gray-500 ml-1">x coef. regional</span>
                          </div>
                        </div>
                        <div className="flex justify-between p-2 bg-orange-50 rounded">
                          <span>3º lugar</span>
                          <div className="text-right">
                            <span className="font-mono font-semibold">100 pts</span>
                            <span className="text-xs text-gray-500 ml-1">x coef. regional</span>
                          </div>
                        </div>
                        <div className="flex justify-between p-2 bg-gray-50 rounded">
                          <span>4º lugar</span>
                          <div className="text-right">
                            <span className="font-mono font-semibold">85 pts</span>
                            <span className="text-xs text-gray-500 ml-1">x coef. regional</span>
                          </div>
                        </div>
                        <div className="flex justify-between p-2 bg-gray-50 rounded">
                          <span>5º lugar</span>
                          <div className="text-right">
                            <span className="font-mono font-semibold">72 pts</span>
                            <span className="text-xs text-gray-500 ml-1">x coef. regional</span>
                          </div>
                        </div>
                        <div className="text-center text-gray-500 text-xs py-1">
                          ⋯
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Step 3: Time Weighting */}
          <div className="py-12 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-1 text-center lg:text-left lg:w-2/3">
                <div className="flex items-center justify-center lg:justify-start mb-3">
                  <span className="bg-yellow-500 text-white text-sm font-bold px-3 py-1 rounded-full mr-3">PASO 3</span>
                  <h3 className="text-2xl font-bold text-gray-900">Peso Temporal</h3>
                </div>
                <p className="text-lg text-gray-700 mb-4">
                  Los puntos se ponderan según la antigüedad de la temporada, dando más importancia a los resultados más recientes.
                </p>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-gray-900">Temporada Actual</div>
                      <div className="text-yellow-600 font-semibold">100%</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-gray-900">1 año atrás</div>
                      <div className="text-yellow-600 font-semibold">80%</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-gray-900">2 años atrás</div>
                      <div className="text-yellow-600 font-semibold">50%</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-gray-900">3 años atrás</div>
                      <div className="text-yellow-600 font-semibold">20%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: Regional Coefficient */}
          <div className="py-12 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-1 text-center lg:text-left lg:w-2/3">
                <div className="flex items-center justify-center lg:justify-start mb-3">
                  <span className="bg-indigo-500 text-white text-sm font-bold px-3 py-1 rounded-full mr-3">PASO 4</span>
                  <h3 className="text-2xl font-bold text-gray-900">Coeficiente Regional</h3>
                </div>
                <p className="text-lg text-gray-700 mb-4">
                  Se suman los puntos de todos los equipos de cada región en campeonatos nacionales (1ª y 2ª división). El coeficiente se calcula proporcionalmente entre 0.8 y 1.2: la región con más puntos nacionales tiene coeficiente 1.2, la que menos tiene 0.8.
                </p>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-gray-900">Región Líder</div>
                      <div className="text-indigo-600 font-semibold">Coef. 1.2</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-gray-900">Regiones Medias</div>
                      <div className="text-indigo-600 font-semibold">Coef. 0.9-1.1</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-gray-900">Región Menor</div>
                      <div className="text-indigo-600 font-semibold">Coef. 0.8</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 5: Final Ranking */}
          <div className="py-12">
            <div className="flex flex-col lg:flex-row-reverse items-center gap-8">
              <div className="flex-1 text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start mb-3">
                  <span className="bg-purple-500 text-white text-sm font-bold px-3 py-1 rounded-full mr-3">PASO 5</span>
                  <h3 className="text-2xl font-bold text-gray-900">Rankings Combinados</h3>
                </div>
                <p className="text-lg text-gray-700 mb-4">
                  Mediante la suma de diversos rankings se obtienen rankings combinados, así como un ranking global de equipos o de clubes.
                </p>
                
                <div className="bg-white rounded-lg p-6 shadow-sm mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="font-medium text-gray-900">Mixto</div>
                        <div className="text-sm text-gray-600">Playa Mixto + Césped Mixto</div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="font-medium text-gray-900">Women</div>
                        <div className="text-sm text-gray-600">Playa Women + Césped Women</div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="font-medium text-gray-900">Open</div>
                        <div className="text-sm text-gray-600">Playa Open + Césped Open</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="font-medium text-gray-900">Playa</div>
                        <div className="text-sm text-gray-600">Mixto + Open + Women (Playa)</div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="font-medium text-gray-900">Césped</div>
                        <div className="text-sm text-gray-600">Mixto + Open + Women (Césped)</div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="font-medium text-gray-900">Global</div>
                        <div className="text-sm text-gray-600">Todas las modalidades</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-600">
                    <strong>Resultado:</strong> Ranking ordenado de mayor a menor puntuación total, actualizado automáticamente tras cada torneo.
                  </p>
                </div>
              </div>
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

        </>
      )}
    </div>
  )
}

export default HomePage
