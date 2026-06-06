import React, { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Users, Trophy, BarChart3, TrendingUp, Loader2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { regionsService } from '@/services/apiService'
import hybridRankingService from '@/services/hybridRankingService'
import PageContainer from '@/components/layout/PageContainer'
import PageHeader from '@/components/layout/PageHeader'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import StatsCard from '@/components/ui/StatsCard'
import EmptyState from '@/components/ui/EmptyState'
import TeamLogo from '@/components/ui/TeamLogo'
import DataTable, {
  DataTableHead,
  DataTableHeaderCell,
  DataTableBody,
  DataTableRow,
  DataTableCell,
} from '@/components/ui/DataTable'

const CHART_COLORS = ['#4F46E5', '#F97316', '#10B981', '#6366F1', '#EA580C']

const RegionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  const { data: regionResponse, isLoading, error } = useQuery({
    queryKey: ['region', id],
    queryFn: () => regionsService.getById(id!),
    enabled: !!id,
  })

  const region = regionResponse?.data

  const { data: teamPointsMap } = useQuery({
    queryKey: ['region-team-points', id],
    queryFn: async () => {
      const referenceSeason = await hybridRankingService.getMostRecentSeason()
      const categories = [
        'beach_mixed',
        'beach_open',
        'beach_women',
        'grass_mixed',
        'grass_open',
        'grass_women',
      ] as const
      const allCategoryData = await Promise.all(
        categories.map((cat) =>
          hybridRankingService.getRankingFromSeasonPoints(cat, referenceSeason)
        )
      )
      const pointsByTeam: Record<string, number> = {}
      allCategoryData.forEach((categoryData) => {
        categoryData.forEach((team) => {
          pointsByTeam[team.team_id] =
            (pointsByTeam[team.team_id] || 0) + (team.total_points || 0)
        })
      })
      return pointsByTeam
    },
    enabled: !!region,
  })

  const teams = useMemo(() => {
    if (!region?.teams) return []
    return [...region.teams]
      .map((team: any) => ({
        id: team.id,
        name: team.name,
        logo: team.logo,
        points: teamPointsMap?.[team.id] || 0,
        tournaments: team.positions?.[0]?.count || 0,
      }))
      .sort((a, b) => b.points - a.points)
      .map((team, index) => ({ ...team, currentRank: index + 1 }))
  }, [region, teamPointsMap])

  const tournaments = region?.tournaments || []
  const totalPoints = teams.reduce((sum, t) => sum + t.points, 0)
  const averagePoints = teams.length > 0 ? totalPoints / teams.length : 0

  const chartData = teams.slice(0, 8).map((team) => ({
    name: team.name.length > 12 ? `${team.name.slice(0, 12)}…` : team.name,
    points: team.points,
  }))

  const getCoefficientLevel = (coefficient: number) => {
    if (coefficient >= 1.5) return { label: 'Alto', className: 'badge-success' }
    if (coefficient >= 1.0) return { label: 'Medio', className: 'badge-primary' }
    if (coefficient >= 0.8) return { label: 'Bajo', className: 'badge-warning' }
    return { label: 'Muy bajo', className: 'badge-error' }
  }

  const getTournamentTypeLabel = (type: string) => {
    switch (type) {
      case 'CE1':
        return 'Campeonato España 1ª división'
      case 'CE2':
        return 'Campeonato España 2ª división'
      case 'REGIONAL':
        return 'Campeonato regional'
      default:
        return type
    }
  }

  if (isLoading) {
    return (
      <PageContainer className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        <span className="ml-3 text-slate-600">Cargando región...</span>
      </PageContainer>
    )
  }

  if (error || !region) {
    return (
      <PageContainer>
        <EmptyState
          title="Región no encontrada"
          description="La región que buscas no existe o ha sido eliminada."
          actionLink={{ label: 'Ver regiones', href: '/regions' }}
        />
      </PageContainer>
    )
  }

  const coeffLevel = getCoefficientLevel(region.coefficient)

  return (
    <PageContainer>
      <PageHeader
        title={region.name}
        subtitle={`Coeficiente regional: ${region.coefficient?.toFixed(2) ?? '—'}x`}
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: 'Regiones', href: '/regions' },
              { label: region.name },
            ]}
          />
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard icon={Users} label="Equipos" value={region._count?.teams ?? teams.length} />
        <StatsCard
          icon={Trophy}
          label="Torneos"
          value={region._count?.tournaments ?? tournaments.length}
          iconBgColor="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <StatsCard
          icon={BarChart3}
          label="Coeficiente"
          value={region.coefficient?.toFixed(2) ?? '—'}
          iconBgColor="bg-accent-100"
          iconColor="text-accent-600"
        />
        <StatsCard
          icon={TrendingUp}
          label="Promedio puntos"
          value={averagePoints.toFixed(1)}
          iconBgColor="bg-primary-100"
          iconColor="text-primary-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 card">
          <h2 className="font-display text-lg font-semibold text-slate-900 mb-4">
            Sobre la región
          </h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            {region.description ||
              `Región ${region.name} participante en el ranking oficial FEDV.`}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Total puntos:</span>
                <span className="font-medium text-slate-900">{totalPoints.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Promedio por equipo:</span>
                <span className="font-medium text-slate-900">{averagePoints.toFixed(1)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Nivel coeficiente:</span>
                <span className={`badge ${coeffLevel.className}`}>{coeffLevel.label}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="font-display text-lg font-semibold text-slate-900 mb-4">
            Puntos por equipo
          </h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="points" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-500 text-center py-8">Sin datos de puntos</p>
          )}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="font-display text-lg font-semibold text-slate-900 mb-4">
          Equipos de la región
        </h2>
        {teams.length === 0 ? (
          <EmptyState title="Sin equipos" description="Esta región no tiene equipos registrados." />
        ) : (
          <DataTable caption="Equipos de la región">
            <DataTableHead>
              <tr>
                <DataTableHeaderCell>Equipo</DataTableHeaderCell>
                <DataTableHeaderCell>Ranking</DataTableHeaderCell>
                <DataTableHeaderCell>Puntos</DataTableHeaderCell>
                <DataTableHeaderCell>Torneos</DataTableHeaderCell>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {teams.map((team) => (
                <DataTableRow key={team.id}>
                  <DataTableCell>
                    <Link
                      to={`/teams/${team.id}`}
                      className="flex items-center gap-3 font-medium text-slate-900 hover:text-primary-600"
                    >
                      <TeamLogo name={team.name} logo={team.logo} size="sm" />
                      {team.name}
                    </Link>
                  </DataTableCell>
                  <DataTableCell>#{team.currentRank}</DataTableCell>
                  <DataTableCell>{team.points.toFixed(1)}</DataTableCell>
                  <DataTableCell className="text-slate-500">{team.tournaments}</DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        )}
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold text-slate-900 mb-4">
          Torneos organizados
        </h2>
        {tournaments.length === 0 ? (
          <EmptyState
            title="Sin torneos"
            description="No hay torneos registrados para esta región."
          />
        ) : (
          <DataTable caption="Torneos de la región">
            <DataTableHead>
              <tr>
                <DataTableHeaderCell>Torneo</DataTableHeaderCell>
                <DataTableHeaderCell>Año</DataTableHeaderCell>
                <DataTableHeaderCell>Tipo</DataTableHeaderCell>
                <DataTableHeaderCell>Superficie</DataTableHeaderCell>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {tournaments.map((tournament: any) => (
                <DataTableRow key={tournament.id}>
                  <DataTableCell>
                    <Link
                      to={`/tournaments/${tournament.id}`}
                      className="font-medium text-slate-900 hover:text-primary-600"
                    >
                      {tournament.name}
                    </Link>
                  </DataTableCell>
                  <DataTableCell>{tournament.year}</DataTableCell>
                  <DataTableCell className="text-slate-500">
                    {getTournamentTypeLabel(tournament.type)}
                  </DataTableCell>
                  <DataTableCell>
                    <span
                      className={
                        tournament.surface === 'GRASS'
                          ? 'surface-badge-grass'
                          : 'surface-badge-beach'
                      }
                    >
                      {tournament.surface === 'GRASS' ? 'Césped' : 'Playa'}
                    </span>
                  </DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        )}
      </div>
    </PageContainer>
  )
}

export default RegionDetailPage
