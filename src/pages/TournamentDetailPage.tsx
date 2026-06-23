import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Calendar, MapPin, Trophy, UsersRound, Users, BarChart3, Award, Clock } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { tournamentsService } from '@/services/apiService'
import seasonService from '@/services/seasonService'
import {
  buildRegionalCoefficientLookup,
  formatPoints,
  formatSeasonFromYear,
  getPreviousSeasonLabel,
  getWeightedRegionalPoints,
  roundPoints,
} from '@/utils/rankingCalculations'
import { translateSurface, translateModality, translateTournamentType, getStatusLabel, getStatusColor } from '@/utils/translations'
import { isTournamentFinished } from '@/utils/tournamentUtils'
import TeamLogo from '@/components/ui/TeamLogo'
import PageContainer from '@/components/layout/PageContainer'
import PageHeader from '@/components/layout/PageHeader'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import StatsCard from '@/components/ui/StatsCard'
import EmptyState from '@/components/ui/EmptyState'
import DataTable from '@/components/ui/DataTable'
import DetailHeaderSkeleton from '@/components/ui/DetailHeaderSkeleton'
import StatsGridSkeleton from '@/components/ui/StatsGridSkeleton'
import ContentGridSkeleton from '@/components/ui/ContentGridSkeleton'
import TableSkeleton from '@/components/ui/TableSkeleton'

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

const iconClass = 'h-5 w-5 text-slate-400 mr-3 flex-shrink-0'

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

  const isRegional = tournament?.type === 'REGIONAL'
  const isFinished = tournament ? isTournamentFinished(tournament) : false
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
    if (position === 2) return <Award className="h-5 w-5 text-slate-400" />
    if (position === 3) return <Award className="h-5 w-5 text-orange-500" />
    return <Trophy className="h-4 w-4 text-slate-400" />
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
        <DetailHeaderSkeleton variant="default" />
        <StatsGridSkeleton />
        <ContentGridSkeleton />
        <TableSkeleton rows={10} columns={5} showLeadingAvatar />
      </PageContainer>
    )
  }

  if (tournamentError) {
    return (
      <PageContainer>
        <PageHeader title="Error al cargar el torneo" />
        <EmptyState
          icon={Trophy}
          title="Error al cargar el torneo"
          description="No se pudo cargar la información del torneo."
          actionLink={{
            label: 'Volver a torneos',
            href: '/tournaments',
          }}
        />
      </PageContainer>
    )
  }

  if (!tournament) {
    return (
      <PageContainer>
        <PageHeader title="Torneo no encontrado" />
        <EmptyState
          icon={Trophy}
          title="Torneo no encontrado"
          description="El torneo que buscas no existe o ha sido eliminado."
          actionLink={{
            label: 'Volver a torneos',
            href: '/tournaments',
          }}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title={tournament.name}
        subtitle={translateTournamentType(tournament.type)}
        breadcrumbs={
          <Breadcrumbs
            variant="dark"
            items={[
              { label: 'Torneos', href: '/tournaments' },
              { label: tournament.name },
            ]}
          />
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard icon={Calendar} label="Año" value={tournament.year} />
        <StatsCard icon={UsersRound} label="Equipos" value={totalTeams} iconColor="text-emerald-600" />
        <StatsCard icon={BarChart3} label="Puntos repartidos" value={formatPoints(totalPoints)} iconColor="text-accent-600" />
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center">
            <div className="mr-3 flex h-12 w-12 shrink-0 items-center justify-center">
              <Trophy className="h-7 w-7 text-primary-600" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Estado</p>
              <span className={`inline-flex mt-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(isFinished)}`}>
                {getStatusLabel(isFinished)}
              </span>
            </div>
          </div>
        </div>
      </div>

        {/* Información del torneo y distribución por regiones */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Información del torneo - 2/3 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Sobre el torneo</h2>
              
              <p className="text-slate-700 leading-relaxed mb-6">
                {tournament.description || 'El campeonato más importante de España para equipos de primera división. Celebrado en diferentes ciudades cada año con la participación de los mejores equipos del país.'}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Trophy className="h-5 w-5 text-slate-400 mr-3" />
                    <span className="text-slate-600">Tipo:</span>
                    <span className="ml-2 font-medium text-slate-900">{translateTournamentType(tournament.type)}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <IconFrisbee />
                    <span className="text-slate-600">Superficie:</span>
                    <span className="ml-2 font-medium text-slate-900">{translateSurface(tournament.surface)}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-slate-400 mr-3" />
                    <span className="text-slate-600">Categoría:</span>
                    <span className="ml-2 font-medium text-slate-900">{translateModality(tournament.category)}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <IconSpain />
                    <span className="text-slate-600">Región:</span>
                    <span className="ml-2 font-medium text-slate-900">
                      {tournament.type === 'REGIONAL' ? (tournament.region?.name || 'Sin región') : 'Nacional'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-slate-400 mr-3" />
                    <span className="text-slate-600">Inicio:</span>
                    <span className="ml-2 font-medium text-slate-900">{formatDate(tournament.startDate)}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-slate-400 mr-3" />
                    <span className="text-slate-600">Fin:</span>
                    <span className="ml-2 font-medium text-slate-900">{formatDate(tournament.endDate)}</span>
                  </div>

                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-slate-400 mr-3" />
                    <span className="text-slate-600">Ubicación:</span>
                    <span className="ml-2 font-medium text-slate-900">{tournament.location || 'Sin ubicación'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Distribución por regiones - 1/3 */}
          {regionStats.length > 0 && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Distribución por regiones</h2>
                
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
                      <span className="text-sm text-slate-900">{region.name}</span>
                      <span className="ml-auto text-sm text-slate-600">{region.teams}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Resultados finales */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Resultados finales</h2>
          {isRegional && coefficientBaseSeason && (
            <p className="text-sm text-slate-600 mb-6">
              Coeficiente regional de la temporada {coefficientBaseSeason} aplicado a los puntos base del campeonato.
            </p>
          )}
          {!isRegional && <div className="mb-4" />}
          {positions.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="No hay resultados disponibles"
              description="Este torneo aún no tiene resultados registrados."
            />
          ) : (
            <DataTable caption="Resultados finales del torneo" darkHeader={false}>
              <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Posición
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Equipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Región
                    </th>
                    {isRegional && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Coeficiente
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Puntos
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {positions.map((position) => (
                    <tr key={position.id} className="hover:bg-secondary-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getPositionIcon(position.position)}
                          <span className="ml-2 text-sm font-medium text-slate-900">
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
                            <div className="text-sm font-medium text-slate-900">
                              {position.team.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">{position.team.region}</div>
                      </td>
                      {isRegional && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900">
                            {position.coefficient.toFixed(2)}x
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{formatPoints(position.points)}</div>
                        {isRegional && position.coefficient !== 1 && (
                          <div className="text-xs text-slate-500">
                            base {position.basePoints}
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
