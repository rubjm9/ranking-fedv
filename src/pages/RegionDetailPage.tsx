import React, { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Users, Trophy, BarChart3, TrendingUp, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { regionsService } from '@/services/apiService'
import hybridRankingService from '@/services/hybridRankingService'
import seasonService from '@/services/seasonService'
import { supabase } from '@/services/supabaseService'
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

const MODALITIES = [
  { key: 'beach_mixed',  label: 'Playa Mixto',     surface: 'BEACH' },
  { key: 'beach_open',   label: 'Playa Open',       surface: 'BEACH' },
  { key: 'beach_women',  label: 'Playa Femenino',   surface: 'BEACH' },
  { key: 'grass_mixed',  label: 'Césped Mixto',     surface: 'GRASS' },
  { key: 'grass_open',   label: 'Césped Open',      surface: 'GRASS' },
  { key: 'grass_women',  label: 'Césped Femenino',  surface: 'GRASS' },
] as const

type ModalityKey = typeof MODALITIES[number]['key']

const getCoefficientStyle = (coef: number) => {
  if (coef >= 1.15) return { label: 'Alta competitividad', badge: 'badge-success', bar: 'bg-emerald-500' }
  if (coef >= 1.0)  return { label: 'Competitividad media', badge: 'badge-primary', bar: 'bg-primary-500' }
  if (coef >= 0.9)  return { label: 'Competitividad baja', badge: 'badge-warning', bar: 'bg-amber-500' }
  return { label: 'Competitividad muy baja', badge: 'badge-error', bar: 'bg-red-500' }
}

const getTournamentTypeLabel = (type: string) => {
  switch (type) {
    case 'CE1': return 'Campeonato España 1ª división'
    case 'CE2': return 'Campeonato España 2ª división'
    case 'REGIONAL': return 'Campeonato regional'
    default: return type
  }
}

const RegionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [activeModality, setActiveModality] = useState<ModalityKey>('beach_mixed')
  const [showHistory, setShowHistory] = useState(false)

  const { data: regionResponse, isLoading, error } = useQuery({
    queryKey: ['region', id],
    queryFn: () => regionsService.getById(id!),
    enabled: !!id,
  })

  const region = regionResponse?.data

  // Temporada base para coeficientes (T-1 respecto a la actual)
  const { data: referenceSeason } = useQuery({
    queryKey: ['most-recent-season-for-coeff'],
    queryFn: async () => {
      const most = await hybridRankingService.getMostRecentSeason()
      const prevYear = parseInt(most.split('-')[0]) - 1
      const nextYear = (prevYear + 1).toString().slice(-2)
      return `${prevYear}-${nextYear}`
    },
  })

  // Coeficientes de esta región por modalidad
  const { data: modalityCoefficients } = useQuery({
    queryKey: ['region-coefficients', id, referenceSeason],
    queryFn: async () => {
      const all = await seasonService.getRegionalCoefficients(referenceSeason!)
      return all.filter(c => c.regionId === id)
    },
    enabled: !!id && !!referenceSeason,
  })

  // Historial de coeficientes (todas las temporadas)
  const { data: coefficientHistory } = useQuery({
    queryKey: ['region-coefficient-history', id],
    queryFn: () => seasonService.getRegionCoefficientHistory(id!),
    enabled: !!id,
  })

  // Puntos globales por equipo (suma de 6 modalidades)
  const { data: teamPointsMap } = useQuery({
    queryKey: ['region-team-points', id],
    queryFn: async () => {
      const refSeason = await hybridRankingService.getMostRecentSeason()
      const categories = MODALITIES.map(m => m.key)
      const allCategoryData = await Promise.all(
        categories.map(cat => hybridRankingService.getRankingFromSeasonPoints(cat as any, refSeason))
      )
      const pointsByTeam: Record<string, number> = {}
      allCategoryData.forEach(categoryData => {
        categoryData.forEach(team => {
          pointsByTeam[team.team_id] = (pointsByTeam[team.team_id] || 0) + (team.total_points || 0)
        })
      })
      return pointsByTeam
    },
    enabled: !!region,
  })

  // Ranking por modalidad (equipos de la región + posición nacional)
  const { data: modalityRankingData } = useQuery({
    queryKey: ['region-modality-ranking', id, activeModality],
    queryFn: async () => {
      const refSeason = await hybridRankingService.getMostRecentSeason()
      const allTeams = await hybridRankingService.getRankingFromSeasonPoints(activeModality as any, refSeason)

      // Obtener qué equipos pertenecen a esta región
      const { data: regionTeams } = await supabase
        .from('teams')
        .select('id')
        .eq('regionId', id)

      const regionTeamIds = new Set((regionTeams || []).map(t => t.id))

      return allTeams
        .map((t, idx) => ({ ...t, national_position: idx + 1 }))
        .filter(t => regionTeamIds.has(t.team_id))
    },
    enabled: !!id && !!activeModality,
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

  const chartData = teams.slice(0, 8).map(team => ({
    name: team.name.length > 12 ? `${team.name.slice(0, 12)}…` : team.name,
    points: team.points,
  }))

  // Mapa de coeficientes por modalidad para esta región
  const coefByModality = useMemo(() => {
    const map: Record<string, number> = {}
    ;(modalityCoefficients || []).forEach(c => { map[c.modality] = c.coefficient })
    return map
  }, [modalityCoefficients])

  // Agrupar historial por temporada
  const historyBySeasonAndModality = useMemo(() => {
    if (!coefficientHistory) return []
    const seasonMap: Record<string, Record<string, number>> = {}
    coefficientHistory.forEach(c => {
      if (!seasonMap[c.season]) seasonMap[c.season] = {}
      if (c.modality) seasonMap[c.season][c.modality] = c.coefficient
    })
    return Object.entries(seasonMap)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([season, coefs]) => ({ season, coefs }))
  }, [coefficientHistory])

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

  return (
    <PageContainer>
      <PageHeader
        title={region.name}
        subtitle="Región participante en el ranking FEDV"
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: 'Regiones', href: '/regions' },
              { label: region.name },
            ]}
          />
        }
      />

      {/* Stats principales */}
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
          label="Total puntos"
          value={totalPoints.toFixed(0)}
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

      {/* Coeficientes por modalidad */}
      <div className="card mb-8">
        <h2 className="font-display text-lg font-semibold text-slate-900 mb-2">Coeficientes por modalidad</h2>
        <p className="text-sm text-slate-500 mb-4">
          Calculados de los rankings de la temporada {referenceSeason || '—'}. Se aplican a los torneos regionales de la temporada actual.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {MODALITIES.map(({ key, label, surface }) => {
            const coef = coefByModality[key] ?? null
            const style = coef !== null ? getCoefficientStyle(coef) : null
            const pct = coef !== null ? ((coef - 0.80) / (1.20 - 0.80)) * 100 : 50
            return (
              <div key={key} className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">{label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${surface === 'GRASS' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                    {surface === 'GRASS' ? 'Césped' : 'Playa'}
                  </span>
                </div>
                {coef !== null ? (
                  <>
                    <p className="text-2xl font-bold text-slate-900 mb-2">{coef.toFixed(2)}x</p>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-1">
                      <div
                        className={`h-full rounded-full transition-all ${style!.bar}`}
                        style={{ width: `${Math.max(4, pct)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-2">
                      <span>0.80</span>
                      <span>1.00</span>
                      <span>1.20</span>
                    </div>
                    <span className={`text-xs ${style!.badge}`}>{style!.label}</span>
                  </>
                ) : (
                  <p className="text-sm text-slate-400 italic mt-1">Sin datos</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Historial de coeficientes — acordeón */}
      {historyBySeasonAndModality.length > 0 && (
        <div className="card mb-8">
          <button
            onClick={() => setShowHistory(v => !v)}
            className="w-full flex items-center justify-between text-left"
          >
            <h2 className="font-display text-lg font-semibold text-slate-900">Historial de coeficientes</h2>
            {showHistory ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
          </button>
          {showHistory && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left p-2 font-medium text-slate-700">Temporada</th>
                    {MODALITIES.map(m => (
                      <th key={m.key} className="text-center p-2 font-medium text-slate-700 text-xs">{m.label.replace(' ', '\n')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historyBySeasonAndModality.map(({ season, coefs }) => (
                    <tr key={season} className="hover:bg-slate-50">
                      <td className="p-2 font-medium text-slate-900">{season}</td>
                      {MODALITIES.map(m => {
                        const v = coefs[m.key]
                        return (
                          <td key={m.key} className="text-center p-2">
                            {v !== undefined ? (
                              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${getCoefficientStyle(v).badge}`}>
                                {v.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Rankings por modalidad */}
      <div className="card mb-8">
        <h2 className="font-display text-lg font-semibold text-slate-900 mb-4">Clasificación por modalidad</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {MODALITIES.map(m => (
            <button
              key={m.key}
              onClick={() => setActiveModality(m.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeModality === m.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {!modalityRankingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary-600 mr-2" />
            <span className="text-sm text-slate-500">Cargando clasificación...</span>
          </div>
        ) : modalityRankingData.length === 0 ? (
          <EmptyState
            title="Sin datos"
            description={`No hay equipos de ${region.name} en el ranking de ${MODALITIES.find(m => m.key === activeModality)?.label}.`}
          />
        ) : (
          <DataTable caption={`Clasificación ${MODALITIES.find(m => m.key === activeModality)?.label} — ${region.name}`}>
            <DataTableHead>
              <tr>
                <DataTableHeaderCell>Posición Nacional</DataTableHeaderCell>
                <DataTableHeaderCell>Equipo</DataTableHeaderCell>
                <DataTableHeaderCell>Puntos</DataTableHeaderCell>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {modalityRankingData.map(team => (
                <DataTableRow key={team.team_id}>
                  <DataTableCell>
                    <span className={`font-bold ${team.national_position <= 3 ? 'text-amber-600' : team.national_position <= 8 ? 'text-primary-600' : 'text-slate-700'}`}>
                      #{team.national_position}
                    </span>
                  </DataTableCell>
                  <DataTableCell>
                    <Link
                      to={`/teams/${team.team_id}`}
                      className="flex items-center gap-3 font-medium text-slate-900 hover:text-primary-600"
                    >
                      <TeamLogo name={team.team_name} size="sm" />
                      {team.team_name}
                    </Link>
                  </DataTableCell>
                  <DataTableCell>{(team.total_points || 0).toFixed(1)}</DataTableCell>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        )}
      </div>

      {/* Equipos de la región (resumen global) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <h2 className="font-display text-lg font-semibold text-slate-900 mb-4">Equipos de la región</h2>
          {teams.length === 0 ? (
            <EmptyState title="Sin equipos" description="Esta región no tiene equipos registrados." />
          ) : (
            <DataTable caption="Equipos de la región">
              <DataTableHead>
                <tr>
                  <DataTableHeaderCell>Equipo</DataTableHeaderCell>
                  <DataTableHeaderCell>Puntos totales</DataTableHeaderCell>
                  <DataTableHeaderCell>Torneos</DataTableHeaderCell>
                </tr>
              </DataTableHead>
              <DataTableBody>
                {teams.map(team => (
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
                    <DataTableCell>{team.points.toFixed(1)}</DataTableCell>
                    <DataTableCell className="text-slate-500">{team.tournaments}</DataTableCell>
                  </DataTableRow>
                ))}
              </DataTableBody>
            </DataTable>
          )}
        </div>

        <div className="card">
          <h2 className="font-display text-lg font-semibold text-slate-900 mb-4">Puntos por equipo</h2>
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

      {/* Torneos organizados */}
      <div>
        <h2 className="font-display text-lg font-semibold text-slate-900 mb-4">Torneos organizados</h2>
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
                    <span className={tournament.surface === 'GRASS' ? 'surface-badge-grass' : 'surface-badge-beach'}>
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
