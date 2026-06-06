import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Trophy, Users, MapPin, Calendar, BarChart3, TrendingUp, TrendingDown, Eye, Sun, Leaf, Medal, Award } from 'lucide-react'
import { homePageService, HomePageTeam, HomePageRegion, HomePageTournament, HomePageStats, RankingHistory } from '@/services/homePageService'
import TeamLogo from '@/components/ui/TeamLogo'

const HomePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [selectedYear, setSelectedYear] = useState('all')
  const [teams, setTeams] = useState<HomePageTeam[]>([])
  const [teamsByCategory, setTeamsByCategory] = useState<{[key: string]: HomePageTeam[]}>({})
  const [regions, setRegions] = useState<HomePageRegion[]>([])
  const [completedTournaments, setCompletedTournaments] = useState<HomePageTournament[]>([])
  const [upcomingTournaments, setUpcomingTournaments] = useState<HomePageTournament[]>([])
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
        completedTournamentsData,
        upcomingTournamentsData,
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
        homePageService.getCompletedTournaments(4),
        homePageService.getUpcomingTournaments(4),
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
      setCompletedTournaments(completedTournamentsData)
      setUpcomingTournaments(upcomingTournamentsData)
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
    return <BarChart3 className="h-4 w-4 text-slate-400" />
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
      case 'upcoming': return 'badge-primary'
      case 'ongoing': return 'badge-success'
      case 'completed': return 'badge-secondary'
      default: return 'badge-secondary'
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
    <div className="min-h-screen bg-secondary-50">
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-slate-600">Cargando datos...</span>
        </div>
      ) : (
        <>
      {/* Hero Section */}
      <div className="relative bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 hero-dots"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 tracking-tight">
              Ranking <span className="text-accent-400">FEDV</span>
            </h1>
            <p className="text-lg md:text-xl mb-10 text-slate-400 max-w-2xl mx-auto">
              El ranking oficial de Ultimate Frisbee en España
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/ranking" className="btn-primary px-8 py-3 text-base font-semibold">
                Ver ranking completo
              </Link>
              <Link
                to="/teams"
                className="border border-slate-600 text-slate-300 px-8 py-3 rounded-xl font-semibold hover:border-slate-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                Explorar equipos
              </Link>
            </div>
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-slate-800 pt-10">
              <div className="text-center">
                <div className="font-display text-3xl font-bold text-white">{mainStats.totalTeams}</div>
                <div className="text-sm text-slate-400 mt-1">Equipos Activos</div>
              </div>
              <div className="text-center">
                <div className="font-display text-3xl font-bold text-white">{mainStats.totalTournaments}</div>
                <div className="text-sm text-slate-400 mt-1">Torneos</div>
              </div>
              <div className="text-center">
                <div className="font-display text-3xl font-bold text-white">{mainStats.totalRegions}</div>
                <div className="text-sm text-slate-400 mt-1">Regiones</div>
              </div>
              <div className="text-center">
                <div className="font-display text-3xl font-bold text-white">{mainStats.averagePoints.toLocaleString()}</div>
                <div className="text-sm text-slate-400 mt-1">Puntos Promedio</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Ranking Section - 6 Small Tables */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
              <h2 className="section-title mb-2">Ranking actual</h2>
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
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
              <div className="px-4 py-3 bg-slate-900 flex items-center justify-between">
                <h3 className="text-white font-semibold text-sm">Playa Mixto</h3>
                <span className="text-xs font-medium text-primary-300 bg-primary-900/40 px-2 py-0.5 rounded-full">BEACH</span>
              </div>
              <div className="data-table-wrapper">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-secondary-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Pos</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Equipo</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {teamsByCategory['beach_mixed']?.slice(0, 5).map((team, index) => (
                      <tr key={team.id} className="hover:bg-secondary-50">
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-slate-900">{index + 1}</span>
                            {getChangeIcon(team.change)}
              </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <TeamLogo name={team.name} logo={team.logo} size="sm" />
                            <div className="ml-2">
                              <div className="text-sm font-medium text-slate-900">{team.name}</div>
                              <div className="text-xs text-slate-500">{team.region}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="text-sm font-medium text-slate-900">{team.points.toFixed(1)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
                <Link
                  to="/ranking/beach-mixed"
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Ver ranking completo →
              </Link>
            </div>
          </div>

            {/* Playa Women */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
              <div className="px-4 py-3 bg-slate-900 flex items-center justify-between">
                <h3 className="text-white font-semibold text-sm">Playa Women</h3>
                <span className="text-xs font-medium text-primary-300 bg-primary-900/40 px-2 py-0.5 rounded-full">BEACH</span>
              </div>
          <div className="data-table-wrapper">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-secondary-50">
                <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Pos</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Equipo</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Pts</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                    {teamsByCategory['beach_women']?.slice(0, 5).map((team, index) => (
                  <tr key={team.id} className="hover:bg-secondary-50">
                        <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                            <span className="text-sm font-medium text-slate-900">{index + 1}</span>
                            {getChangeIcon(team.change)}
              </div>
                    </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <TeamLogo name={team.name} logo={team.logo} size="sm" />
                            <div className="ml-2">
                              <div className="text-sm font-medium text-slate-900">{team.name}</div>
                              <div className="text-xs text-slate-500">{team.region}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="text-sm font-medium text-slate-900">{team.points.toFixed(1)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
                      <Link
                  to="/ranking/beach-women"
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Ver ranking completo →
                </Link>
                        </div>
            </div>

            {/* Playa Open */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
              <div className="px-4 py-3 bg-slate-900 flex items-center justify-between">
                <h3 className="text-white font-semibold text-sm">Playa Open</h3>
                <span className="text-xs font-medium text-primary-300 bg-primary-900/40 px-2 py-0.5 rounded-full">BEACH</span>
              </div>
              <div className="data-table-wrapper">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-secondary-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Pos</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Equipo</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {teamsByCategory['beach_open']?.slice(0, 5).map((team, index) => (
                      <tr key={team.id} className="hover:bg-secondary-50">
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-slate-900">{index + 1}</span>
                            {getChangeIcon(team.change)}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <TeamLogo name={team.name} logo={team.logo} size="sm" />
                            <div className="ml-2">
                              <div className="text-sm font-medium text-slate-900">{team.name}</div>
                              <div className="text-xs text-slate-500">{team.region}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="text-sm font-medium text-slate-900">{team.points.toFixed(1)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
                <Link
                  to="/ranking/beach-open"
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Ver ranking completo →
                      </Link>
              </div>
            </div>

            {/* Césped Mixto */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
              <div className="px-4 py-3 bg-slate-900 flex items-center justify-between">
                <h3 className="text-white font-semibold text-sm">Césped Mixto</h3>
                <span className="text-xs font-medium text-emerald-300 bg-emerald-900/40 px-2 py-0.5 rounded-full">GRASS</span>
              </div>
              <div className="data-table-wrapper">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-secondary-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Pos</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Equipo</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {teamsByCategory['grass_mixed']?.slice(0, 5).map((team, index) => (
                      <tr key={team.id} className="hover:bg-secondary-50">
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-slate-900">{index + 1}</span>
                            {getChangeIcon(team.change)}
                          </div>
                    </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <TeamLogo name={team.name} logo={team.logo} size="sm" />
                            <div className="ml-2">
                              <div className="text-sm font-medium text-slate-900">{team.name}</div>
                              <div className="text-xs text-slate-500">{team.region}</div>
                            </div>
                      </div>
                    </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="text-sm font-medium text-slate-900">{team.points.toFixed(1)}</span>
                    </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
                <Link
                  to="/ranking/grass-mixed"
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Ver ranking completo →
                </Link>
            </div>
          </div>

            {/* Césped Women */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
              <div className="px-4 py-3 bg-slate-900 flex items-center justify-between">
                <h3 className="text-white font-semibold text-sm">Césped Women</h3>
                <span className="text-xs font-medium text-emerald-300 bg-emerald-900/40 px-2 py-0.5 rounded-full">GRASS</span>
              </div>
          <div className="data-table-wrapper">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-secondary-50">
                <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Pos</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Equipo</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Pts</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                    {teamsByCategory['grass_women']?.slice(0, 5).map((team, index) => (
                  <tr key={team.id} className="hover:bg-secondary-50">
                        <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                            <span className="text-sm font-medium text-slate-900">{index + 1}</span>
                            {getChangeIcon(team.change)}
                      </div>
                    </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <TeamLogo name={team.name} logo={team.logo} size="sm" />
                            <div className="ml-2">
                              <div className="text-sm font-medium text-slate-900">{team.name}</div>
                              <div className="text-xs text-slate-500">{team.region}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="text-sm font-medium text-slate-900">{team.points.toFixed(1)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
                      <Link
                  to="/ranking/grass-women"
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Ver ranking completo →
                </Link>
              </div>
            </div>

            {/* Césped Open */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
              <div className="px-4 py-3 bg-slate-900 flex items-center justify-between">
                <h3 className="text-white font-semibold text-sm">Césped Open</h3>
                <span className="text-xs font-medium text-emerald-300 bg-emerald-900/40 px-2 py-0.5 rounded-full">GRASS</span>
              </div>
              <div className="data-table-wrapper">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-secondary-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Pos</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Equipo</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {teamsByCategory['grass_open']?.slice(0, 5).map((team, index) => (
                      <tr key={team.id} className="hover:bg-secondary-50">
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-slate-900">{index + 1}</span>
                            {getChangeIcon(team.change)}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <TeamLogo name={team.name} logo={team.logo} size="sm" />
                            <div className="ml-2">
                              <div className="text-sm font-medium text-slate-900">{team.name}</div>
                              <div className="text-xs text-slate-500">{team.region}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="text-sm font-medium text-slate-900">{team.points.toFixed(1)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
                <Link
                  to="/ranking/grass-open"
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
            <h2 className="section-title mb-2">¿Cómo funciona el ranking?</h2>
            <p className="text-lg text-slate-600">
              Sistema transparente y justo para clasificar equipos de Ultimate.{' '}
              <Link to="/about" className="text-primary-600 hover:text-primary-700 font-medium">
                Más información →
              </Link>
            </p>
          </div>

          {/* Step 1: Tournament Participation */}
          <div className="py-12 border-b border-slate-200">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-1 text-center lg:text-left lg:w-2/3">
                <div className="flex items-center justify-center lg:justify-start mb-3">
                  <span className="bg-primary-600 text-white text-xl font-bold w-12 h-12 rounded-full flex items-center justify-center mr-3">1</span>
                  <h3 className="text-2xl font-bold text-slate-900">Participación en Torneos</h3>
                </div>
                <p className="text-lg text-slate-700 mb-6">
                  Los equipos obtienen puntos en base a las posiciones obtenidas en los compiten en torneos oficiales de la FEDV: <strong>Campeonatos de España</strong> (1ª y 2ª División) y <strong>Campeonatos Regionales</strong> (en las categorías en las que haya). Cada categoría tiene su propio ranking independiente.
                </p>

                <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-center mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-white" />
                      </div>
                      <h4 className="text-xl font-bold text-slate-800">Rankings por categoría</h4>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Playa Section */}
                    <div className="relative">
                      <div className="absolute -top-2 -left-2 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                        <Sun className="w-3 h-3 text-white" />
                      </div>
                      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <div className="flex items-center mb-4">
                          <div className="w-3 h-3 bg-primary-600 rounded-full mr-3"></div>
                          <h5 className="text-lg font-bold text-slate-800">Playa</h5>
                        </div>
                        <div className="space-y-3">
                          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-sm transition-all duration-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
                                <span className="font-medium text-slate-700">Mixto</span>
                              </div>
                              <div className="text-xs text-primary-600 font-semibold bg-primary-50 px-2 py-1 rounded-full">
                                MIXED
                              </div>
                            </div>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-sm transition-all duration-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
                                <span className="font-medium text-slate-700">Open</span>
                              </div>
                              <div className="text-xs text-primary-600 font-semibold bg-primary-50 px-2 py-1 rounded-full">
                                OPEN
                              </div>
                            </div>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-sm transition-all duration-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
                                <span className="font-medium text-slate-700">Women</span>
                              </div>
                              <div className="text-xs text-primary-600 font-semibold bg-primary-50 px-2 py-1 rounded-full">
                                WOMEN
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Césped Section */}
                    <div className="relative">
                      <div className="absolute -top-2 -left-2 w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center">
                        <Leaf className="w-3 h-3 text-white" />
                      </div>
                      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                        <div className="flex items-center mb-4">
                          <div className="w-3 h-3 bg-emerald-600 rounded-full mr-3"></div>
                          <h5 className="text-lg font-bold text-slate-800">Césped</h5>
                        </div>
                        <div className="space-y-3">
                          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-sm transition-all duration-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                                <span className="font-medium text-slate-700">Mixto</span>
                              </div>
                              <div className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-full">
                                MIXED
                              </div>
                            </div>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-sm transition-all duration-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                                <span className="font-medium text-slate-700">Open</span>
                              </div>
                              <div className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-full">
                                OPEN
                              </div>
                            </div>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-sm transition-all duration-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                                <span className="font-medium text-slate-700">Women</span>
                              </div>
                              <div className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-full">
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
                    <p className="text-sm text-slate-600 bg-secondary-50 rounded-lg p-3 border border-slate-200">
                      <span className="font-semibold text-slate-700">6 rankings independientes</span> que se combinan para crear rankings generales
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Points Calculation */}
          <div className="py-12 border-b border-slate-200">
            <div className="flex flex-col lg:flex-row-reverse items-center gap-8">
              <div className="flex-1 text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start mb-3">
                  <span className="bg-primary-600 text-white text-xl font-bold w-12 h-12 rounded-full flex items-center justify-center mr-3">2</span>
                  <h3 className="text-2xl font-bold text-slate-900">Cálculo de Puntos</h3>
                </div>
                <p className="text-lg text-slate-700 mb-4">
                  Los puntos se calculan aplicando tres factores: <strong>puntos base por posición</strong> en cada campeonato regional o nacional, <strong>peso por antigüedad de temporada</strong> (las 4 temporadas más recientes) y <strong>coeficiente regional</strong> aplicado a los campeonatos regionales.
                </p>
                
                <div className="bg-white rounded-lg p-6 shadow-sm mb-4">
                  <h4 className="font-semibold text-slate-900 mb-4">Tabla de Puntos por Posición</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                      <h5 className="font-medium text-slate-900 mb-2 text-center flex items-center justify-center gap-1">
                        <Trophy className="w-4 h-4 text-accent-500" /> 1ª división
                      </h5>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between p-2 bg-accent-50 rounded">
                          <span>1º lugar</span>
                          <span className="font-mono font-semibold">1000 pts</span>
                        </div>
                        <div className="flex justify-between p-2 bg-secondary-50 rounded">
                          <span>2º lugar</span>
                          <span className="font-mono font-semibold">850 pts</span>
                        </div>
                        <div className="flex justify-between p-2 bg-slate-100 rounded">
                          <span>3º lugar</span>
                          <span className="font-mono font-semibold">725 pts</span>
                        </div>
                        <div className="flex justify-between p-2 bg-secondary-50 rounded">
                          <span>4º lugar</span>
                          <span className="font-mono font-semibold">625 pts</span>
                        </div>
                        <div className="flex justify-between p-2 bg-secondary-50 rounded">
                          <span>5º lugar</span>
                          <span className="font-mono font-semibold">520 pts</span>
                        </div>
                        <div className="text-center text-slate-500 text-xs py-1">
                          ⋯
                        </div>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-slate-900 mb-2 text-center flex items-center justify-center gap-1">
                        <Medal className="w-4 h-4 text-slate-500" /> 2ª división
                      </h5>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between p-2 bg-accent-50 rounded">
                          <span>1º lugar</span>
                          <span className="font-mono font-semibold">230 pts</span>
                        </div>
                        <div className="flex justify-between p-2 bg-secondary-50 rounded">
                          <span>2º lugar</span>
                          <span className="font-mono font-semibold">195 pts</span>
                        </div>
                        <div className="flex justify-between p-2 bg-slate-100 rounded">
                          <span>3º lugar</span>
                          <span className="font-mono font-semibold">165 pts</span>
                        </div>
                        <div className="flex justify-between p-2 bg-secondary-50 rounded">
                          <span>4º lugar</span>
                          <span className="font-mono font-semibold">140 pts</span>
                        </div>
                        <div className="flex justify-between p-2 bg-secondary-50 rounded">
                          <span>5º lugar</span>
                          <span className="font-mono font-semibold">120 pts</span>
                        </div>
                        <div className="text-center text-slate-500 text-xs py-1">
                          ⋯
                        </div>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium text-slate-900 mb-2 text-center flex items-center justify-center gap-1">
                        <Award className="w-4 h-4 text-primary-500" /> Regionales
                      </h5>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between p-2 bg-accent-50 rounded">
                          <span>1º lugar</span>
                          <div className="text-right">
                            <span className="font-mono font-semibold">140 pts</span>
                            <span className="text-xs text-slate-500 ml-1">x coef. regional</span>
                          </div>
                        </div>
                        <div className="flex justify-between p-2 bg-secondary-50 rounded">
                          <span>2º lugar</span>
                          <div className="text-right">
                            <span className="font-mono font-semibold">120 pts</span>
                            <span className="text-xs text-slate-500 ml-1">x coef. regional</span>
                          </div>
                        </div>
                        <div className="flex justify-between p-2 bg-slate-100 rounded">
                          <span>3º lugar</span>
                          <div className="text-right">
                            <span className="font-mono font-semibold">100 pts</span>
                            <span className="text-xs text-slate-500 ml-1">x coef. regional</span>
                          </div>
                        </div>
                        <div className="flex justify-between p-2 bg-secondary-50 rounded">
                          <span>4º lugar</span>
                          <div className="text-right">
                            <span className="font-mono font-semibold">85 pts</span>
                            <span className="text-xs text-slate-500 ml-1">x coef. regional</span>
                          </div>
                        </div>
                        <div className="flex justify-between p-2 bg-secondary-50 rounded">
                          <span>5º lugar</span>
                          <div className="text-right">
                            <span className="font-mono font-semibold">72 pts</span>
                            <span className="text-xs text-slate-500 ml-1">x coef. regional</span>
                          </div>
                        </div>
                        <div className="text-center text-slate-500 text-xs py-1">
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
          <div className="py-12 border-b border-slate-200">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-1 text-center lg:text-left lg:w-2/3">
                <div className="flex items-center justify-center lg:justify-start mb-3">
                  <span className="bg-primary-600 text-white text-xl font-bold w-12 h-12 rounded-full flex items-center justify-center mr-3">3</span>
                  <h3 className="text-2xl font-bold text-slate-900">Peso Temporal</h3>
                </div>
                <p className="text-lg text-slate-700 mb-4">
                  Los puntos se ponderan según la antigüedad de la temporada, dando más importancia a los resultados más recientes.
                </p>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-slate-900">Temporada Actual</div>
                      <div className="text-primary-600 font-semibold">100%</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-slate-900">1 año atrás</div>
                      <div className="text-primary-600 font-semibold">80%</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-slate-900">2 años atrás</div>
                      <div className="text-primary-600 font-semibold">50%</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-slate-900">3 años atrás</div>
                      <div className="text-primary-600 font-semibold">20%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: Regional Coefficient */}
          <div className="py-12 border-b border-slate-200">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-1 text-center lg:text-left lg:w-2/3">
                <div className="flex items-center justify-center lg:justify-start mb-3">
                  <span className="bg-primary-600 text-white text-xl font-bold w-12 h-12 rounded-full flex items-center justify-center mr-3">4</span>
                  <h3 className="text-2xl font-bold text-slate-900">Coeficiente Regional</h3>
                </div>
                <p className="text-lg text-slate-700 mb-4">
                  Se suman los puntos de todos los equipos de cada región en campeonatos nacionales (1ª y 2ª división). El coeficiente se calcula proporcionalmente entre 0.8 y 1.2: la región con más puntos nacionales tiene coeficiente 1.2, la que menos tiene 0.8.
                </p>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-slate-900">Región Líder</div>
                      <div className="text-primary-600 font-semibold">Coef. 1.2</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-slate-900">Regiones Medias</div>
                      <div className="text-primary-600 font-semibold">Coef. 0.9-1.1</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-slate-900">Región Menor</div>
                      <div className="text-primary-600 font-semibold">Coef. 0.8</div>
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
                  <span className="bg-primary-600 text-white text-xl font-bold w-12 h-12 rounded-full flex items-center justify-center mr-3">5</span>
                  <h3 className="text-2xl font-bold text-slate-900">Rankings Combinados</h3>
                </div>
                <p className="text-lg text-slate-700 mb-4">
                  Mediante la suma de diversos rankings se obtienen rankings combinados, así como un ranking global de equipos o de clubes.
                </p>
                
                <div className="bg-white rounded-lg p-6 shadow-sm mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="p-3 bg-secondary-50 rounded-lg border border-slate-200">
                        <div className="font-medium text-slate-900">Mixto</div>
                        <div className="text-sm text-slate-600">Playa Mixto + Césped Mixto</div>
                      </div>
                      <div className="p-3 bg-secondary-50 rounded-lg border border-slate-200">
                        <div className="font-medium text-slate-900">Women</div>
                        <div className="text-sm text-slate-600">Playa Women + Césped Women</div>
                      </div>
                      <div className="p-3 bg-secondary-50 rounded-lg border border-slate-200">
                        <div className="font-medium text-slate-900">Open</div>
                        <div className="text-sm text-slate-600">Playa Open + Césped Open</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 bg-secondary-50 rounded-lg border border-slate-200">
                        <div className="font-medium text-slate-900">Playa</div>
                        <div className="text-sm text-slate-600">Mixto + Open + Women (Playa)</div>
                      </div>
                      <div className="p-3 bg-secondary-50 rounded-lg border border-slate-200">
                        <div className="font-medium text-slate-900">Césped</div>
                        <div className="text-sm text-slate-600">Mixto + Open + Women (Césped)</div>
                      </div>
                      <div className="p-3 bg-secondary-50 rounded-lg border border-slate-200">
                        <div className="font-medium text-slate-900">Global</div>
                        <div className="text-sm text-slate-600">Todas las superficies</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-slate-600">
                    <strong>Resultado:</strong> Ranking ordenado de mayor a menor puntuación total, actualizado automáticamente tras cada torneo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Torneos Pasados y Próximos Torneos */}
        <div className="text-center mb-12">
          <h2 className="section-title mb-2">Torneos</h2>
          <p className="text-lg text-slate-600">Consulta los torneos pasados y próximos</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Torneos Pasados */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Torneos pasados</h3>
            <div className="space-y-4">
              {completedTournaments.map((tournament) => (
                <Link
                  key={tournament.id}
                  to={`/tournaments/${tournament.id}`}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-secondary-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
                      <Trophy className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">{tournament.name}</h4>
                      <p className="text-sm text-slate-500">
                        {getTournamentTypeLabel(tournament.type)} • {tournament.teams} equipos
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600">
                      Finalizado
                    </span>
                    <p className="text-sm text-slate-500 mt-1">
                      {new Date(tournament.startDate).toLocaleDateString('es-ES', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric' 
                      })}
                    </p>
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

          {/* Próximos Torneos */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Próximos torneos</h3>
            <div className="space-y-4">
              {upcomingTournaments.map((tournament) => (
                <Link
                  key={tournament.id}
                  to={`/tournaments/${tournament.id}`}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-secondary-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
                      <Calendar className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">{tournament.name}</h4>
                      <p className="text-sm text-slate-500">
                        {getTournamentTypeLabel(tournament.type)} • {tournament.teams} equipos
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-700">
                      Próximo
                    </span>
                    <p className="text-sm text-slate-500 mt-1">
                      {new Date(tournament.startDate).toLocaleDateString('es-ES', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric' 
                      })}
                    </p>
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
            className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow border border-slate-100"
          >
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Users className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-slate-900">Equipos</h3>
                <p className="text-slate-600">Explora todos los equipos participantes</p>
              </div>
            </div>
          </Link>
          <Link
            to="/tournaments"
            className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow border border-slate-100"
          >
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Trophy className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-slate-900">Torneos</h3>
                <p className="text-slate-600">Consulta resultados y calendario</p>
              </div>
            </div>
          </Link>
          <Link
            to="/regions"
            className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow border border-slate-100"
          >
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <MapPin className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-slate-900">Regiones</h3>
                <p className="text-slate-600">Descubre las regiones participantes</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
        </>
      )}
    </div>
  )
}

export default HomePage
