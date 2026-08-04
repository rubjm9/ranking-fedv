import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trophy, UsersRound, MapPin, Calendar, BarChart3, TrendingUp, TrendingDown, Eye, Medal } from 'lucide-react'
import { homePageService, HomePageTeam, HomePageRegion, HomePageTournament, HomePageStats, RankingHistory } from '@/services/homePageService'
import hybridRankingService from '@/services/hybridRankingService'
import SummaryCard from '@/components/ranking/SummaryCard'
import RankingOnboarding from '@/components/home/RankingOnboarding'
import { getCurrentSeasonValue } from '@/utils/tournamentUtils'

const mapTeamsToSummaryData = (teams: HomePageTeam[]) =>
  teams.map((team) => ({
    team_id: team.id,
    team_name: team.name,
    logo: team.logo,
    region_name: team.region,
    total_points: team.points,
    position_change: team.change,
  }))

const CATEGORY_PATHS: Record<string, string> = {
  beach_mixed: '/ranking/beach-mixed',
  beach_women: '/ranking/beach-women',
  beach_open: '/ranking/beach-open',
  grass_mixed: '/ranking/grass-mixed',
  grass_women: '/ranking/grass-women',
  grass_open: '/ranking/grass-open',
}

const HomePage: React.FC = () => {
  const navigate = useNavigate()
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
    totalClubs: 0,
    totalTournaments: 0,
    totalRegions: 0,
    averagePoints: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [currentSeason, setCurrentSeason] = useState(getCurrentSeasonValue)

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
        currentSeasonData,
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
        hybridRankingService.getMostRecentSeason(),
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
      setCurrentSeason(currentSeasonData)
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

  const getRankIcon = (position: number) => {
    if (position === 1) return <Trophy className="w-6 h-6 text-yellow-500" />
    if (position === 2) return <Medal className="w-6 h-6 text-slate-400" />
    if (position === 3) return <Medal className="w-6 h-6 text-orange-500" />
    return <span className="text-sm font-semibold text-slate-500">#{position}</span>
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <BarChart3 className="h-4 w-4 text-slate-400" />
  }

  const getChangeText = (change: number) => {
    if (change > 0) return `+${change}`
    if (change < 0) return `${change}`
    return '='
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
        <div className="flex items-center justify-center min-h-[50vh] pt-[4.75rem]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-slate-600">Cargando datos...</span>
        </div>
      ) : (
        <>
      {/* Hero Section */}
      <div className="relative bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 hero-dots"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 md:pt-32 md:pb-24">
          <div className="text-center">
            <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 tracking-tight">
              Ranking <span className="text-accent-400">FEDV</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
              Propuesta de sistema de ranking de equipos, pendiente de aprobación en su formato definitivo
            </p>
            <p className="mt-3 mb-10">
              <span className="inline-block bg-primary-600/20 text-primary-300 text-sm font-semibold px-3 py-1 rounded-full border border-primary-600/30">
                Temporada {currentSeason}
              </span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/ranking/resumen" className="btn-primary px-8 py-3 text-base font-semibold">
                Ver ranking completo
              </Link>
              <Link
                to="/equipos"
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

        {/* Banner próximo torneo */}
        {upcomingTournaments[0] && (
          <div className="mb-8 bg-primary-50 border border-primary-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center">
                <Calendar className="h-7 w-7 text-primary-600" strokeWidth={1.5} />
              </div>
              <div>
                <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">Próximo torneo</span>
                <p className="font-semibold text-slate-900">{upcomingTournaments[0].name}</p>
                <p className="text-sm text-slate-500">
                  {getTournamentTypeLabel(upcomingTournaments[0].type)}
                  {' · '}
                  {new Date(upcomingTournaments[0].startDate).toLocaleDateString('es-ES', {
                    day: '2-digit', month: 'long', year: 'numeric'
                  })}
                </p>
              </div>
            </div>
            <Link
              to={`/tournaments/${upcomingTournaments[0].id}`}
              className="btn-primary text-sm px-4 py-2 shrink-0"
            >
              Ver detalles
            </Link>
          </div>
        )}

        {/* Ranking Section - 6 Small Tables */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-1">
              <h2 className="section-title mb-0">Ranking actual</h2>
              <Link
                to="/ranking/resumen"
                className="text-primary-600 hover:text-primary-700 font-medium flex items-center"
              >
              Ver ranking completo
                <Eye className="h-4 w-4 ml-1" />
              </Link>
          </div>
          <p className="text-sm text-slate-500 mb-6">Temporada {currentSeason}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SummaryCard
              title="Playa Mixto"
              data={mapTeamsToSummaryData(teamsByCategory['beach_mixed'] || [])}
              category="beach_mixed"
              onViewFull={(category) => navigate(CATEGORY_PATHS[category] || '/ranking/resumen')}
              getRankIcon={getRankIcon}
              getChangeIcon={getChangeIcon}
              getChangeText={getChangeText}
            />
            <SummaryCard
              title="Playa Women"
              data={mapTeamsToSummaryData(teamsByCategory['beach_women'] || [])}
              category="beach_women"
              onViewFull={(category) => navigate(CATEGORY_PATHS[category] || '/ranking/resumen')}
              getRankIcon={getRankIcon}
              getChangeIcon={getChangeIcon}
              getChangeText={getChangeText}
            />
            <SummaryCard
              title="Playa Open"
              data={mapTeamsToSummaryData(teamsByCategory['beach_open'] || [])}
              category="beach_open"
              onViewFull={(category) => navigate(CATEGORY_PATHS[category] || '/ranking/resumen')}
              getRankIcon={getRankIcon}
              getChangeIcon={getChangeIcon}
              getChangeText={getChangeText}
            />
            <SummaryCard
              title="Césped Mixto"
              data={mapTeamsToSummaryData(teamsByCategory['grass_mixed'] || [])}
              category="grass_mixed"
              onViewFull={(category) => navigate(CATEGORY_PATHS[category] || '/ranking/resumen')}
              getRankIcon={getRankIcon}
              getChangeIcon={getChangeIcon}
              getChangeText={getChangeText}
            />
            <SummaryCard
              title="Césped Women"
              data={mapTeamsToSummaryData(teamsByCategory['grass_women'] || [])}
              category="grass_women"
              onViewFull={(category) => navigate(CATEGORY_PATHS[category] || '/ranking/resumen')}
              getRankIcon={getRankIcon}
              getChangeIcon={getChangeIcon}
              getChangeText={getChangeText}
            />
            <SummaryCard
              title="Césped Open"
              data={mapTeamsToSummaryData(teamsByCategory['grass_open'] || [])}
              category="grass_open"
              onViewFull={(category) => navigate(CATEGORY_PATHS[category] || '/ranking/resumen')}
              getRankIcon={getRankIcon}
              getChangeIcon={getChangeIcon}
              getChangeText={getChangeText}
            />
          </div>
        </div>

        {/* Torneos */}
        <div className="text-center mb-12">
          <h2 className="section-title mb-2">Torneos</h2>
          <p className="text-lg text-slate-600">Consulta los torneos próximos y pasados</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Próximos torneos */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Próximos torneos</h3>
            <div className="divide-y divide-slate-100">
              {upcomingTournaments.length === 0 && (
                <p className="text-slate-500 text-sm py-2">No hay torneos próximos programados.</p>
              )}
              {upcomingTournaments.map((tournament) => (
                <Link
                  key={tournament.id}
                  to={`/tournaments/${tournament.id}`}
                  className="flex items-center justify-between py-4 -mx-2 px-2 rounded-lg hover:bg-secondary-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="mr-4 flex h-12 w-12 shrink-0 items-center justify-center">
                      <Calendar className="h-7 w-7 text-primary-600" strokeWidth={1.5} />
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

          {/* Torneos pasados */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Torneos pasados</h3>
            <div className="divide-y divide-slate-100">
              {completedTournaments.map((tournament) => (
                <Link
                  key={tournament.id}
                  to={`/tournaments/${tournament.id}`}
                  className="flex items-center justify-between py-4 -mx-2 px-2 rounded-lg hover:bg-secondary-50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="mr-4 flex h-12 w-12 shrink-0 items-center justify-center">
                      <Trophy className="h-7 w-7 text-primary-600" strokeWidth={1.5} />
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
        </div>

        <RankingOnboarding />

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/equipos"
            className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow border border-slate-100"
          >
            <div className="flex items-center">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center">
                <UsersRound className="h-7 w-7 text-primary-600" strokeWidth={1.5} />
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
              <div className="flex h-12 w-12 shrink-0 items-center justify-center">
                <Trophy className="h-7 w-7 text-primary-600" strokeWidth={1.5} />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-slate-900">Torneos</h3>
                <p className="text-slate-600">Consulta resultados y calendario</p>
              </div>
            </div>
          </Link>
          <Link
            to="/regiones"
            className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow border border-slate-100"
          >
            <div className="flex items-center">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center">
                <MapPin className="h-7 w-7 text-primary-600" strokeWidth={1.5} />
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
