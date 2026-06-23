import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapPin, UsersRound, TrendingUp, ChevronRight, Loader2, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { regionsService, getRegionPublicUrl, buildRegionPublicSlugById } from '@/services/apiService'
import hybridRankingService from '@/services/hybridRankingService'
import seasonService from '@/services/seasonService'
import { getRegionalCoefficientBaseSeason } from '@/utils/rankingCalculations'
import { supabase } from '@/services/supabaseService'
import PageContainer from '@/components/layout/PageContainer'
import PageHeader from '@/components/layout/PageHeader'
import StatsCard from '@/components/ui/StatsCard'
import SeasonNavigator, { useSelectedSeason } from '@/components/regions/SeasonNavigator'
import RegionalCoefficientMatrix from '@/components/regions/RegionalCoefficientMatrix'
import RegionalCoefficientBreakdown from '@/components/regions/RegionalCoefficientBreakdown'
import { MODALITY_SHORT, MODALITY_LABELS, getCoefficientColor } from '@/components/regions/constants'

const RegionsPage = () => {
  const [showFormula, setShowFormula] = useState(false)
  const [regionStats, setRegionStats] = useState<{
    mostActive: { name: string; count: number } | null
    pointsByName: Record<string, number>
  }>({ mostActive: null, pointsByName: {} })

  const { data: regionsData, isLoading, error } = useQuery({
    queryKey: ['regions'],
    queryFn: () => regionsService.getAll(),
  })

  const regions = regionsData?.data || []
  const sortedRegions = [...regions].sort((a, b) => a.name.localeCompare(b.name))
  const regionSlugById = useMemo(() => buildRegionPublicSlugById(regions), [regions])

  const { data: coeffSeasonInfo } = useQuery({
    queryKey: ['regional-coeff-season-info'],
    queryFn: async () => {
      const currentSeason = await hybridRankingService.getMostRecentSeason()
      return {
        currentSeason,
        coefficientSeason: getRegionalCoefficientBaseSeason(currentSeason),
      }
    },
  })

  const referenceSeason = coeffSeasonInfo?.coefficientSeason

  const { data: availableSeasons = [] } = useQuery({
    queryKey: ['regional-coefficient-seasons'],
    queryFn: () => seasonService.listRegionalCoefficientSeasons(),
  })

  const selectedSeason = useSelectedSeason(availableSeasons, referenceSeason)

  const { data: regionalCoefficients, isLoading: isLoadingCoeffs } = useQuery({
    queryKey: ['regional-coefficients', referenceSeason],
    queryFn: () => seasonService.getRegionalCoefficients(referenceSeason!),
    enabled: !!referenceSeason,
  })

  const { data: historicalCoefficients, isLoading: isLoadingHistoricalCoeffs } = useQuery({
    queryKey: ['regional-coefficients', selectedSeason],
    queryFn: () => seasonService.getRegionalCoefficients(selectedSeason),
    enabled: !!selectedSeason,
  })

  const { data: breakdown, isLoading: isLoadingBreakdown } = useQuery({
    queryKey: ['regional-coefficient-breakdown', selectedSeason],
    queryFn: () => seasonService.getRegionalCoefficientBreakdown(selectedSeason),
    enabled: !!selectedSeason,
  })

  const coeffMap = new Map<string, Record<string, number>>()
  ;(regionalCoefficients || []).forEach(c => {
    if (!coeffMap.has(c.regionId)) coeffMap.set(c.regionId, {})
    coeffMap.get(c.regionId)![c.modality] = c.coefficient
  })

  useEffect(() => {
    const calculateRegionStats = async () => {
      try {
        const refSeason = await hybridRankingService.getMostRecentSeason()
        const categories = ['beach_mixed', 'beach_open', 'beach_women', 'grass_mixed', 'grass_open', 'grass_women']
        const allCategoryData = await Promise.all(
          categories.map(cat => hybridRankingService.getRankingFromSeasonPoints(cat as never, refSeason))
        )

        const teamGlobalPoints: Record<string, { team: { team_id: string }; totalPoints: number }> = {}
        allCategoryData.forEach(categoryData => {
          categoryData.forEach(team => {
            const teamId = team.team_id
            if (!teamGlobalPoints[teamId]) teamGlobalPoints[teamId] = { team, totalPoints: 0 }
            teamGlobalPoints[teamId].totalPoints += team.total_points || 0
          })
        })

        const globalRanking = Object.values(teamGlobalPoints).map(item => ({
          ...item.team,
          global_points: item.totalPoints,
        }))

        const teamIds = globalRanking.map(team => team.team_id)
        if (!supabase) return
        const { data: teamsData } = await supabase
          .from('teams')
          .select('id, regionId, regions:regionId(id, name)')
          .in('id', teamIds)

        const teamRegionMap = new Map(
          teamsData?.map(team => [team.id, (team.regions as { name?: string } | null)?.name || 'Sin región']) || []
        )

        const regionStatsMap: Record<string, { count: number; totalPoints: number }> = {}
        globalRanking.forEach(team => {
          const regionName = teamRegionMap.get(team.team_id) || 'Sin región'
          if (!regionStatsMap[regionName]) regionStatsMap[regionName] = { count: 0, totalPoints: 0 }
          regionStatsMap[regionName].count++
          regionStatsMap[regionName].totalPoints += team.global_points || 0
        })

        const mostActive = Object.entries(regionStatsMap)
          .map(([name, data]) => ({ name, count: data.count }))
          .sort((a, b) => b.count - a.count)[0]

        const pointsByName = Object.fromEntries(
          Object.entries(regionStatsMap).map(([name, data]) => [name, data.totalPoints])
        )

        setRegionStats({ mostActive: mostActive || null, pointsByName })
      } catch (err) {
        console.error('Error calculando estadísticas de regiones:', err)
      }
    }

    if (regions.length > 0) calculateRegionStats()
  }, [regions])

  const totalRegions = regions.length
  const totalTeams = regions.reduce((sum, r) => sum + (r._count?.teams || r.teams?.length || 0), 0)

  const regionAvgCoefs = regions.map(r => {
    const modCoefs = coeffMap.get(r.id)
    if (!modCoefs) return { name: r.name, avg: 1.0 }
    const vals = Object.values(modCoefs)
    return { name: r.name, avg: vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 1.0 }
  })
  const highestCoef = [...regionAvgCoefs].sort((a, b) => b.avg - a.avg)[0]
  const highestCoefPoints = highestCoef?.name ? regionStats.pointsByName[highestCoef.name] : undefined

  if (error) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 mb-4">Error al cargar las regiones</div>
            <button onClick={() => window.location.reload()} className="btn-primary">Reintentar</button>
          </div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Regiones"
        subtitle={
          referenceSeason
            ? `Coeficientes activos calculados con datos hasta ${referenceSeason} (aplican a regionales ${coeffSeasonInfo?.currentSeason || ''})`
            : 'Explora las regiones participantes en el ranking FEDV'
        }
      />

      {!isLoadingCoeffs && referenceSeason && (regionalCoefficients?.length ?? 0) === 0 && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          No hay coeficientes guardados para la temporada {referenceSeason}. Ejecuta{' '}
          <strong>Reconstruir todo el sistema</strong> en Admin → Temporadas (con sesión iniciada)
          o <code className="bg-amber-100 px-1 rounded">npm run backfill-regional-coefficients</code>.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard icon={MapPin} label="Total regiones" value={totalRegions} />
        <StatsCard
          icon={UsersRound}
          label="Total equipos"
          value={totalTeams}
          iconBgColor="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <StatsCard
          icon={UsersRound}
          label="Región más activa"
          value={regionStats.mostActive?.name || 'N/A'}
          subtitle={`${regionStats.mostActive?.count || 0} equipos`}
          iconBgColor="bg-primary-100"
          iconColor="text-primary-600"
        />
        <StatsCard
          icon={TrendingUp}
          label="Mayor coef. activo"
          value={highestCoef?.name || 'N/A'}
          subtitle={
            highestCoef
              ? `promedio ${highestCoef.avg.toFixed(2)}${highestCoefPoints != null ? ` · ${highestCoefPoints.toFixed(1)} pts` : ''}`
              : undefined
          }
          iconBgColor="bg-emerald-100"
          iconColor="text-emerald-600"
        />
      </div>

      <div className="card mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Histórico de coeficientes</h2>
        <SeasonNavigator
          seasons={availableSeasons}
          defaultSeason={referenceSeason}
          calculationSeason={breakdown?.calculationSeason || selectedSeason}
          appliesToSeason={breakdown?.appliesToSeason}
        />
        <div className="mt-6">
          <RegionalCoefficientMatrix
            regions={sortedRegions}
            coefficients={historicalCoefficients || []}
            season={selectedSeason}
            isLoading={isLoadingHistoricalCoeffs}
            slugById={regionSlugById}
          />
        </div>
        <div className="mt-6">
          <RegionalCoefficientBreakdown
            breakdown={breakdown}
            isLoading={isLoadingBreakdown}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {sortedRegions.map(region => {
            const modCoefs = coeffMap.get(region.id)
            return (
              <Link key={region.id} to={getRegionPublicUrl(region, regionSlugById)} className="card-hover group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">
                        {region.name}
                      </h3>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-primary-600 transition-colors" />
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Equipos:</span>
                    <span className="text-sm font-medium text-slate-900">
                      {region._count?.teams || region.teams?.length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Torneos:</span>
                    <span className="text-sm font-medium text-slate-900">
                      {region._count?.tournaments || region.tournaments?.length || 0}
                    </span>
                  </div>
                </div>

                {modCoefs ? (
                  <div>
                    <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">Coef. por modalidad</p>
                    <div className="grid grid-cols-3 gap-1">
                      {Object.entries(MODALITY_SHORT).map(([mod, short]) => {
                        const coef = modCoefs[mod] ?? 1.0
                        return (
                          <div
                            key={mod}
                            className={`rounded px-1.5 py-1 text-center ${getCoefficientColor(coef)}`}
                            title={MODALITY_LABELS[mod]}
                          >
                            <div className="text-xs font-bold">{coef.toFixed(2)}</div>
                            <div className="text-[10px] opacity-75">{short}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic">Coeficientes pendientes de cálculo</div>
                )}
              </Link>
            )
          })}
        </div>
      )}

      <div className="card mb-8">
        <button
          onClick={() => setShowFormula(v => !v)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-slate-900">Cómo se calcula el coeficiente regional</h3>
          </div>
          {showFormula ? (
            <ChevronUp className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          )}
        </button>

        {showFormula && (
          <div className="mt-6 space-y-4 text-sm text-slate-700">
            <div className="bg-primary-50 rounded-xl p-4">
              <p className="font-mono text-primary-900 text-center text-base">
                coef = clamp(1.0 + (pts_región − media_nacional) / media_nacional × <strong>0.20</strong>, 0.80, 1.20)
              </p>
            </div>

            <div className="space-y-2">
              <p>
                <strong>Paso 1:</strong> Al final de cada temporada, sumamos los puntos que tienen los equipos
                de cada región en el ranking (incluye CE1 y CE2 de las últimas 4 temporadas con coeficiente de
                antigüedad 1.0 / 0.8 / 0.5 / 0.2).
              </p>
              <p>
                <strong>Paso 2:</strong> Calculamos la media nacional: total de puntos de todas las regiones
                dividido entre el número de regiones.
              </p>
              <p>
                <strong>Paso 3:</strong> La desviación de cada región respecto a la media determina el coeficiente.
                Una región con el doble de la media obtiene +20% (máximo). Una región en cero obtiene −20% (mínimo).
              </p>
              <p>
                <strong>El 0.20 no es arbitrario</strong>: es exactamente el tope que se ha fijado (±20%).
                No hay parámetros ocultos.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="text-left p-2 font-medium">Puntos región</th>
                    <th className="text-left p-2 font-medium">Relación con media</th>
                    <th className="text-left p-2 font-medium">Coeficiente</th>
                    <th className="text-left p-2 font-medium">Efecto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-2">≥ doble de la media</td>
                    <td className="p-2">+100% o más</td>
                    <td className="p-2 font-bold text-emerald-700">1.20</td>
                    <td className="p-2">+20% en puntos regionales</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="p-2">50% por encima de la media</td>
                    <td className="p-2">+50%</td>
                    <td className="p-2 font-bold text-primary-700">1.10</td>
                    <td className="p-2">+10% en puntos regionales</td>
                  </tr>
                  <tr>
                    <td className="p-2">Igual a la media</td>
                    <td className="p-2">0%</td>
                    <td className="p-2 font-bold text-slate-700">1.00</td>
                    <td className="p-2">Sin cambio</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="p-2">50% por debajo de la media</td>
                    <td className="p-2">−50%</td>
                    <td className="p-2 font-bold text-amber-700">0.90</td>
                    <td className="p-2">−10% en puntos regionales</td>
                  </tr>
                  <tr>
                    <td className="p-2">Sin puntos</td>
                    <td className="p-2">−100%</td>
                    <td className="p-2 font-bold text-red-700">0.80</td>
                    <td className="p-2">−20% en puntos regionales</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
              <strong>Nota:</strong> El coeficiente se calcula por separado para las 6 modalidades
              (playa mixto, playa open, playa femenino, césped mixto, césped open, césped femenino),
              aunque actualmente solo se aplica a las modalidades que tienen torneos regionales.
              El sistema está preparado para incorporar nuevas modalidades automáticamente.
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  )
}

export default RegionsPage
