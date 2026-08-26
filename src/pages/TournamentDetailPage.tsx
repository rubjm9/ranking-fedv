import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Calendar, MapPin, Trophy, UsersRound, Users, BarChart3, Award, Clock } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { tournamentsService, getTeamPublicUrl, getTournamentPublicUrl } from '@/services/apiService'
import seasonService from '@/services/seasonService'
import {
  buildRegionalCoefficientLookup,
  formatInteger,
  formatSeasonFromYear,
  getPreviousSeasonLabel,
  getWeightedRegionalPoints,
  roundPoints,
} from '@/utils/rankingCalculations'
import { translateSurface, translateModality, translateTournamentType } from '@/utils/translations'
import TeamLogo from '@/components/ui/TeamLogo'
import ShareButton from '@/components/ui/ShareButton'
import PageContainer from '@/components/layout/PageContainer'
import PageHeader from '@/components/layout/PageHeader'
import PageHeroStatsBar from '@/components/layout/PageHeroStatsBar'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import EmptyState from '@/components/ui/EmptyState'
import DataTable from '@/components/ui/DataTable'
import DetailHeaderSkeleton from '@/components/ui/DetailHeaderSkeleton'
import ContentGridSkeleton from '@/components/ui/ContentGridSkeleton'
import TableSkeleton from '@/components/ui/TableSkeleton'
import { usePageMeta } from '@/hooks/usePageMeta'

interface Tournament {
  id: string
  name: string
  year: number
  type: string
  surface: string
  category: string
  regionId?: string
  region?: {
    id: string
    name: string
    coefficient: number
  }
  startDate?: string
  endDate?: string
  location?: string
  description?: string
  season?: string
  split?: string
  is_finished?: boolean
  regional_coefficient?: number
  positions?: Position[]
}

interface Position {
  id: string
  tournamentId: string
  teamId: string
  position: number
  points: number
  team?: {
    id: string
    name: string
    region?: {
      name: string
    }
  }
}

interface TeamPosition {
  id: string
  position: number
  team: {
    id: string
    name: string
    region: string
    regionId?: string
    logo?: string | null
  }
  basePoints: number
  points: number
  coefficient: number
}

interface RegionStats {
  name: string
  teams: number
  percentage: number
  color: string
}

const iconClass = 'h-5 w-5 text-content-subtle mr-3 flex-shrink-0'

const TOURNAMENT_TYPE_HEADING: Record<string, string> = {
  CE1: 'Campeonato de España 1ª División',
  CE2: 'Campeonato de España 2ª División',
  REGIONAL: 'Campeonato Regional',
}

const parseLocalDate = (dateString: string): Date => {
  if (dateString.includes('T')) return new Date(dateString)
  return new Date(`${dateString}T00:00:00`)
}

const formatSpanishDay = (date: Date, includeYear: boolean): string => {
  const day = date.getDate()
  const month = date.toLocaleDateString('es-ES', { month: 'long' })
  if (!includeYear) return `${day} de ${month}`
  return `${day} de ${month} de ${date.getFullYear()}`
}

/** Rango de fechas tipo "6 y 7 de marzo de 2026". */
const formatTournamentDateRange = (startDate?: string, endDate?: string): string | null => {
  if (!startDate && !endDate) return null
  if (startDate && !endDate) return formatSpanishDay(parseLocalDate(startDate), true)
  if (!startDate && endDate) return formatSpanishDay(parseLocalDate(endDate), true)

  const start = parseLocalDate(startDate!)
  const end = parseLocalDate(endDate!)

  if (start.toDateString() === end.toDateString()) {
    return formatSpanishDay(start, true)
  }

  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    const month = start.toLocaleDateString('es-ES', { month: 'long' })
    return `${start.getDate()} y ${end.getDate()} de ${month} de ${start.getFullYear()}`
  }

  if (start.getFullYear() === end.getFullYear()) {
    return `${formatSpanishDay(start, false)} y ${formatSpanishDay(end, true)}`
  }

  return `${formatSpanishDay(start, true)} – ${formatSpanishDay(end, true)}`
}

const buildTournamentHeroTitle = (tournament: Tournament): string => {
  const typeLabel = TOURNAMENT_TYPE_HEADING[tournament.type] || translateTournamentType(tournament.type)
  const modality = `${translateSurface(tournament.surface)} ${translateModality(tournament.category)}`
  const season = formatSeasonFromYear(tournament.year)
  const parts = [typeLabel]

  if (tournament.type === 'REGIONAL' && tournament.region?.name) {
    parts.push(tournament.region.name)
  }

  parts.push(modality, season)
  return parts.join(' · ')
}

const buildTournamentHeroSubtitle = (tournament: Tournament): string | undefined => {
  const parts = [
    tournament.location?.trim() || null,
    formatTournamentDateRange(tournament.startDate, tournament.endDate),
  ].filter(Boolean) as string[]

  return parts.length > 0 ? parts.join(', ') : undefined
}

const buildTournamentBreadcrumbLabel = (tournament: Tournament): string => {
  const modality = `${translateSurface(tournament.surface)} ${translateModality(tournament.category)}`
  const season = formatSeasonFromYear(tournament.year)
  if (tournament.type === 'REGIONAL' && tournament.region?.name) {
    return `${tournament.region.name} · ${modality} · ${season}`
  }
  return `${modality} · ${season}`
}

const IconFrisbee = ({ className = iconClass }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
  </svg>
)

const IconSpain = ({ className = iconClass }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M5 9.5 6.5 6.5 9.5 4.5 13 4 16.5 6 18.5 9.5 19 13 18 16.5 15.5 19.5 12 20.5 8.5 19 6 16 5 12.5Z" />
    <circle cx="19.5" cy="12.5" r="1" fill="currentColor" stroke="none" />
    <circle cx="20.8" cy="14.2" r="0.6" fill="currentColor" stroke="none" />
  </svg>
)

const TournamentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  
  // Obtener datos del torneo usando React Query
  const { data: tournamentData, isLoading: tournamentLoading, error: tournamentError } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => tournamentsService.getById(id!),
    enabled: !!id,
    retry: 1
  })

  const tournament = tournamentData?.data

  const heroTitle = tournament ? buildTournamentHeroTitle(tournament) : undefined
  const heroSubtitle = tournament ? buildTournamentHeroSubtitle(tournament) : undefined
  const breadcrumbLabel = tournament ? buildTournamentBreadcrumbLabel(tournament) : undefined

  usePageMeta({
    title: heroTitle || tournament?.name,
    description: heroTitle
      ? `Clasificación y puntos otorgados en ${heroTitle}.`
      : undefined,
  })

  const isRegional = tournament?.type === 'REGIONAL'
  const tournamentSeason = tournament?.year ? formatSeasonFromYear(tournament.year) : null
  const coefficientBaseSeason = tournamentSeason
    ? getPreviousSeasonLabel(tournamentSeason)
    : null

  const { data: regionalCoefficients } = useQuery({
    queryKey: ['tournament-regional-coefficients', coefficientBaseSeason],
    queryFn: () => seasonService.getRegionalCoefficients(coefficientBaseSeason!),
    enabled: isRegional && !!coefficientBaseSeason,
  })

  // Procesar posiciones: en torneos REGIONAL los puntos mostrados incluyen el coeficiente.
  const coefficientLookup = React.useMemo(() => {
    if (!coefficientBaseSeason || !regionalCoefficients?.length) return new Map<string, number>()
    return buildRegionalCoefficientLookup(
      regionalCoefficients.map(c => ({ ...c, season: coefficientBaseSeason }))
    )
  }, [coefficientBaseSeason, regionalCoefficients])

  const positions: TeamPosition[] = React.useMemo(() => {
    if (!tournament?.positions || !tournamentSeason) return []

    return tournament.positions
      .map(pos => {
        const teamRegionId =
          (pos.teams as any)?.regionId ||
          (pos.teams as any)?.region?.id ||
          tournament.regionId ||
          tournament.region?.id

        const basePoints = pos.points || 0
        const weighted = getWeightedRegionalPoints(
          basePoints,
          tournament.type,
          tournament.surface,
          tournament.category,
          teamRegionId,
          tournamentSeason,
          coefficientLookup
        )

        return {
          id: pos.id,
          position: pos.position,
          team: {
            id: pos.teams?.id || `unknown-${pos.position}`,
            name: pos.teams?.name || `Equipo Posición ${pos.position}`,
            region: pos.teams?.region?.name || tournament.region?.name || 'Sin región',
            regionId: teamRegionId,
            logo: pos.teams?.logo ?? null,
          },
          basePoints: weighted.basePoints,
          points: weighted.points,
          coefficient: weighted.coefficient,
        }
      })
      .sort((a, b) => a.position - b.position)
  }, [tournament, tournamentSeason, coefficientLookup])


  // Calcular estadísticas de región basadas en datos reales
  const regionStats: RegionStats[] = React.useMemo(() => {
    const regionCounts: { [key: string]: number } = {}
    positions.forEach(pos => {
      const regionName = pos.team.region
      regionCounts[regionName] = (regionCounts[regionName] || 0) + 1
    })

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']
    return Object.entries(regionCounts).map(([name, teams], index) => ({
      name,
      teams,
      percentage: (teams / positions.length) * 100,
      color: colors[index % colors.length]
    }))
  }, [positions])

  // Calcular estadísticas del torneo
  const totalPoints = roundPoints(positions.reduce((sum, pos) => sum + pos.points, 0))
  const totalTeams = positions.length

  // Función para obtener el icono de posición
  const getPositionIcon = (position: number) => {
    if (position === 1) return <Award className="h-5 w-5 text-yellow-500" />
    if (position === 2) return <Award className="h-5 w-5 text-content-subtle" />
    if (position === 3) return <Award className="h-5 w-5 text-orange-500" />
    return <Trophy className="h-4 w-4 text-content-subtle" />
  }

  // Función para formatear fechas
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Sin fecha'
    
    // Si ya tiene formato ISO completo, usarlo directamente
    let date: Date
    if (dateString.includes('T')) {
      date = new Date(dateString)
    } else {
      // Si solo tiene fecha, agregar hora para evitar zona horaria
      date = new Date(dateString + 'T00:00:00')
    }
    
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (tournamentLoading) {
    return (
      <PageContainer>
        <DetailHeaderSkeleton />
        <ContentGridSkeleton />
        <TableSkeleton rows={10} columns={5} showLeadingAvatar />
      </PageContainer>
    )
  }

  if (tournamentError) {
    return (
      <PageContainer>
        <PageHeader title="Error al cargar el campeonato" />
        <EmptyState
          icon={Trophy}
          title="Error al cargar el campeonato"
          description="No se pudo cargar la información del campeonato."
          actionLink={{
            label: 'Volver a campeonatos',
            href: '/campeonatos',
          }}
        />
      </PageContainer>
    )
  }

  if (!tournament) {
    return (
      <PageContainer>
        <PageHeader title="Campeonato no encontrado" />
        <EmptyState
          icon={Trophy}
          title="Campeonato no encontrado"
          description="El campeonato que buscas no existe o ha sido eliminado."
          actionLink={{
            label: 'Volver a campeonatos',
            href: '/campeonatos',
          }}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title={heroTitle || tournament.name}
        subtitle={heroSubtitle}
        breadcrumbs={
          <Breadcrumbs
            variant="dark"
            items={[
              { label: 'Campeonatos', href: '/campeonatos' },
              { label: breadcrumbLabel || tournament.name },
            ]}
          />
        }
        actions={
          <ShareButton
            url={getTournamentPublicUrl(tournament)}
            title={`${heroTitle || tournament.name} - Ranking FEDV`}
            description={`Clasificación y puntos otorgados en ${heroTitle || tournament.name}`}
            variant="dark"
            size="sm"
          />
        }
        statsBar={
          <PageHeroStatsBar
            items={[
              {
                icon: MapPin,
                label: 'Ubicación',
                value: tournament.location || 'Sin ubicación',
              },
              {
                icon: Calendar,
                label: 'Año',
                value: tournament.year,
                raw: true,
              },
              {
                icon: UsersRound,
                label: 'Nº equipos',
                value: totalTeams,
              },
              {
                icon: BarChart3,
                label: 'Puntos repartidos',
                value: totalPoints,
              },
            ]}
          />
        }
      />

        {/* Información del campeonato y distribución por regiones */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Información del campeonato - 2/3 */}
          <div className="lg:col-span-2">
            <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
              <h2 className="text-xl font-semibold text-content mb-4">Sobre el campeonato</h2>
              
              <p className="text-content-muted leading-relaxed mb-6">
                {tournament.description || 'El campeonato más importante de España para equipos de primera división. Celebrado en diferentes ciudades cada año con la participación de los mejores equipos del país.'}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Trophy className="h-5 w-5 text-content-subtle mr-3" />
                    <span className="text-content-muted">Tipo:</span>
                    <span className="ml-2 font-medium text-content">{translateTournamentType(tournament.type)}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <IconFrisbee />
                    <span className="text-content-muted">Superficie:</span>
                    <span className="ml-2 font-medium text-content">{translateSurface(tournament.surface)}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-content-subtle mr-3" />
                    <span className="text-content-muted">Categoría:</span>
                    <span className="ml-2 font-medium text-content">{translateModality(tournament.category)}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <IconSpain />
                    <span className="text-content-muted">Región:</span>
                    <span className="ml-2 font-medium text-content">
                      {tournament.type === 'REGIONAL' ? (tournament.region?.name || 'Sin región') : 'Nacional'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-content-subtle mr-3" />
                    <span className="text-content-muted">Inicio:</span>
                    <span className="ml-2 font-medium text-content">{formatDate(tournament.startDate)}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-content-subtle mr-3" />
                    <span className="text-content-muted">Fin:</span>
                    <span className="ml-2 font-medium text-content">{formatDate(tournament.endDate)}</span>
                  </div>

                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-content-subtle mr-3" />
                    <span className="text-content-muted">Ubicación:</span>
                    <span className="ml-2 font-medium text-content">{tournament.location || 'Sin ubicación'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Distribución por regiones - 1/3 */}
          {regionStats.length > 0 && (
            <div className="lg:col-span-1">
              <div className="bg-surface rounded-lg shadow-sm border border-line p-6">
                <h2 className="text-xl font-semibold text-content mb-4">Distribución por regiones</h2>
                
                <div className="flex justify-center mb-4">
                  <ResponsiveContainer width={200} height={200}>
                    <PieChart>
                      <Pie
                        data={regionStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={1}
                        dataKey="teams"
                      >
                        {regionStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-2">
                  {regionStats.map((region, index) => (
                    <div key={index} className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: region.color }}
                      />
                      <span className="text-sm text-content">{region.name}</span>
                      <span className="ml-auto text-sm text-content-muted">{region.teams}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Resultados finales */}
        <div className="bg-surface rounded-lg shadow-sm border border-line p-8">
          <h2 className="text-2xl font-bold text-content mb-2">Resultados finales</h2>
          {isRegional && coefficientBaseSeason && (
            <p className="text-sm text-content-muted mb-6">
              Coeficiente regional de la temporada {coefficientBaseSeason} aplicado a los puntos base del campeonato.
            </p>
          )}
          {!isRegional && <div className="mb-4" />}
          {positions.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="No hay resultados disponibles"
              description="Este campeonato aún no tiene resultados registrados."
            />
          ) : (
            <DataTable caption="Resultados finales del campeonato" darkHeader={false}>
              <thead className="bg-surface-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-content-subtle uppercase tracking-wider">
                      Posición
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-content-subtle uppercase tracking-wider">
                      Equipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-content-subtle uppercase tracking-wider">
                      Región
                    </th>
                    {isRegional && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-content-subtle uppercase tracking-wider">
                        Coeficiente
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-content-subtle uppercase tracking-wider">
                      Puntos
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-surface divide-y divide-line">
                  {positions.map((position) => (
                    <tr key={position.id} className="hover:bg-surface-muted transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getPositionIcon(position.position)}
                          <span className="ml-2 text-sm font-medium text-content">
                            {position.position}°
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <TeamLogo 
                              name={position.team.name} 
                              logo={position.team.logo} 
                              size="md"
                            />
                          </div>
                          <div className="ml-4">
                            <Link
                              to={getTeamPublicUrl(position.team)}
                              className="text-sm font-medium text-content hover:text-link transition-colors"
                            >
                              {position.team.name}
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-content">{position.team.region}</div>
                      </td>
                      {isRegional && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-content">
                            {position.coefficient.toFixed(2)}x
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-content">{formatInteger(position.points)}</div>
                        {isRegional && position.coefficient !== 1 && (
                          <div className="text-xs text-content-subtle">
                            base {formatInteger(position.basePoints)}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
            </DataTable>
          )}
        </div>
    </PageContainer>
  )
}

export default TournamentDetailPage
